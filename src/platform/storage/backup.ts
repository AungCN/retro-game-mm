// Save export/import (FR-022; Must on Tier 2). Archives contain saves, memory cards and save states only —
// never BIOS files or disc images. Imports are treated as untrusted and fully validated before anything is written.
import { idbPut, idbValues } from './db';
import { blobKey } from './saves';
import { readZip, writeZip, type ZipEntryInput } from '../zip/zip';

const FORMAT = 'retro-arcade-saves';
const FORMAT_VERSION = 1;

interface IndexEntry {
  path: string;
  kind: 'blob' | 'save';
  gameId: string;
  key?: string;
  schemaVersion: number;
  sha256: string;
}
interface BackupIndex {
  format: typeof FORMAT;
  version: typeof FORMAT_VERSION;
  exportedAt: string;
  entries: IndexEntry[];
}

async function sha256Hex(data: Uint8Array): Promise<string> {
  const d = await crypto.subtle.digest('SHA-256', data as BufferSource);
  return [...new Uint8Array(d)].map((b) => b.toString(16).padStart(2, '0')).join('');
}

const enc = new TextEncoder();

export async function exportSaves(): Promise<{ blob: Blob; count: number }> {
  const blobs = await idbValues<{ gameId: string; key: string; schemaVersion: number; data: Uint8Array }>('blobs');
  const saves = await idbValues<{ gameId: string; schemaVersion: number; data: unknown }>('saves');
  const entries: ZipEntryInput[] = [];
  const index: BackupIndex = { format: FORMAT, version: FORMAT_VERSION, exportedAt: new Date().toISOString(), entries: [] };
  for (const b of blobs) {
    const path = `blobs/${b.gameId}/${b.key}`;
    entries.push({ name: path, data: b.data });
    index.entries.push({ path, kind: 'blob', gameId: b.gameId, key: b.key, schemaVersion: b.schemaVersion, sha256: await sha256Hex(b.data) });
  }
  for (const s of saves) {
    const path = `saves/${s.gameId}.json`;
    const data = enc.encode(JSON.stringify(s.data));
    entries.push({ name: path, data });
    index.entries.push({ path, kind: 'save', gameId: s.gameId, schemaVersion: s.schemaVersion, sha256: await sha256Hex(data) });
  }
  entries.unshift({ name: 'backup.json', data: enc.encode(JSON.stringify(index, null, 2)) });
  return { blob: await writeZip(entries), count: index.entries.length };
}

export class BackupError extends Error {}

export interface ImportPlan {
  blobs: { gameId: string; key: string; schemaVersion: number; data: Uint8Array }[];
  saves: { gameId: string; schemaVersion: number; data: unknown }[];
}

/** Parses and validates an archive without writing anything. */
export async function planImport(file: Blob, knownGameIds: readonly string[]): Promise<ImportPlan> {
  if (file.size > 300 * 1024 * 1024) throw new BackupError('That file is too large to be a save backup');
  let files: Map<string, Uint8Array>;
  try {
    files = readZip(new Uint8Array(await file.arrayBuffer()));
  } catch (e) {
    throw new BackupError(`Not a valid save backup (${e instanceof Error ? e.message : 'unreadable'})`);
  }
  const rawIndex = files.get('backup.json');
  if (!rawIndex) throw new BackupError('Not a Retro Arcade save backup (no backup.json)');
  let index: BackupIndex;
  try {
    index = JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(rawIndex)) as BackupIndex;
  } catch {
    throw new BackupError('backup.json is not valid JSON');
  }
  if (index.format !== FORMAT || index.version !== FORMAT_VERSION || !Array.isArray(index.entries)) throw new BackupError('Unsupported backup format or version');
  const plan: ImportPlan = { blobs: [], saves: [] };
  const known = new Set(knownGameIds);
  for (const e of index.entries) {
    if (typeof e !== 'object' || e === null || typeof e.path !== 'string') throw new BackupError('Malformed backup index');
    const data = files.get(e.path);
    if (!data) throw new BackupError(`Missing file in backup: ${e.path}`);
    if (!known.has(e.gameId)) throw new BackupError(`Backup contains data for an unknown game: ${String(e.gameId).slice(0, 40)}`);
    if (!Number.isInteger(e.schemaVersion) || e.schemaVersion < 1 || e.schemaVersion > 1000) throw new BackupError('Invalid schema version in backup');
    if ((await sha256Hex(data)) !== e.sha256) throw new BackupError(`Checksum mismatch: ${e.path}`);
    if (e.kind === 'blob') {
      if (typeof e.key !== 'string' || e.path !== `blobs/${e.gameId}/${e.key}`) throw new BackupError('Inconsistent blob entry');
      blobKey(e.gameId, e.key); // throws on unsafe keys
      plan.blobs.push({ gameId: e.gameId, key: e.key, schemaVersion: e.schemaVersion, data });
    } else if (e.kind === 'save') {
      if (e.path !== `saves/${e.gameId}.json`) throw new BackupError('Inconsistent save entry');
      try {
        plan.saves.push({ gameId: e.gameId, schemaVersion: e.schemaVersion, data: JSON.parse(new TextDecoder('utf-8', { fatal: true }).decode(data)) });
      } catch {
        throw new BackupError(`Save is not valid JSON: ${e.path}`);
      }
    } else throw new BackupError('Unknown entry kind');
  }
  return plan;
}

/** Writes a validated plan, replacing records with the same keys. */
export async function applyImport(plan: ImportPlan): Promise<number> {
  const now = new Date().toISOString();
  for (const b of plan.blobs) await idbPut('blobs', blobKey(b.gameId, b.key), { ...b, updatedAt: now });
  for (const s of plan.saves) await idbPut('saves', s.gameId, { ...s, savedAt: now });
  return plan.blobs.length + plan.saves.length;
}
