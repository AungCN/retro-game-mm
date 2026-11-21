# SPIKE-001 — PS1 BYOR in the Browser (MacBook M4)

- Phase: 01 (approved plan; owner decisions O-4, O-8)
- Spike branch: `spike/phase-01-ps1-byor` — throwaway, **never merged**. Only findings and small text results are copied here.
- Time box: ≤ 12 hours of agent work plus about 60 minutes of owner testing
- Status: **IN PROGRESS** — all Chrome checks done (A1–A8); owner browser session (Safari, Firefox, real Chrome) pending; A9 optional

## Environment

- Apple M4, 16 GB, macOS 26.6
- Google Chrome 158.0.8127.37; Safari 26.6; Firefox not yet installed (owner decision O-8)
- Node 26.6.0; Vite 8.3.8 (MIT), installed with `--ignore-scripts`, exact version, lockfile on the spike branch
- EmulatorJS 4.2.3 (GPL-3.0) and the `pcsx_rearmed` core 4.2.3 (GPLv2), fetched as npm tarballs only and checked against the registry's integrity hashes (owner-approved 2026-11-22). Not committed; provenance and re-creation steps are in `spike/PROVENANCE.md` on the spike branch.
- Harness: plain JavaScript diagnostics page with a service worker and an OPFS worker. It records measurements only, never file contents.

## Questions and status

| ID | Question | Status |
|---|---|---|
| A1 | `crossOriginIsolated` under Vite `dev` and `preview` in all three browsers | **Chrome: pass.** Safari, Firefox: owner session |
| A2 | Isolation still holds offline, served by the service worker | **Chrome: pass** (server stopped + browser restarted). Safari, Firefox: owner session |
| A3 | Self-hosted pinned EmulatorJS PS1 core boots the test image without a BIOS; CSP needs; cross-origin requests | **Chrome: pass, with an iframe-only CSP relaxation** (see below). Safari, Firefox: owner session |
| A4 | Whole-file loading vs streaming | **Chrome: answered.** EmulatorJS loads the whole file into memory; platform-side range reads work |
| A5 | Handle persistence across restart; OPFS copy; session file | **Chrome OPFS and session file: measured.** File-handle permission flow needs a real user (owner session) |
| A6 | `persist()` / `estimate()` per browser | **Chrome headless: measured** (needs a real-browser re-check). Safari, Firefox: owner session |
| A7 | PS1 performance vs the provisional target | **Chrome: meets target on the test programs** (60.0 fps). Real-game load not measured |
| A8 | Removing the iframe frees memory and stops audio | **Chrome, non-threaded core: pass** (memory back to 2 MB). Threaded core: not confirmed. Audio stop not measured |
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

### A3 / A4 / A7 / A8 — emulator core (Chrome 158 headless)

Setup:
- The core runs in a same-origin iframe (`emu.html`) inside a host page, per ADR-0002.
- `EJS_disableDatabases = true`; no BIOS (HLE); volume muted.
- The iframe gets the enforced baseline CSP plus whatever each run adds.

**CSP needed by EmulatorJS 4.2.3 (A3):**

| Iframe CSP | Result |
|---|---|
| Baseline: `script-src 'self' 'wasm-unsafe-eval'`, `connect-src 'self'` | Core does not start: `EvalError` — the 7-Zip extractor that unpacks the `.data` core archive (`compression/extract7z.js`) uses `eval` |
| + `script-src 'unsafe-eval' blob:` | Core script runs (it is loaded from a `blob:` URL), then aborts: the core fetches its WASM from a `blob:` URL and `connect-src` blocks it |
| + `script-src 'unsafe-eval' blob:` and `connect-src blob:` | **Boots** |

In every run:
- `connect-src 'self'` blocked EmulatorJS's update check to `https://cdn.emulatorjs.org/stable/data/version.json`. EmulatorJS makes that call only when the hostname is `localhost` or debug mode is on.
- No request went to any other origin.
- EmulatorJS's own on-screen menu uses inline style attributes, which `style-src` blocks. That is cosmetic, and the host owns the player UI anyway (ADR-0002).

**Runs:**

