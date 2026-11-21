# SPIKE-001 third-party files — provenance (throwaway branch, never merged)

None of these files are committed. They live in gitignored folders (`fixtures/`, `vendor/`, `public/ejs/`, `public/fixtures-local/`) and are re-created with the steps below.

## PS1 test programs (owner-approved 2026-11-22)

- Source: https://github.com/JaCzekanski/ps1-tests, release `build-158` (published 2021-04-22), asset `tests.zip`
- Downloaded with: `gh release download build-158 --repo JaCzekanski/ps1-tests --pattern tests.zip`
- `tests.zip` SHA-256: `5de0e82854c1a511697a7ade381c2d778ec4b2fff4a7d7ac79e8098c35eb859b` (6,613,816 bytes)
- Licence: MIT — "Copyright (c) 2020 Jakub Czekański" (https://github.com/JaCzekanski/ps1-tests/blob/master/LICENSE). The archive itself contains no licence file; this notice records it.
- Files extracted and used (SHA-256):
  - `gpu/animated-triangle/animated-triangle.exe` — `9b30c615dfd11cfa0deb1968ef7c646e1dc17288ef38f352234a4143c5f93b1e`
  - `gpu/benchmark/benchmark.exe` — `372255c4d617bd3aa1c7b6f3702ea669f116d8419dca1913a5be4f5b27f8dc22`
  - `input/pad/pad.exe` — `99c020f7903a91ecc19524e915782827764d2d07b356ba2d1eec188df75017dc` (not yet used)

## Emulator (owner-approved 2026-11-22, npm channel)

Fetched as package tarballs only (`npm pack`, no dependencies, no install scripts) and checked against the registry's `dist.integrity`:

| Package | Integrity (matches registry) | Tarball SHA-256 | Licence |
|---|---|---|---|
| `@emulatorjs/emulatorjs@4.2.3` | `sha512-7z3qaA4LwyurhuGvdMUDF9xJpEbxC3SNy9+E9tSaOsRo8FCS2QXam/0k/lc9kqHWRFIlLKWahNjPAStyL0rFnw==` | `8033a18a3398cae5efd7a4c12a633b10672435977290959633d671365b589639` | GPL-3.0 (LICENSE included) |
| `@emulatorjs/core-pcsx_rearmed@4.2.3` | `sha512-mMbl/NszCryFI15X5QniOqLNL7YGZ6tLP24gr5y1q2ekFOIbtc39BcVTMDEwRndNGovh2nPoCcMjB+W3fgQCog==` | `d641b90c4d4bea0a29e55803a5bc7bd02eb9980e7b4684be6e64618ff165d923` | Core is GPLv2 (libretro core info). **The package contains no licence file**; its `license` field says `COPYING`. Source: https://github.com/EmulatorJS/pcsx_rearmed, built with https://github.com/EmulatorJS/build |

Why tarballs instead of `npm install`: `@emulatorjs/emulatorjs` declares an optional dependency on `@emulatorjs/cores@latest` (every core, unpinned, including non-commercially licensed ones) plus build-tool dependencies, and `core-pcsx_rearmed` depends on `@emulatorjs/emulatorjs@latest`. A normal install pulled 187 packages; it was undone before anything ran.

Re-create:

```sh
cd spike && mkdir -p vendor/tarballs && cd vendor/tarballs
npm pack @emulatorjs/emulatorjs@4.2.3 @emulatorjs/core-pcsx_rearmed@4.2.3 --ignore-scripts
cd ../.. && mkdir -p vendor/x-ejs vendor/x-core public/ejs public/fixtures-local
tar -xzf vendor/tarballs/emulatorjs-emulatorjs-4.2.3.tgz -C vendor/x-ejs
tar -xzf vendor/tarballs/emulatorjs-core-pcsx_rearmed-4.2.3.tgz -C vendor/x-core
cp -R vendor/x-ejs/package/data/. public/ejs/
cp vendor/x-core/package/*.data public/ejs/cores/
mkdir -p public/ejs/cores/reports && cp vendor/x-core/package/reports/pcsx_rearmed.json public/ejs/cores/reports/
```
