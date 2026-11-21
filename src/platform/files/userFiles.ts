// User File Service for BYOR discs and BIOS (ADR-0003). Files never leave the device (FR-027).
// Tier 1: persisted FileSystemFileHandles (read-only). Tier 2: OPFS copy (D3 provisional) or session-only files.
import type { AvailabilityState, BrowserTier, DiscLinkSummary } from '../../game-runtime/contracts/types';
import { idbDelete, idbGet, idbPut, idbValues } from '../storage/db';
import { DiscSetError, validateSelection } from './discSets';

export type StorageKind = DiscLinkSummary['storageKind'];

export interface DiscRecord {
  discId: string;
  gameId: string;
  label: string;
  storageKind: StorageKind;
  primary: string;
  fileNames: string[];
  sizeBytes: number;
  fingerprint: string;
  handles?: FileSystemFileHandle[];
  opfsNames?: string[];
  linkedAt: string;
  lastVerifiedAt: string;
}

interface PermissionCapableHandle extends FileSystemFileHandle {
  queryPermission?(d: { mode: 'read' }): Promise<PermissionState>;
  requestPermission?(d: { mode: 'read' }): Promise<PermissionState>;
}

type PickerWindow = Window & {
  showOpenFilePicker?: (o: { multiple: boolean; types?: { description: string; accept: Record<string, string[]> }[]; excludeAcceptAllOption?: boolean }) => Promise<FileSystemFileHandle[]>;
};

