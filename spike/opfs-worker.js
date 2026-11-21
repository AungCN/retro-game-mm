// SPIKE-001 OPFS worker: copy a user-selected File into OPFS with a sync access handle, then stat/read/delete it.
const NAME = 'spike001-disc.bin';
const CHUNK = 4 * 1024 * 1024;

async function dir() { return navigator.storage.getDirectory(); }

async function copy(file) {
  const t0 = performance.now();
  const fh = await (await dir()).getFileHandle(NAME, { create: true });
  const access = await fh.createSyncAccessHandle();
  try {
    access.truncate(0);
    let written = 0;
    for (let off = 0; off < file.size; off += CHUNK) {
      const buf = new Uint8Array(await file.slice(off, Math.min(off + CHUNK, file.size)).arrayBuffer());
      written += access.write(buf, { at: off });
    }
    access.flush();
    const ms = performance.now() - t0;
    return { bytesWritten: written, ms: Math.round(ms), mbPerSec: Math.round(written / 1048576 / (ms / 1000)) };
  } finally {
    access.close();
  }
}

async function stat() {
  try {
    const fh = await (await dir()).getFileHandle(NAME);
    const f = await fh.getFile();
    return { exists: true, sizeBytes: f.size, sizeMB: +(f.size / 1048576).toFixed(1) };
  } catch (e) {
    return { exists: false, error: e.name };
  }
}

async function read() {
  const fh = await (await dir()).getFileHandle(NAME);
  const access = await fh.createSyncAccessHandle();
  try {
    const size = access.getSize();
    const buf = new Uint8Array(CHUNK);
    const t0 = performance.now();
    let bytes = 0;
    for (let off = 0; off < size; off += CHUNK) bytes += access.read(buf, { at: off });
    const ms = performance.now() - t0;
    return { bytes, ms: Math.round(ms), mbPerSec: Math.round(bytes / 1048576 / (ms / 1000)), method: 'syncAccessHandle' };
  } finally {
    access.close();
  }
}

async function remove() {
  try { await (await dir()).removeEntry(NAME); return { deleted: true }; } catch (e) { return { deleted: false, error: e.name }; }
}

self.onmessage = async (e) => {
  const { op, file } = e.data;
  try {
    const result = op === 'copy' ? await copy(file) : op === 'stat' ? await stat() : op === 'read' ? await read() : await remove();
    self.postMessage(result);
  } catch (err) {
    self.postMessage({ error: err?.name ?? 'Error', message: String(err?.message ?? err) });
  }
};
