# Source

Application source for draft v0.1. Layout and dependency rules: `docs/architecture/APPLICATION_ARCHITECTURE.md`.

- `app/` — shell, routing, app state
- `pages/`, `components/` — platform UI
- `domain/games/` — manifests and catalogue registry
- `game-runtime/` — contract types, host lifecycle, `wasm-libretro` adapter and protocol
- `game-modules/` — one folder per game (manifest + module)
- `platform/` — input, audio, storage (IndexedDB, backups), files (BYOR), offline, capabilities, zip
