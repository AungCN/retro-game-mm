import type { BlobRecord, GameHostServices } from '../../game-runtime/contracts/types';
import { idbDelete, idbGet, idbKeys, idbPut } from './db';

interface SaveRecord<T> {
  gameId: string;
  schemaVersion: number;
  savedAt: string;
  data: T;
}

interface StoredBlob extends BlobRecord {
  gameId: string;
  key: string;
  updatedAt: string;
}

/** Keys for blob records: "<gameId>\u0000<key>". The NUL separator cannot appear in IDs or keys (validated). */
const SEP = '\u0000';
const KEY_RE = /^[a-z0-9][a-z0-9/_.-]{0,200}$/i;
export const blobKey = (gameId: string, key: string) => {
  if (!KEY_RE.test(gameId) || !KEY_RE.test(key) || key.includes('..')) throw new Error('invalid storage key');
  return `${gameId}${SEP}${key}`;
};

export function createStorageService(): GameHostServices['storage'] {
  return {
    async readSave<T>(gameId: string) {
      const rec = await idbGet<SaveRecord<T>>('saves', gameId);
      return rec?.data;
    },
    async writeSave<T>(gameId: string, data: T, schemaVersion: number) {
      const rec: SaveRecord<T> = { gameId, schemaVersion, savedAt: new Date().toISOString(), data };
      await idbPut('saves', gameId, rec);
    },
    removeSave: (gameId) => idbDelete('saves', gameId),
    blobs: {
      async read(gameId, key) {
        const rec = await idbGet<StoredBlob>('blobs', blobKey(gameId, key));
        return rec ? { data: rec.data, schemaVersion: rec.schemaVersion } : undefined;
      },
      async write(gameId, key, data, schemaVersion) {
        const rec: StoredBlob = { gameId, key, data, schemaVersion, updatedAt: new Date().toISOString() };
        await idbPut('blobs', blobKey(gameId, key), rec);
      },
      remove: (gameId, key) => idbDelete('blobs', blobKey(gameId, key)),
      async list(gameId, prefix = '') {
        if (!KEY_RE.test(gameId) || (prefix && !/^[a-z0-9/_.-]*$/i.test(prefix))) throw new Error('invalid storage key');
        const base = gameId + SEP;
        const keys = await idbKeys('blobs', base + prefix);
        return keys.map((k) => k.slice(base.length));
      },
    },
  };
}

/** Save schema check helper for games: returns undefined (safe reset) when the stored version is not supported. */
export async function readVersionedSave<T>(gameId: string, supported: number[]): Promise<{ data: T; schemaVersion: number } | undefined> {
  const rec = await idbGet<SaveRecord<T>>('saves', gameId);
  if (!rec || !supported.includes(rec.schemaVersion)) return undefined;
  return { data: rec.data, schemaVersion: rec.schemaVersion };
}
