# Security and Privacy Guidelines

## MVP privacy posture

- Keep game preferences, ROM references, BIOS files, and saves 100% local by default.
- Do not introduce accounts, analytics, advertising, or telemetry without explicit product approval.
- Never upload user-selected ROM or BIOS files to any external server (PRD FR-027).
- Do not store credentials or secrets in source control, browser storage, or game save data.

## Cross-origin isolation and WASM threading headers

WebAssembly emulator cores that use threads need `SharedArrayBuffer`, which browsers only expose on cross-origin isolated pages. Whether the PS1 core needs threads is a SPIKE-001 question; the platform is isolated in every case so that adapters can rely on it.

Every response — HTML, JavaScript, workers, `.wasm`, data files, images — must carry:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
Cross-Origin-Resource-Policy: same-origin
```

- `credentialless` COEP is not used: Safari (Tier 2) does not support it.
- **Development:** the Vite configuration must set identical headers in both `server.headers` and `preview.headers` (ADR-0001). Checking the dev server alone is not enough.
- **Production:** the host must support custom response headers on all static files (ADR-0001). GitHub Pages cannot.
- **Offline:** the service worker must return cached responses with these headers intact, and the navigation response for the app shell must still produce `crossOriginIsolated === true` when served from Cache Storage with no network. This is tested (TEST_STRATEGY.md).
- Self-host every asset (fonts, images, cores). Cross-origin resources are blocked by COEP and are not used.
- Check `crossOriginIsolated` before starting a core that needs threads; if it is false, show the plain-language capability message (FR-019) rather than failing silently.

## Content Security Policy (baseline)

```http
Content-Security-Policy: default-src 'self'; script-src 'self' 'wasm-unsafe-eval'; worker-src 'self' blob:; connect-src 'self'; img-src 'self' blob: data:; media-src 'self' blob:; frame-src 'self'; object-src 'none'; base-uri 'none'; form-action 'none'; frame-ancestors 'none'
```

- Deliver the CSP as a response header (`frame-ancestors` is ignored in a `<meta>` tag).
- The emulator iframe document uses the same policy except `frame-ancestors 'self'`, so only the platform shell can embed it.
- `'wasm-unsafe-eval'` allows WebAssembly compilation without allowing JavaScript `eval`.
- `connect-src 'self'` is part of the FR-027 guarantee: the page cannot send user files to another origin.
- Any relaxation the emulator core requires must be scoped to the emulator iframe's own CSP, documented in ADR-0002, and approved by the owner — never applied to the platform shell.
- **Proposed emulator-iframe relaxation (SPIKE-001 A3, pending owner approval):** EmulatorJS 4.2.3 needs `script-src 'self' 'wasm-unsafe-eval' 'unsafe-eval' blob:` and `connect-src 'self' blob:`.
  - `'unsafe-eval'` is used by its 7-Zip core extractor.
  - `blob:` is used for the core script and its WASM.
  - Everything else stays at the baseline. Keeping `connect-src` limited to `'self' blob:` is what blocks EmulatorJS's update check and its CDN core fallback; this was verified in Chrome.

## Emulator cores and supply chain

- Cores are self-hosted, pinned to an exact version, and verified by SHA-256 when fetched at build time. They are never loaded from a third-party CDN at runtime.
- Each shipped core has a rights record (`docs/product/GAME_CATALOG_POLICY.md`, Emulator cores).
- Emulator adapters use two frames (ADR-0002):
  - A same-origin outer relay, served offline by the service worker, talks to the host with origin, nonce and shape checks.
  - An inner `sandbox="allow-scripts"` srcdoc frame (opaque origin) runs EmulatorJS and the disc. It cannot read the app's DOM, storage, saves or file handles, and its CSP blocks any connection to other origins. This is verified by the e2e test.
  - `postMessage(…, '*')` is used only on the sandbox edge, where the opaque origin cannot be named; receivers check `event.source`.
- The emulator frame document alone gets a Permissions-Policy delegating gamepad, fullscreen and screen-wake-lock to its sandbox.
- The threat model is `docs/quality/THREAT_MODEL.md`.

## File access

- Request read-only access to user files. Never request write access to user-selected files or folders.
- Prefer the file picker for single discs; use a directory grant only when an `.m3u` playlist needs sibling files.
- Resolve `.m3u` entries only inside the granted directory; reject absolute paths, `..` segments, and URLs.
- Do not read a whole disc image into memory just to validate it; validate format from headers and size.

## Code, license, and dependency safety

- **Repository hygiene:** `.gitignore` excludes ROM, disc-image, BIOS, memory-card and save-state extensions plus fetched-binary folders (`public/cores/`, `test-fixtures/local/`, `spike/vendor/`, `spike/fixtures/`). `.gitignore` only protects untracked files; reviewers must still check diffs for binaries.
- **Licence boundary:** emulator cores and their frontend (for example EmulatorJS, GPL-3.0; libretro cores, often GPL-2.0) are loaded as separate files rather than bundled into the platform's own source. The repository direction is GPL-3.0-or-later (owner decision D1); licence compatibility of each core is reviewed in ADR-0001 before distribution.
- **Untrusted input:** treat imported `.m3u` playlists, catalogue metadata, save files, memory cards, and save states as untrusted; validate formats and versions, and reject without altering existing saves.

## Browser storage

- Store only necessary data in IndexedDB, Cache Storage, and OPFS.
- Namespace saves by game ID / disc ID and validate schema versions (and, for save states, core version) before restoring emulator state.
- Request persistent storage where supported and handle quota errors gracefully; provide `.zip` export for user saves (FR-022, Must on Tier 2).
