/// <reference lib="webworker" />
// Copies user-selected disc files into the origin private file system in 4 MiB chunks (SPIKE-001: ~720 MB/s in Chrome).
// Internal names are derived from the disc ID only — never from user-controlled file names.

interface CopyRequest {
  op: 'copy';
  discId: string;
  files: File[];
}

const CHUNK = 4 * 1024 * 1024;
const ID_RE = /^[0-9a-f-]{36}$/;

self.onmessage = async (e: MessageEvent<CopyRequest>) => {
  const { discId, files } = e.data;
  const written: string[] = [];
  try {
    if (e.data.op !== 'copy' || !ID_RE.test(discId) || !Array.isArray(files) || files.length > 16) throw new Error('bad request');
    const dir = await navigator.storage.getDirectory();
    for (let i = 0; i < files.length; i++) {
      const file = files[i]!;
      const name = `disc-${discId}-${i}`;
      const handle = await dir.getFileHandle(name, { create: true });
      const access = await (handle as FileSystemFileHandle & { createSyncAccessHandle(): Promise<FileSystemSyncAccessHandle> }).createSyncAccessHandle();
      try {
        access.truncate(0);
        for (let off = 0; off < file.size; off += CHUNK) {
          const buf = new Uint8Array(await file.slice(off, Math.min(off + CHUNK, file.size)).arrayBuffer());
          access.write(buf, { at: off });
        }
        access.flush();
      } finally {
        access.close();
      }
      written.push(name);
    }
    self.postMessage({ ok: true, names: written });
  } catch (err) {
    const dir = await navigator.storage.getDirectory().catch(() => null);
    for (const n of written) await dir?.removeEntry(n).catch(() => undefined); // no partial copies left behind
    self.postMessage({ ok: false, error: err instanceof Error ? err.message : String(err) });
  }
};