| Run | Boot | fps | Memory before → running → after iframe removed |
|---|---|---|---|
| `animated-triangle.exe`, non-threaded core | 712 ms | **60.02** (601 frames / 10.01 s) | 0 → 10 → **2 MB** |
| `benchmark.exe`, non-threaded | 481 ms | **60.01** (1,201 frames / 20.01 s) | 0 → 10 → 2 MB |
| 648 MiB random file as the "game", non-threaded | 2,126 ms (core started with no valid program) | 59.96 | 0 → **657** → **2 MB** |
| `animated-triangle.exe`, threaded core | 495 ms | 60.01 | 0 → **1,549** → *measurement did not finish within 30 s* |

**Visual check:** a screenshot while running shows the test program's shaded triangle drawn by the core (`docs/spikes/evidence/spike-001-emulator-animated-triangle-chrome.png`).

**What this shows:**
- **A3:** The PS1 core boots without a BIOS in a same-origin, cross-origin-isolated iframe. It needs `'unsafe-eval'` and `blob:` in `script-src`, and `blob:` in `connect-src`, **in the iframe only**; the platform shell keeps the baseline CSP. Removing `'unsafe-eval'` would need the core pre-extracted at build time, which means changing how EmulatorJS loads cores (a Phase 04B option).
- **A4:** EmulatorJS downloads the whole game file and writes it into the emulator's in-memory filesystem. Memory grew by about the file size (657 MB for 648 MiB). There is no range-read path in EmulatorJS 4.2.3. Streaming would need a custom loader or a core-level virtual file system. That is the Phase 04B work item; whole-file loading is workable for single PS1 discs on a 16 GB Mac.
- **A7:** Both test programs run at the full 60 fps (NTSC target ≥ 59). These programs are light; real-game load is not measured, because no openly licensed full PS1 game was available. The target is met for what could be tested.
- **A8:** Removing the iframe freed the non-threaded core completely, including the 657 MB case. The threaded core reserved about 1.5 GB of shared memory, and the memory API did not report after removal, so its teardown is unconfirmed. Audio stop was not measured: volume was muted in headless mode.
- **Threads:** not needed for PS1 at full speed. The non-threaded core is recommended — about a hundredth of the memory, and confirmed teardown. This matches `requiresSharedArrayBuffer: false` in the PS1 example manifest.

