#!/usr/bin/env node
// Downloads the owner-approved, MIT-licensed PS1 test programs (JaCzekanski/ps1-tests, release build-158) for e2e tests.
// Verifies the archive and each extracted file by SHA-256, and writes them to test-fixtures/local/ (gitignored).
// Licence: MIT, Copyright (c) 2020 Jakub Czekański — https://github.com/JaCzekanski/ps1-tests/blob/master/LICENSE
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const ARCHIVE = {
  url: 'https://github.com/JaCzekanski/ps1-tests/releases/download/build-158/tests.zip',
  sha256: '5de0e82854c1a511697a7ade381c2d778ec4b2fff4a7d7ac79e8098c35eb859b',
};
const FILES = {
  'gpu/animated-triangle/animated-triangle.exe': '9b30c615dfd11cfa0deb1968ef7c646e1dc17288ef38f352234a4143c5f93b1e',
  'gpu/benchmark/benchmark.exe': '372255c4d617bd3aa1c7b6f3702ea669f116d8419dca1913a5be4f5b27f8dc22',
};

const sha256 = (b) => createHash('sha256').update(b).digest('hex');
const root = new URL('..', import.meta.url).pathname;
const out = join(root, 'test-fixtures', 'local');
const work = mkdtempSync(join(tmpdir(), 'retro-arcade-fixtures-'));
try {
  const res = await fetch(ARCHIVE.url);
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  const zip = Buffer.from(await res.arrayBuffer());
  if (sha256(zip) !== ARCHIVE.sha256) throw new Error('tests.zip SHA-256 mismatch');
  const zipPath = join(work, 'tests.zip');
  writeFileSync(zipPath, zip);
  mkdirSync(out, { recursive: true });
  for (const [entry, expected] of Object.entries(FILES)) {
    const data = execFileSync('unzip', ['-p', zipPath, entry], { maxBuffer: 4 * 1024 * 1024 });
    if (sha256(data) !== expected) throw new Error(`${entry}: SHA-256 mismatch`);
    writeFileSync(join(out, entry.split('/').pop()), data);
    console.log(`✓ ${entry}`);
  }
  writeFileSync(join(out, 'PROVENANCE.txt'), 'JaCzekanski/ps1-tests build-158 (MIT, Copyright (c) 2020 Jakub Czekański). Verified by SHA-256 in scripts/fetch-test-fixtures.mjs.\n');
} finally {
  rmSync(work, { recursive: true, force: true });
}
