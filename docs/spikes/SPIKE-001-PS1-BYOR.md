# SPIKE-001 — PS1 BYOR in the Browser (MacBook M4)

- Phase: 01 (approved plan; owner decisions O-4, O-8)
- Spike branch: `spike/phase-01-ps1-byor` — throwaway, **never merged**. Only findings and small text results are copied here.
- Time box: ≤ 12 hours of agent work plus about 60 minutes of owner testing
- Status: **IN PROGRESS** — automated Chrome checks done; emulator-core checks waiting for owner sign-off; owner browser session pending

## Environment

- Apple M4, 16 GB, macOS 26.6
- Google Chrome 158.0.8127.37; Safari 26.6; Firefox not yet installed (owner decision O-8)
- Node 26.6.0; Vite 8.3.8 (MIT), installed with `--ignore-scripts`, exact version, lockfile on the spike branch
- Harness: plain JavaScript diagnostics page with a service worker and an OPFS worker. It records measurements only, never file contents.

## Questions and status

| ID | Question | Status |
|---|---|---|
| A1 | `crossOriginIsolated` under Vite `dev` and `preview` in all three browsers | **Chrome: pass.** Safari, Firefox: owner session |
| A2 | Isolation still holds offline, served by the service worker | **Chrome: pass** (server stopped + browser restarted). Safari, Firefox: owner session |
| A3 | Self-hosted pinned EmulatorJS PS1 core boots the test image without a BIOS; CSP needs; cross-origin requests | **Blocked:** waiting for owner sign-off on the test image and the npm package channel |
| A4 | Whole-file loading vs streaming | **Platform side measured in Chrome.** Core side blocked with A3 |
| A5 | Handle persistence across restart; OPFS copy; session file | **Chrome OPFS and session file: measured.** File-handle permission flow needs a real user (owner session) |
| A6 | `persist()` / `estimate()` per browser | **Chrome headless: measured** (needs a real-browser re-check). Safari, Firefox: owner session |
| A7 | PS1 performance vs the provisional target | Blocked with A3 |
| A8 | Removing the iframe frees memory and stops audio | Blocked with A3 |
| A9 | Gamepad (optional) | Not started |

## Method (Chrome automation)

- Chrome was run headless with throwaway profiles in a scratch folder, so the owner's Chrome profile was not touched.
- A small DevTools-protocol driver (Node built-ins only, outside the repository) loaded the page, attached the test file to the page's file input, clicked the probe buttons, and read the recorded results.
- **Negative control:** the same build was served by a plain server that sends no isolation headers. It reported `crossOriginIsolated: false` and no `SharedArrayBuffer`, which shows the check can tell the two cases apart.
- **Synthetic file:** 679,477,248 bytes (648 MiB) of random data, generated locally in the gitignored `spike/fixtures/`. A first, sparse version of the file was discarded because it read unrealistically fast.

## Results so far

### A1 — isolation (Chrome 158)

| Server | `crossOriginIsolated` | `SharedArrayBuffer` | Shared `WebAssembly.Memory` | Headers seen by the page |
|---|---|---|---|---|
| Vite dev (`server.headers`) | true | yes | yes | COOP `same-origin`, COEP `require-corp`, CORP `same-origin` |
| Vite preview (`preview.headers`) | true | yes | yes | same |
| Control: no headers | **false** | no | — | none |

`curl` confirmed all three headers on the page, scripts, the worker, and `sw.js` from both servers. Vite's `server.headers` worked as configured on this version; no plugin workaround was needed.

Also available in Chrome:
- a WebGPU adapter;
- `performance.measureUserAgentSpecificMemory`;
- the `showOpenFilePicker` file picker;
- OPFS.

### A2 — offline isolation (Chrome 158)

| Step | Result |
|---|---|
| Online: register the service worker, reload once | Page controlled by the service worker; 2 requests cached; isolated |
| **Preview server stopped, Chrome restarted with the same profile, app opened** | Page loaded from the service-worker cache; **`crossOriginIsolated: true`**, `SharedArrayBuffer` available; the cached page response still carried COOP/COEP/CORP |

The service worker uses network-first with a cache fallback, and stores responses unchanged.

### A4 / A5 / A6 — files and storage (Chrome 158 headless, 648 MiB file)

