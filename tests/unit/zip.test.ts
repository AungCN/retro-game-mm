import { describe, expect, it } from 'vitest';
import { crc32, isSafeEntryName, readZip, writeZip, ZipFormatError } from '../../src/platform/zip/zip';

const enc = new TextEncoder();
const bytes = async (b: Blob) => new Uint8Array(await b.arrayBuffer());

describe('crc32', () => {
  it('matches the standard check value', () => {
    expect(crc32(enc.encode('123456789'))).toBe(0xcbf43926);
  });
});

describe('zip round trip', () => {
  it('reads back exactly what it wrote', async () => {
    const zip = await writeZip([
      { name: 'backup.json', data: enc.encode('{"a":1}') },
      { name: 'blobs/ps1-player/disc/x/memcard/1', data: new Uint8Array([1, 2, 3]) },
      { name: 'empty.bin', data: new Uint8Array(0) },
    ]);
    const files = readZip(await bytes(zip));
    expect([...files.keys()]).toEqual(['backup.json', 'blobs/ps1-player/disc/x/memcard/1', 'empty.bin']);
    expect(files.get('blobs/ps1-player/disc/x/memcard/1')).toEqual(new Uint8Array([1, 2, 3]));
  });
});

describe('zip safety', () => {
  it.each(['../evil', '/abs', 'a/../b', 'a//b', '.hidden', 'a/./b', 'C:\\x', ''])('rejects unsafe name %j', (n) => {
    expect(isSafeEntryName(n)).toBe(false);
  });

  it.each(['Game (USA) (Track 1).bin', 'Disc [1] & more.cue', "Ninja's Run, Disc 1.m3u", 'ゲーム.chd', 'blobs/ps1-player/disc/x/state/1'])('accepts disc-style name %j', (n) => {
    expect(isSafeEntryName(n)).toBe(true);
  });

  it('refuses to write unsafe names', async () => {
    await expect(writeZip([{ name: '../x', data: new Uint8Array(1) }])).rejects.toThrow(/unsafe/);
  });

  it('detects a tampered entry (CRC mismatch)', async () => {
    const z = await bytes(await writeZip([{ name: 'a.txt', data: enc.encode('hello') }]));
    const at = 30 + 'a.txt'.length;
    z[at] = z[at]! ^ 0xff; // flip a data byte
    expect(() => readZip(z)).toThrow(/CRC/);
  });

  it('rejects compressed entries', async () => {
    const z = await bytes(await writeZip([{ name: 'a.txt', data: enc.encode('hello') }]));
    const cd = z.length - 22 - (46 + 'a.txt'.length);
    new DataView(z.buffer).setUint16(cd + 10, 8, true); // method = deflate
    expect(() => readZip(z)).toThrow(/stored/);
  });

  it('enforces entry count, entry size and total size limits', async () => {
    const z = await bytes(await writeZip([{ name: 'a', data: new Uint8Array(10) }, { name: 'b', data: new Uint8Array(10) }]));
    expect(() => readZip(z, { maxEntries: 1, maxEntryBytes: 100, maxTotalBytes: 100 })).toThrow(/too many/);
    expect(() => readZip(z, { maxEntries: 5, maxEntryBytes: 5, maxTotalBytes: 100 })).toThrow(/too large/);
    expect(() => readZip(z, { maxEntries: 5, maxEntryBytes: 100, maxTotalBytes: 15 })).toThrow();
  });

  it('rejects garbage, truncated archives and trailing data', async () => {
    expect(() => readZip(new Uint8Array(100))).toThrow(ZipFormatError);
    const z = await bytes(await writeZip([{ name: 'a', data: enc.encode('x') }]));
    expect(() => readZip(z.slice(0, z.length - 5))).toThrow(ZipFormatError);
    const padded = new Uint8Array(z.length + 4);
    padded.set(z);
    expect(() => readZip(padded)).toThrow(ZipFormatError);
  });

  it('rejects duplicate entry names', async () => {
    const z = await bytes(await writeZip([{ name: 'a', data: enc.encode('1') }, { name: 'a', data: enc.encode('2') }]));
    expect(() => readZip(z)).toThrow(/duplicate/);
  });
});
