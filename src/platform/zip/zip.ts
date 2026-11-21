// Minimal ZIP (stored entries only, no compression). Used for save export/import and to bundle multi-file
// discs for the emulator. The reader is deliberately strict: it accepts only what the writer produces,
// enforces size/count limits, and never trusts names from the archive (callers validate them again).

const CRC_TABLE = (() => {
  const t = new Uint32Array(256);
  for (let n = 0; n < 256; n++) {
    let c = n;
    for (let k = 0; k < 8; k++) c = c & 1 ? 0xedb88320 ^ (c >>> 1) : c >>> 1;
    t[n] = c >>> 0;
  }
  return t;
})();

export function crc32(data: Uint8Array): number {
  let c = 0xffffffff;
  for (let i = 0; i < data.length; i++) c = CRC_TABLE[(c ^ data[i]!) & 0xff]! ^ (c >>> 8);
  return (c ^ 0xffffffff) >>> 0;
}

export interface ZipEntryInput {
  name: string;
  data: Uint8Array | Blob;
}

const enc = new TextEncoder();
const NAME_RE = /^[A-Za-z0-9][A-Za-z0-9 ._\-/]{0,199}$/;
export const isSafeEntryName = (n: string) => NAME_RE.test(n) && !n.split('/').some((p) => p === '' || p === '.' || p === '..');

/**
 * Builds a stored ZIP as a Blob. Each entry is read into memory once to compute its CRC, so bundling a
 * multi-file disc costs memory equal to its size — the same order as EmulatorJS's whole-file loading (SPIKE-001 A4).
 */
export async function writeZip(entries: ZipEntryInput[]): Promise<Blob> {
  const parts: BlobPart[] = [];
  const central: Uint8Array[] = [];
  let offset = 0;
  for (const e of entries) {
    if (!isSafeEntryName(e.name)) throw new Error(`unsafe zip entry name: ${e.name}`);
    const bytes = e.data instanceof Blob ? new Uint8Array(await e.data.arrayBuffer()) : e.data;
    if (bytes.length >= 0xffffffff) throw new Error('entry too large for zip32');
    const name = enc.encode(e.name);
    const crc = crc32(bytes);
    const local = new DataView(new ArrayBuffer(30));
    local.setUint32(0, 0x04034b50, true);
    local.setUint16(4, 20, true);
    local.setUint16(6, 0x0800, true); // UTF-8 names
    local.setUint16(8, 0, true); // stored
    local.setUint32(14, crc, true);
    local.setUint32(18, bytes.length, true);
    local.setUint32(22, bytes.length, true);
    local.setUint16(26, name.length, true);
    parts.push(local.buffer, name, bytes as BlobPart);
    const cd = new DataView(new ArrayBuffer(46));
    cd.setUint32(0, 0x02014b50, true);
    cd.setUint16(4, 20, true);
    cd.setUint16(6, 20, true);
    cd.setUint16(8, 0x0800, true);
    cd.setUint32(16, crc, true);
    cd.setUint32(20, bytes.length, true);
    cd.setUint32(24, bytes.length, true);
    cd.setUint16(28, name.length, true);
    cd.setUint32(42, offset, true);
    central.push(new Uint8Array(cd.buffer), name);
    offset += 30 + name.length + bytes.length;
  }
  const cdSize = central.reduce((n, c) => n + c.length, 0);
  const end = new DataView(new ArrayBuffer(22));
  end.setUint32(0, 0x06054b50, true);
  end.setUint16(8, entries.length, true);
  end.setUint16(10, entries.length, true);
  end.setUint32(12, cdSize, true);
  end.setUint32(16, offset, true);
  return new Blob([...parts, ...(central as BlobPart[]), end.buffer], { type: 'application/zip' });
}

export interface ZipLimits {
  maxEntries: number;
  maxEntryBytes: number;
  maxTotalBytes: number;
}
export const DEFAULT_LIMITS: ZipLimits = { maxEntries: 512, maxEntryBytes: 16 * 1024 * 1024, maxTotalBytes: 256 * 1024 * 1024 };

export class ZipFormatError extends Error {}

/** Reads a stored ZIP produced by writeZip. Rejects compression, encryption, unsafe names, bad CRCs, and limit breaches. */
export function readZip(buf: Uint8Array, limits: ZipLimits = DEFAULT_LIMITS): Map<string, Uint8Array> {
  const fail = (why: string): never => {
    throw new ZipFormatError(why);
  };
  if (buf.length < 22 || buf.length > limits.maxTotalBytes + 1024 * 1024) fail('archive size out of range');
  const view = new DataView(buf.buffer, buf.byteOffset, buf.byteLength);
  const eocd = buf.length - 22; // no archive comment supported
  if (view.getUint32(eocd, true) !== 0x06054b50) fail('not a supported zip (missing end record)');
  const count = view.getUint16(eocd + 10, true);
  const cdSize = view.getUint32(eocd + 12, true);
  const cdOffset = view.getUint32(eocd + 16, true);
  if (count > limits.maxEntries) fail('too many entries');
  if (cdOffset + cdSize !== eocd) fail('inconsistent central directory');
  const out = new Map<string, Uint8Array>();
  const dec = new TextDecoder('utf-8', { fatal: true });
  let p = cdOffset;
  let total = 0;
  for (let i = 0; i < count; i++) {
    if (p + 46 > eocd || view.getUint32(p, true) !== 0x02014b50) fail('bad central directory entry');
    const flags = view.getUint16(p + 8, true);
    const method = view.getUint16(p + 10, true);
    const crc = view.getUint32(p + 16, true);
    const csize = view.getUint32(p + 20, true);
    const usize = view.getUint32(p + 24, true);
    const nlen = view.getUint16(p + 28, true);
    const xlen = view.getUint16(p + 30, true);
    const clen = view.getUint16(p + 32, true);
    const lho = view.getUint32(p + 42, true);
    if (flags & 0x1) fail('encrypted entries are not supported');
    if (method !== 0 || csize !== usize) fail('only stored (uncompressed) entries are supported');
    if (usize > limits.maxEntryBytes) fail('entry too large');
    total += usize;
    if (total > limits.maxTotalBytes) fail('archive too large');
    const name = dec.decode(buf.subarray(p + 46, p + 46 + nlen));
    if (!isSafeEntryName(name)) fail(`unsafe entry name: ${name}`);
    if (out.has(name)) fail('duplicate entry');
    if (lho + 30 > cdOffset || view.getUint32(lho, true) !== 0x04034b50) fail('bad local header');
    const lnlen = view.getUint16(lho + 26, true);
    const lxlen = view.getUint16(lho + 28, true);
    const start = lho + 30 + lnlen + lxlen;
    if (start + usize > cdOffset) fail('entry data out of range');
    const data = buf.slice(start, start + usize);
    if (crc32(data) !== crc) fail(`CRC mismatch: ${name}`);
    out.set(name, data);
    p += 46 + nlen + xlen + clen;
  }
  return out;
}