| Probe | Result |
|---|---|
| Session file (`<input type="file">`), read in 4 MiB slices | 352 ms (~1.8 GB/s) |
| Whole file loaded into memory (`File.arrayBuffer()`) | 258 ms; measured memory went from 1 MB to **649 MB** while the buffer was held |
| Copy into OPFS (sync access handle, 4 MiB writes, in a worker) | 900 ms (~720 MB/s) |
| OPFS copy after Chrome restart | Still present, full size |
| OPFS read via sync access handle | 168 ms first run; 64 ms after restart (OS file cache) |
| `persisted()` | `false` (no `persist()` request made in headless) |
| `estimate()` | Quota about 10 GB. Usage was 648 MB right after the copy, but **0 MB after restart while the file still existed** — likely a headless reporting quirk; re-check in real browsers |

**What this shows:**
- Loading a disc image whole costs memory equal to its size. That is workable for one 700 MB PS1 disc on a 16 GB Mac, but it is the main reason to prefer streaming, and it rules out whole-file loading for PS2-sized images.
- In Chrome, OPFS copies are fast and survive a restart.
- Chrome isn't a Tier 2 browser, though. D3 has to be decided from the Safari and Firefox numbers.

**Caveats:**
- Headless Chrome with a fresh profile, so quota and persistence behavior may differ from a normal profile.
- Read speeds include OS caching.
- Synthetic data, not a real disc format.

## Test image (A3) — pending owner sign-off

| | |
|---|---|
| Candidate | JaCzekanski/ps1-tests, release `build-158` (2021-04-22), asset `tests.zip`, 6.6 MB |
| Licence | MIT, "Copyright (c) 2020 Jakub Czekański" (GitHub API: SPDX `MIT`) |
| Use | 2–3 small PS1 executables (`gpu/animated-triangle`, `gpu/benchmark`, optionally `input/pad`), kept in gitignored `spike/fixtures/`, SHA-256 and MIT notice recorded here |
| Limitation | Bare PS1 executables (`.exe`), not disc images, so `.cue`/`.bin`, `.chd` and `.m3u` handling cannot be tested with them |

Proposed emulator channel (pending sign-off): the npm packages `@emulatorjs/emulatorjs@4.2.3` (GPL-3.0, about 2 MB unpacked) and `@emulatorjs/core-pcsx_rearmed@4.2.3` (core GPLv2, about 4.3 MB unpacked), instead of the 303 MB `v4.2.3.7z` GitHub release that bundles every core.

## Owner browser session (O-8)

About 15–20 minutes per browser; Firefox must be installed first. Use real (not headless) Chrome, Safari 26.6, and Firefox.

1. In a terminal: `cd spike && npm run preview` (on the spike branch). Leave it running.
2. In each browser, open `http://localhost:4173/`. Note the browser version.
3. Click **Re-run isolation check**.
4. Click **Register service worker**, reload the page once, then click **Service worker status**.
5. Choose `spike/fixtures/synthetic-650m.bin` as the session file. Click **Chunked read (session file)**, **Load whole file into memory**, **Copy session file to OPFS**, **Check OPFS copy**.
6. Click **persisted() + estimate()**, then **Request persist()** (note any prompt), then **persisted() + estimate()** again.
7. Chrome only: click **Link file…**, choose the same file, then **Check stored handle**.
8. Quit every browser completely (Cmd+Q). Stop the server with Ctrl+C.
9. Reopen each browser at `http://localhost:4173/` with the server still stopped. Click **Re-run isolation check** and **Check OPFS copy**.
10. Chrome only: click **Check stored handle** (note the permission state), then **Re-grant access**. Note the prompt's wording and whether it offers "Allow on every visit". Then click **Chunked read (linked file)**.
11. Chrome only: rename the file in Finder, click **Check stored handle**, note the error, then rename it back.
12. Click **Export results** and save the JSON into `spike/results/local/` (gitignored). Tell the assistant when done.
13. Clean up: **Delete OPFS copy**, **Unregister + clear cache**.

## Provisional recommendations (to be confirmed)

| Topic | Provisional view | Depends on |
|---|---|---|
| ADR-0001 Vite headers | `server.headers` + `preview.headers` work as configured in Vite 8.3.8 | Safari/Firefox A1 |
| SECURITY offline rule | Network-first service worker with unchanged cached responses keeps isolation offline | Safari/Firefox A2 |
| D3 Tier 2 fallback | Lean towards **OPFS copy** (persistent, fast in Chrome), with **session-only file** as the fallback where quota or persistence fails | Safari/Firefox A5/A6 numbers |
| Whole-file vs streaming | Whole-file is acceptable for single PS1 discs on desktop, but streaming should be the target in Phase 04B | A3/A4 core behavior |

## Evidence

- Spike branch commit with harness and sanitized results: `spike/phase-01-ps1-byor`, file `spike/results/chrome-automated-2026-11-22.json`
- Copy of the results: `docs/spikes/evidence/spike-001-chrome-automated-2026-11-22.json`
