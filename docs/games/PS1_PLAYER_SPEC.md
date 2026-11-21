# Specification and Rights Record — ps1-player PS1 Player (BYOR)

- Game ID: ps1-player
- Display title: PS1 Player
- Status: IN_DEVELOPMENT (first draft, DEC-003)
- Related phase/task: Phase 04B (`tasks/phase-04b-ps1-byor-adapter.md`)
- Non-affiliation: "PS1" describes compatible disc formats only; this project is not affiliated with or endorsed by the console's maker (owner decision D2).

## 1. What it is

A generic player for the user's own PS1 disc images. It ships no game content, no BIOS, no titles, no metadata database, and no box art. Disc names in the library are entered by the user.

## 2. Browser support

| Tier | Browsers | Disc storage |
|---|---|---|
| Tier 1 | Desktop Chromium | Read-only File System Access handle (re-grant after restart: `NEEDS_PERMISSION`) |
| Tier 2 | Desktop Safari, Firefox | Upload → OPFS copy by default (provisional D3), or session-only if quota is short or the user turns copying off |
| Mobile | — | Not supported ("not supported yet" message) |

## 3. Formats

`.chd`, `.cue` + `.bin`, `.m3u` (multi-disc), `.pbp`, `.iso`, `.exe` (homebrew). Multi-file discs are bundled into a stored zip in memory for the emulator, which picks the `.m3u` or `.cue`.

## 4. Saves

- Memory card: per disc (`disc/<discId>/memcard/1`), read from the emulator on pause, on exit, and every 60 s; written back at start.
- Save states: three slots per disc, tagged with the core ID and version; a state from another core version is rejected.
- Export/import: Settings → Save backups (Must on Tier 2, D4). BIOS and discs are never exported.

## 5. Architecture and security

See ADR-0002 and `docs/quality/THREAT_MODEL.md`.
- Two-layer frame: a same-origin outer relay (served offline by the service worker) and an inner sandboxed srcdoc frame (opaque origin) running EmulatorJS from `blob:` URLs.
- Emulator CSP relaxations (DEC-004) apply only to the frame document.
- EmulatorJS caching (`EJS_disableDatabases`) is off; its local storage is replaced in memory.

## 6. Emulator core rights record (required by GAME_CATALOG_POLICY.md)

| Field | EmulatorJS frontend | PCSX ReARMed core |
|---|---|---|
| Name and version | `@emulatorjs/emulatorjs` 4.2.3 | `@emulatorjs/core-pcsx_rearmed` 4.2.3 (non-threaded builds only) |
| Licence | GPL-3.0 (LICENSE shipped as `public/emulator/ejs/LICENSE-EmulatorJS.txt`) | GPL-2.0 per libretro core info. **The npm package contains no licence file** (field reads `COPYING`) |
| Source | https://github.com/EmulatorJS/EmulatorJS (tag v4.2.3) | https://github.com/EmulatorJS/pcsx_rearmed ; built with https://github.com/EmulatorJS/build |
| Integrity | `sha512-7z3qaA4LwyurhuGvdMUDF9xJpEbxC3SNy9+E9tSaOsRo8FCS2QXam/0k/lc9kqHWRFIlLKWahNjPAStyL0rFnw==` | `sha512-mMbl/NszCryFI15X5QniOqLNL7YGZ6tLP24gr5y1q2ekFOIbtc39BcVTMDEwRndNGovh2nPoCcMjB+W3fgQCog==` |
| How fetched | `npm run fetch:emulator` (tarball, verified, allowlisted files; never committed) | same |
| Files shipped | loader, sources and concatenated `emulator.min.js`, CSS, zip/7z extractors | `pcsx_rearmed-wasm.data`, `pcsx_rearmed-legacy-wasm.data`, core report JSON |
| Notices | `public/emulator/ejs/NOTICE.txt` (generated); About page links | same |
| Open question | — | GPL-2.0-only vs GPL-3.0-or-later compatibility for distribution (ADR-0001, R-013); not legal advice |

## 7. Test fixtures

Two MIT-licensed test programs from JaCzekanski/ps1-tests `build-158` (Copyright (c) 2020 Jakub Czekański), fetched and SHA-256-verified by `npm run fetch:fixtures` into the gitignored `test-fixtures/local/`.

## 8. Rights decision — owner only

- Rights reviewer:
- Rights decision: PENDING
