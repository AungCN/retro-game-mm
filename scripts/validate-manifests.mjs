#!/usr/bin/env node
// Validates every bundled game manifest and documentation example against docs/architecture/game-manifest.schema.json.
import { readFileSync, readdirSync, existsSync } from 'node:fs';
import { join } from 'node:path';
import Ajv2020 from 'ajv/dist/2020.js';

const root = new URL('..', import.meta.url).pathname;
const schema = JSON.parse(readFileSync(join(root, 'docs/architecture/game-manifest.schema.json'), 'utf8'));
const validate = new Ajv2020({ allErrors: true, strict: false }).compile(schema);

const files = [
  ...readdirSync(join(root, 'src/game-modules'))
    .map((d) => join('src/game-modules', d, 'manifest.json'))
    .filter((f) => existsSync(join(root, f))),
  'docs/games/game-001.manifest.example.json',
  'docs/games/ps1-player.manifest.example.json',
];

let failed = 0;
const ids = new Set();
for (const f of files) {
  const m = JSON.parse(readFileSync(join(root, f), 'utf8'));
  const ok = validate(m);
  const dup = f.startsWith('src/') && ids.has(m.id);
  if (f.startsWith('src/')) ids.add(m.id);
  if (!ok || dup) {
    failed++;
    console.error(`✗ ${f}${dup ? ` (duplicate id ${m.id})` : ''}`);
    for (const e of validate.errors ?? []) console.error(`    ${e.instancePath || '/'} ${e.message}`);
  } else console.log(`✓ ${f}`);
}
if (failed) {
  console.error(`${failed} manifest(s) invalid`);
  process.exit(1);
}