**Other findings for Phase 04B:**
- **Duplicate storage:** by default EmulatorJS copies every game file into its own IndexedDB (`EmulatorJS-roms`) and caches cores. `EJS_disableDatabases = true` stops this, and must always be set.
- **Saves:** even with databases disabled, the core keeps saves in an IndexedDB database named `/data/saves` (Emscripten's file-system persistence) in the app's own origin. Saves must be routed through the platform's blob storage (contract v2) in Phase 04B.
- **CDN fallback:** if a core file is missing locally, EmulatorJS fetches one from `cdn.emulatorjs.org` (its code calls this "not officially supported"). `connect-src 'self'` must stay in the iframe CSP so this fallback can never fire.
- **Unpinned dependencies:** `@emulatorjs/emulatorjs` declares an optional dependency on `@emulatorjs/cores@latest` (all cores, unpinned) and build-tool dependencies; `core-pcsx_rearmed` depends on `@emulatorjs/emulatorjs@latest`. A normal `npm install` pulled 187 packages and was undone. The build must fetch exact tarballs and verify their integrity instead.
- **Missing licence file:** the core package ships **no licence file**. The GPLv2 text and a source link (`EmulatorJS/pcsx_rearmed`) must be supplied when distributing.
- **Legacy build:** EmulatorJS loads its legacy core build when WebGL2 is unavailable. It happened once in headless Chrome, before the core report file was in place.

## Test image (A3) — approved by the owner 2026-11-22

| | |
|---|---|
| Source | JaCzekanski/ps1-tests, release `build-158` (2021-04-22), asset `tests.zip`, 6,613,816 bytes, SHA-256 `5de0e82854c1a511697a7ade381c2d778ec4b2fff4a7d7ac79e8098c35eb859b` |
| Licence | MIT, "Copyright (c) 2020 Jakub Czekański" (GitHub API: SPDX `MIT`; the archive itself has no licence file) |
| Used | `animated-triangle.exe` (SHA-256 `9b30c615…a6ba`), `benchmark.exe` (`372255c4…dc22`); `pad.exe` extracted, not yet used. Full hashes in `spike/PROVENANCE.md` |
| Stored | Gitignored `spike/fixtures/`, never committed |
| Limitation | Bare PS1 executables (`.exe`), not disc images, so `.cue`/`.bin`, `.chd` and `.m3u` handling were not tested |

Emulator channel (approved): npm tarballs `@emulatorjs/emulatorjs@4.2.3` and `@emulatorjs/core-pcsx_rearmed@4.2.3`, both matching the registry's `sha512` integrity values.

## Owner browser session (O-8)

About 15–20 minutes per browser; Firefox must be installed first. Use real (not headless) Chrome, Safari 26.6, and Firefox.

1. Tell the assistant you are ready. It starts the spike's preview server on `http://localhost:4173/` with the emulator files and the iframe CSP in place.
2. In each browser, open `http://localhost:4173/`. Note the browser version.
3. Click **Re-run isolation check**.
4. Click **Register service worker**, reload the page once, then click **Service worker status**.
5. Choose the 648 MiB test file as the session file (the assistant gives you its path). Click **Chunked read (session file)**, **Load whole file into memory**, **Copy session file to OPFS**, **Check OPFS copy**.
6. Click **persisted() + estimate()**, then **Request persist()** (note any prompt), then **persisted() + estimate()** again.
7. Chrome only: click **Link file…**, choose the same file, then **Check stored handle**.
8. Emulator check: open `http://localhost:4173/emu-host.html?auto=1&game=animated-triangle.exe&threads=0` and wait about 20 seconds. Note whether a shaded triangle appears, and copy the JSON line shown at the bottom of the page (it includes `fps`; memory figures appear only in Chrome).
9. Quit every browser completely (Cmd+Q). Stop the server: in Terminal run `kill $(lsof -ti tcp:4173)`.
10. Reopen each browser at `http://localhost:4173/` with the server still stopped. Click **Re-run isolation check** and **Check OPFS copy**.
11. Chrome only: click **Check stored handle** (note the permission state), then **Re-grant access**. Note the prompt's wording and whether it offers "Allow on every visit". Then click **Chunked read (linked file)**.
12. Chrome only: rename the file in Finder, click **Check stored handle**, note the error, then rename it back.
13. Click **Export results** and save the JSON anywhere convenient. Send it, with the emulator JSON lines from step 8, to the assistant.
14. Clean up: **Delete OPFS copy**, **Unregister + clear cache**.

## Provisional recommendations (to be confirmed)

| Topic | Provisional view | Depends on |
|---|---|---|
| ADR-0001 Vite headers | `server.headers` + `preview.headers` work as configured in Vite 8.3.8 | Safari/Firefox A1 |
| SECURITY offline rule | Network-first service worker with unchanged cached responses keeps isolation offline | Safari/Firefox A2 |
| D3 Tier 2 fallback | Lean towards **OPFS copy** (persistent, fast in Chrome), with **session-only file** as the fallback where quota or persistence fails | Safari/Firefox A5/A6 numbers |
| Whole-file vs streaming | EmulatorJS 4.2.3 loads whole files (measured). Acceptable for single PS1 discs on desktop; streaming needs a custom loader — a Phase 04B decision | Confirmed in Chrome |
| Emulator CSP | Iframe-only relaxation: `script-src 'unsafe-eval' blob:`, `connect-src blob:`; keep `connect-src` otherwise `'self'` | Owner approval (SECURITY_GUIDELINES) |
| Threads | Use the non-threaded PS1 core | Confirmed in Chrome |

## Evidence

- Spike branch commit with harness and sanitized results: `spike/phase-01-ps1-byor`, file `spike/results/chrome-automated-2026-11-22.json`
- Copy of the results: `docs/spikes/evidence/spike-001-chrome-automated-2026-11-22.json`
- Emulator runs: `docs/spikes/evidence/spike-001-emulator-chrome-2026-11-22.json` and screenshot `docs/spikes/evidence/spike-001-emulator-animated-triangle-chrome.png` (spike branch commit `0cc3cfa`)
