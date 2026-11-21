#!/usr/bin/env node
// Fetches the pinned EmulatorJS frontend and PS1 core from the npm registry as tarballs (never `npm install`:
// the packages declare unpinned `latest` dependencies, including every other core — SPIKE-001), verifies their
// sha512 integrity, extracts them into a fresh temporary directory, and copies only an allowlist of files into
// public/emulator/ejs/ (gitignored). Writes licence notices next to them.
import { createHash } from 'node:crypto';
import { execFileSync } from 'node:child_process';
import { cpSync, existsSync, mkdirSync, mkdtempSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';

const PINNED = [
  {
    name: '@emulatorjs/emulatorjs',
    version: '4.2.3',
    url: 'https://registry.npmjs.org/@emulatorjs/emulatorjs/-/emulatorjs-4.2.3.tgz',
    integrity: 'sha512-7z3qaA4LwyurhuGvdMUDF9xJpEbxC3SNy9+E9tSaOsRo8FCS2QXam/0k/lc9kqHWRFIlLKWahNjPAStyL0rFnw==',
  },
  {
    name: '@emulatorjs/core-pcsx_rearmed',
    version: '4.2.3',
    url: 'https://registry.npmjs.org/@emulatorjs/core-pcsx_rearmed/-/core-pcsx_rearmed-4.2.3.tgz',
    integrity: 'sha512-mMbl/NszCryFI15X5QniOqLNL7YGZ6tLP24gr5y1q2ekFOIbtc39BcVTMDEwRndNGovh2nPoCcMjB+W3fgQCog==',
  },
];

// Allowlist (relative to each package's "package/" folder) → destination (relative to public/emulator/ejs/).
const FRONTEND_FILES = [
  ['data/loader.js', 'loader.js'],
  ['data/emulator.css', 'emulator.css'],
  ['data/version.json', 'version.json'],
  ['data/src', 'src'],
  ['data/compression/extract7z.js', 'compression/extract7z.js'],
  ['data/compression/extractzip.js', 'compression/extractzip.js'],
  ['LICENSE', 'LICENSE-EmulatorJS.txt'],
];
const CORE_FILES = [
  ['pcsx_rearmed-wasm.data', 'cores/pcsx_rearmed-wasm.data'],
  ['pcsx_rearmed-legacy-wasm.data', 'cores/pcsx_rearmed-legacy-wasm.data'],
  ['reports/pcsx_rearmed.json', 'cores/reports/pcsx_rearmed.json'],
];

const root = new URL('..', import.meta.url).pathname;
const dest = join(root, 'public', 'emulator', 'ejs');
const work = mkdtempSync(join(tmpdir(), 'retro-arcade-ejs-'));

async function fetchVerified(pkg) {
  const res = await fetch(pkg.url, { redirect: 'error' });
  if (!res.ok) throw new Error(`${pkg.name}: HTTP ${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const actual = 'sha512-' + createHash('sha512').update(buf).digest('base64');
  if (actual !== pkg.integrity) throw new Error(`${pkg.name}: integrity mismatch\n expected ${pkg.integrity}\n actual   ${actual}`);
  const dir = join(work, pkg.name.replace(/[@/]/g, '_'));
  mkdirSync(dir);
  const tgz = join(dir, 'package.tgz');
  writeFileSync(tgz, buf);
  // Extract with the system tar into this package's own empty directory; refuse absolute paths and "..".
  const listing = execFileSync('tar', ['-tzf', tgz], { encoding: 'utf8' }).split('\n').filter(Boolean);
  for (const entry of listing) if (entry.startsWith('/') || entry.split('/').includes('..')) throw new Error(`${pkg.name}: unsafe path in tarball: ${entry}`);
  execFileSync('tar', ['-xzf', tgz, '-C', dir]);
  console.log(`✓ ${pkg.name}@${pkg.version} integrity verified`);
  return join(dir, 'package');
}

function copyAllowlisted(from, pairs) {
  for (const [src, dst] of pairs) {
    const s = join(from, src);
    if (!existsSync(s)) throw new Error(`missing in package: ${src}`);
    mkdirSync(join(dest, dst, '..'), { recursive: true });
    cpSync(s, join(dest, dst), { recursive: true });
  }
}

try {
  const [frontend, core] = [await fetchVerified(PINNED[0]), await fetchVerified(PINNED[1])];
  rmSync(dest, { recursive: true, force: true });
  mkdirSync(dest, { recursive: true });
  copyAllowlisted(frontend, FRONTEND_FILES);
  copyAllowlisted(core, CORE_FILES);
  // The loader first requests emulator.min.js / emulator.min.css; the npm package ships only the sources. Build the
  // equivalent by concatenating the sources in the loader's own order (classic scripts share one global scope, and
  // none of them uses a file-level 'use strict'), so the sandboxed frame can map them through EJS_paths.
  const order = ['emulator.js', 'nipplejs.js', 'shaders.js', 'storage.js', 'gamepad.js', 'GameManager.js', 'socket.io.min.js', 'compression.js'];
  const bundle = order.map((f) => `/* ---- ${f} ---- */\n` + readFileSync(join(dest, 'src', f), 'utf8')).join('\n;\n');
  writeFileSync(join(dest, 'emulator.min.js'), bundle);
  cpSync(join(dest, 'emulator.css'), join(dest, 'emulator.min.css'));
  writeFileSync(
    join(dest, 'NOTICE.txt'),
    [
      'Third-party software served from this folder (study/research build of Retro Arcade; not for commercial use).',
      '',
      'EmulatorJS 4.2.3 — GPL-3.0. Licence: LICENSE-EmulatorJS.txt. Source: https://github.com/EmulatorJS/EmulatorJS (tag v4.2.3).',
      'PCSX ReARMed libretro core, EmulatorJS build 4.2.3 — GPL-2.0 (libretro core info). The npm package ships no licence file.',
      '  Source: https://github.com/EmulatorJS/pcsx_rearmed ; build scripts: https://github.com/EmulatorJS/build',
      '  GPL-2.0 text: https://www.gnu.org/licenses/old-licenses/gpl-2.0.txt',
      '',
      'Files were fetched as npm tarballs and verified against these sha512 integrity values:',
      ...PINNED.map((p) => `  ${p.name}@${p.version} ${p.integrity}`),
      '',
    ].join('\n'),
  );
  const count = (d) => readdirSync(d, { withFileTypes: true }).reduce((n, e) => n + (e.isDirectory() ? count(join(d, e.name)) : 1), 0);
  console.log(`✓ ${count(dest)} files copied to public/emulator/ejs/`);
} finally {
  rmSync(work, { recursive: true, force: true });
}
