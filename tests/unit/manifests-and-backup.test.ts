import { readFileSync } from 'node:fs';
import { createHash } from 'node:crypto';
import { describe, expect, it } from 'vitest';
import Ajv2020 from 'ajv/dist/2020.js';
import { assertManifest, ManifestError } from '../../src/domain/games/manifest';
import { CATALOGUE } from '../../src/domain/games/registry';
import { planImport, BackupError } from '../../src/platform/storage/backup';
import { blobKey } from '../../src/platform/storage/saves';
import { sanitizeLabel } from '../../src/platform/files/userFiles';
import { writeZip } from '../../src/platform/zip/zip';

const schema = JSON.parse(readFileSync('docs/architecture/game-manifest.schema.json', 'utf8'));
const validate = new Ajv2020({ strict: false }).compile(schema);

describe('manifests', () => {
  it('every catalogue manifest passes the JSON Schema and the runtime check', () => {
    for (const m of CATALOGUE) {
      expect(validate(m), JSON.stringify(validate.errors)).toBe(true);
      expect(assertManifest(m)).toBe(m);
    }
  });
  it('runtime check rejects what the schema rejects', () => {
    const ps1 = CATALOGUE.find((g) => g.id === 'ps1-player')!;
    const bad = [
      { ...ps1, manifestVersion: 2 },
      { ...ps1, runtimeAdapter: 'native-canvas' },
      { ...ps1, romConfig: undefined },
      { ...ps1, offline: { ...ps1.offline, contentSource: 'bundled' } },
      { ...ps1, id: '../x' },
    ];
    for (const b of bad) {
      expect(validate(b)).toBe(false);
      expect(() => assertManifest(b)).toThrow(ManifestError);
    }
  });
});

describe('storage keys and labels', () => {
  it('rejects unsafe blob keys', () => {
    expect(() => blobKey('ps1-player', 'disc/../../x')).toThrow();
    expect(() => blobKey('ps1-player', '\u0000x')).toThrow();
    expect(blobKey('ps1-player', 'disc/abc/memcard/1')).toBe('ps1-player\u0000disc/abc/memcard/1');
  });
  it('sanitizes disc labels', () => {
    expect(sanitizeLabel('  My   Disc  ', 'x.chd')).toBe('My Disc');
    expect(sanitizeLabel('<img src=x onerror=alert(1)>', 'Game.chd')).toBe('Game');
  });
});

describe('save backup import (untrusted input)', () => {
  const enc = new TextEncoder();
  const sha = (b: Uint8Array) => createHash('sha256').update(b).digest('hex');
  const ids = CATALOGUE.map((g) => g.id);
  async function archive(entries: { path: string; kind: string; gameId: string; key?: string; data: Uint8Array; sha?: string; schemaVersion?: number }[], extra: { name: string; data: Uint8Array }[] = []) {
    const index = {
      format: 'retro-arcade-saves',
      version: 1,
      exportedAt: 'now',
      entries: entries.map((e) => ({ path: e.path, kind: e.kind, gameId: e.gameId, key: e.key, schemaVersion: e.schemaVersion ?? 1, sha256: e.sha ?? sha(e.data) })),
    };
    return writeZip([{ name: 'backup.json', data: enc.encode(JSON.stringify(index)) }, ...entries.map((e) => ({ name: e.path, data: e.data })), ...extra]);
  }

  it('accepts a valid backup', async () => {
    const card = new Uint8Array([1, 2, 3]);
    const save = enc.encode('{"highScore":12}');
    const plan = await planImport(
      await archive([
        { path: 'blobs/ps1-player/disc/abc/memcard/1', kind: 'blob', gameId: 'ps1-player', key: 'disc/abc/memcard/1', data: card },
        { path: 'saves/comet-courier.json', kind: 'save', gameId: 'comet-courier', data: save },
      ]),
      ids,
    );
    expect(plan.blobs).toHaveLength(1);
    expect(plan.saves[0]?.data).toEqual({ highScore: 12 });
  });

  it.each([
    ['unknown game', [{ path: 'saves/evil.json', kind: 'save', gameId: 'evil', data: enc.encode('{}') }], /unknown game/],
    ['checksum mismatch', [{ path: 'saves/comet-courier.json', kind: 'save', gameId: 'comet-courier', data: enc.encode('{}'), sha: '0'.repeat(64) }], /Checksum/],
    ['path/key mismatch', [{ path: 'blobs/ps1-player/a', kind: 'blob', gameId: 'ps1-player', key: 'b', data: new Uint8Array(1) }], /Inconsistent/],
    ['bad schema version', [{ path: 'saves/comet-courier.json', kind: 'save', gameId: 'comet-courier', data: enc.encode('{}'), schemaVersion: 0 }], /schema version/],
    ['invalid JSON save', [{ path: 'saves/comet-courier.json', kind: 'save', gameId: 'comet-courier', data: enc.encode('{') }], /not valid JSON/],
  ])('rejects %s', async (_name, entries, why) => {
    await expect(planImport(await archive(entries as never), ids)).rejects.toThrow(why);
  });

  it('rejects files that are not backups', async () => {
    await expect(planImport(new Blob([new Uint8Array(1000)]), ids)).rejects.toThrow(BackupError);
    await expect(planImport(await writeZip([{ name: 'x.txt', data: enc.encode('hi') }]), ids)).rejects.toThrow(/backup.json/);
  });
});