const sessionFiles = new Map<string, File[]>();
const LABEL_RE = /^[\p{L}\p{N} ._'()&!,-]{1,60}$/u;

export function sanitizeLabel(input: string, fallback: string): string {
  const s = input.normalize('NFC').trim().replace(/\s+/g, ' ');
  return LABEL_RE.test(s) ? s : fallback.replace(/\.[^.]+$/, '').slice(0, 60).replace(/[^\p{L}\p{N} ._-]/gu, '') || 'My disc';
}

/** Local-only fingerprint: SHA-256 of size + first and last 1 MiB of the primary file. Used to match saves after re-linking. */
export async function fingerprint(file: Blob): Promise<string> {
  const MiB = 1024 * 1024;
  const head = new Uint8Array(await file.slice(0, MiB).arrayBuffer());
  const tail = new Uint8Array(await file.slice(Math.max(0, file.size - MiB)).arrayBuffer());
  const size = new TextEncoder().encode(String(file.size));
  const all = new Uint8Array(size.length + head.length + tail.length);
  all.set(size, 0);
  all.set(head, size.length);
  all.set(tail, size.length + head.length);
  const digest = await crypto.subtle.digest('SHA-256', all);
  return [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

async function copyToOpfs(discId: string, files: File[]): Promise<string[]> {
  const worker = new Worker(new URL('./opfs-worker.ts', import.meta.url), { type: 'module' });
  try {
    return await new Promise<string[]>((resolve, reject) => {
      worker.onmessage = (e: MessageEvent<{ ok: boolean; names?: string[]; error?: string }>) =>
        e.data.ok ? resolve(e.data.names ?? []) : reject(new Error(e.data.error ?? 'OPFS copy failed'));
      worker.onerror = (e) => reject(new Error(e.message || 'OPFS worker error'));
      worker.postMessage({ op: 'copy', discId, files });
    });
  } finally {
    worker.terminate();
  }
}

async function opfsFile(name: string): Promise<File> {
  const dir = await navigator.storage.getDirectory();
  return (await dir.getFileHandle(name)).getFile();
}

async function hasRoomFor(bytes: number): Promise<boolean> {
  try {
    const { quota = 0, usage = 0 } = await navigator.storage.estimate();
    return quota - usage > bytes * 1.1 + 50 * 1024 * 1024;
  } catch {
    return false;
  }
}

export interface LinkOptions {
  gameId: string;
  label: string;
  acceptedExtensions: string[];
  tier: BrowserTier;
  preferOpfsCopy: boolean;
  /** Tier 2 / fallback: files from an <input type="file" multiple>. */
  files?: File[];
}

/** Tier 1 picker; must be called from a user gesture. */
export async function pickWithFileSystemAccess(accepted: string[]): Promise<FileSystemFileHandle[]> {
  const w = window as PickerWindow;
  if (!w.showOpenFilePicker) throw new DiscSetError('File linking is not available in this browser');
  return w.showOpenFilePicker({
    multiple: true,
    excludeAcceptAllOption: true,
    types: [{ description: 'Disc images', accept: { 'application/octet-stream': accepted } }],
  });
}

export async function linkDisc(opts: LinkOptions & { handles?: FileSystemFileHandle[] }): Promise<DiscRecord> {
  if (opts.tier === 'mobile') throw new DiscSetError('Disc linking is not supported on mobile yet');
  const files = opts.handles ? await Promise.all(opts.handles.map((h) => h.getFile())) : (opts.files ?? []);
  const { primary, names } = await validateSelection(
    files.map((f) => ({ name: f.name, size: f.size, text: () => f.text() })),
    opts.acceptedExtensions,
  );
  const primaryFile = files.find((f) => f.name === primary)!;
  const dataFile = files.find((f) => f.name !== primary && !/\.(m3u|cue)$/i.test(f.name)) ?? primaryFile;
  const discId = crypto.randomUUID();
  const sizeBytes = files.reduce((n, f) => n + f.size, 0);
  const now = new Date().toISOString();
  const rec: DiscRecord = {
    discId,
    gameId: opts.gameId,
    label: sanitizeLabel(opts.label, primary),
    storageKind: 'session-file',
    primary,
    fileNames: names,
    sizeBytes,
    fingerprint: await fingerprint(dataFile),
    linkedAt: now,
    lastVerifiedAt: now,
  };
  if (opts.handles) {
    rec.storageKind = 'fs-handle';
    rec.handles = opts.handles;
  } else if (opts.preferOpfsCopy && typeof navigator.storage?.getDirectory === 'function' && (await hasRoomFor(sizeBytes))) {
    rec.storageKind = 'opfs-copy';
    rec.opfsNames = await copyToOpfs(discId, files);
    void navigator.storage.persist?.();
  } else {
    sessionFiles.set(discId, files);
  }
  await idbPut('discs', discId, rec);
  if (rec.storageKind === 'fs-handle') void navigator.storage.persist?.();
  return rec;
}

export async function listDiscs(gameId: string): Promise<DiscRecord[]> {
  return (await idbValues<DiscRecord>('discs')).filter((d) => d.gameId === gameId).sort((a, b) => a.label.localeCompare(b.label));
}

export async function getDisc(discId: string): Promise<DiscRecord | undefined> {
  return idbGet<DiscRecord>('discs', discId);
}

/** Resolves current availability without prompting the user. */
export async function discState(rec: DiscRecord): Promise<AvailabilityState> {
  try {
    if (rec.storageKind === 'fs-handle') {
      for (const h of (rec.handles ?? []) as PermissionCapableHandle[]) {
        const p = (await h.queryPermission?.({ mode: 'read' })) ?? 'granted';
        if (p !== 'granted') return 'NEEDS_PERMISSION';
      }
      await Promise.all((rec.handles ?? []).map((h) => h.getFile()));
      return 'OFFLINE_READY';
    }
    if (rec.storageKind === 'opfs-copy') {
      await Promise.all((rec.opfsNames ?? []).map(opfsFile));
      return 'OFFLINE_READY';
    }
    return sessionFiles.has(rec.discId) ? 'OFFLINE_READY' : 'AWAITING_USER_ROM';
  } catch {
    return 'OFFLINE_UNAVAILABLE';
  }
}

/** Re-grant read access (Tier 1). Must be called from a user gesture. */
export async function requestAccess(rec: DiscRecord): Promise<AvailabilityState> {
  for (const h of (rec.handles ?? []) as PermissionCapableHandle[]) {
    const p = (await h.requestPermission?.({ mode: 'read' })) ?? 'granted';
    if (p !== 'granted') return 'NEEDS_PERMISSION';
  }
  return discState(rec);
}

/** Session-only discs (Tier 2 without copy): re-select files for this session. */
export async function reselectSessionFiles(rec: DiscRecord, files: File[]): Promise<void> {
  const names = new Set(files.map((f) => f.name));
  if (rec.fileNames.some((n) => !names.has(n)) || files.length !== rec.fileNames.length) {
    throw new DiscSetError(`Select the same files as before: ${rec.fileNames.join(', ')}`);
  }
  const dataFile = files.find((f) => f.name !== rec.primary && !/\.(m3u|cue)$/i.test(f.name)) ?? files.find((f) => f.name === rec.primary)!;
  if ((await fingerprint(dataFile)) !== rec.fingerprint) throw new DiscSetError('These files do not match the disc you linked before');
  sessionFiles.set(rec.discId, files);
}

export async function openDiscFiles(rec: DiscRecord): Promise<File[]> {
  if (rec.storageKind === 'fs-handle') return Promise.all((rec.handles ?? []).map((h) => h.getFile()));
  if (rec.storageKind === 'opfs-copy') {
    const files = await Promise.all((rec.opfsNames ?? []).map(opfsFile));
    // OPFS names are internal; restore the user's file names so cue/m3u references still match.
    return files.map((f, i) => new File([f], rec.fileNames[i] ?? f.name));
  }
  const files = sessionFiles.get(rec.discId);
  if (!files) throw new DiscSetError('Select the disc files again for this session');
  return files;
}

export async function removeDisc(rec: DiscRecord): Promise<void> {
  if (rec.storageKind === 'opfs-copy') {
    const dir = await navigator.storage.getDirectory();
    for (const n of rec.opfsNames ?? []) await dir.removeEntry(n).catch(() => undefined);
  }
  sessionFiles.delete(rec.discId);
  await idbDelete('discs', rec.discId);
}

// ---------- BIOS (optional, biosMode "optional") ----------
export interface BiosRecord {
  platform: 'ps1';
  fileName: string;
  sizeBytes: number;
  sha256: string;
  data: Uint8Array;
  importedAt: string;
}

export const MAX_BIOS_BYTES = 4 * 1024 * 1024;

export async function importBios(file: File): Promise<BiosRecord> {
  if (!/\.bin$/i.test(file.name)) throw new DiscSetError('A PS1 BIOS file is a .bin file');
  if (file.size < 64 * 1024 || file.size > MAX_BIOS_BYTES) throw new DiscSetError('That file is not the size of a PS1 BIOS');
  const data = new Uint8Array(await file.arrayBuffer());
  const digest = await crypto.subtle.digest('SHA-256', data);
  const rec: BiosRecord = {
    platform: 'ps1',
    fileName: file.name.slice(0, 100),
    sizeBytes: file.size,
    sha256: [...new Uint8Array(digest)].map((b) => b.toString(16).padStart(2, '0')).join(''),
    data,
    importedAt: new Date().toISOString(),
  };
  await idbPut('bios', 'ps1', rec);
  void navigator.storage.persist?.();
  return rec;
}

export const getBios = () => idbGet<BiosRecord>('bios', 'ps1');
export const removeBios = () => idbDelete('bios', 'ps1');
