# Security and Privacy Guidelines

## MVP privacy posture

- Keep game preferences, ROM references, BIOS files, and saves 100% local by default.
- Do not introduce accounts, analytics, advertising, or telemetry without explicit product approval.
- Never upload user-selected ROM or BIOS files to any external server.
- Do not store credentials or secrets in source control, browser storage, or game save data.

## Cross-Origin Isolation & WASM Threading Headers

Modern WebAssembly PS1 and PS2 emulators require `SharedArrayBuffer` for multi-threaded CPU/GPU/SPU emulation. Both local development servers (e.g., Vite) and production static hosts **must** serve the following HTTP response headers:

```http
Cross-Origin-Opener-Policy: same-origin
Cross-Origin-Embedder-Policy: require-corp
```

- Any external assets (fonts, cover art, CDN scripts) must either be self-hosted locally or served with `Cross-Origin-Resource-Policy: cross-origin` / CORS headers so COEP does not block them.
- Verify `window.crossOriginIsolated === true` before initializing multi-threaded WASM cores; fall back to single-threaded cores or display a clear diagnostic warning if disabled.

## Code, license, and dependency safety

- **Repository Hygiene:** Keep `.gitignore` configured to exclude all ROM, ISO, CHD, BIN/CUE, and BIOS extensions (`*.iso`, `*.chd`, `*.bin`, `*.cue`, `*.pbp`, `*.mcr`, `*.ps2`) so copyrighted binaries are never committed to open-source version control.
- **License Isolation:** Keep GPLv3 emulator cores (such as RetroArch / EmulatorJS builds) dynamically loaded as standalone WASM/JS worker modules rather than statically bundling them into MIT/Apache frontend UI source files.
- **Untrusted Input:** Treat imported `.m3u` playlists, catalog metadata, and save files as untrusted input; sanitize paths to prevent directory traversal outside the user-granted directory handle.

## Browser storage

- Store only necessary data in IndexedDB and Cache Storage.
- Namespace saves by game ID and validate schema versions before restoring emulator state.
- Handle storage quota errors gracefully and provide manual `.zip` export for user saves.
