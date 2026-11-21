# Project Decision Log

Record material product, technical, scope, and release decisions. Link to the full ADR or evaluation record.

| Date | ID | Decision | Owner | Status | Related document |
|---|---|---|---|---|---|
| To be completed | DEC-000 | Starter-kit assumptions require Phase 00 validation | Project owner | PENDING | `GOALS.md`, PRD |
| 2026-11-21 | DEC-001 | Adopt Mixed Runtime Adapter model (native-canvas, wasm-libretro for PS1, wasm-ps2) and split offline/local BYOR ROM streaming | Project owner | PROPOSED | `ADR-0002`, `ADR-0003` |

## Decision entry template

### [DEC-ID] [Title]
- Date:
- Context:
- Options considered:
- Decision:
- Rationale:
- Consequences:
- Owner:
- Evidence/ADR:

### DEC-001: Multi-Adapter Runtime & Split Offline Storage for PS1/PS2 Expansion
- Date: 2026-11-21
- Context: Expanding catalog scope from native HTML5 web games to include PlayStation 1 (PS1) and PlayStation 2 (PS2) titles while keeping the repository 100% open-source and free of copyrighted binaries.
- Options considered: Single HTML5 Canvas engine vs. Mixed Runtime Adapter model with BYOR (Bring Your Own ROM) local streaming.
- Decision: Standardize on a unified `GameModule` interface backed by `native-canvas`, `wasm-libretro` (PS1), and experimental `wasm-ps2` (WebGPU) adapters. Keep Service Worker caching strictly for the app shell and WASM cores (~5–25 MB), while streaming multi-GB PS1/PS2 disc images directly from local disk via the File System Access API (with IndexedDB fallback and virtual memory card storage).
- Rationale: Prevents browser storage quota exhaustion, avoids committing copyrighted ROMs/BIOS files to Git, and isolates GPLv3 emulator workers from MIT/Apache host UI code.
- Consequences: Dev server and production host must serve COOP/COEP headers (`Cross-Origin-Opener-Policy: same-origin` and `Cross-Origin-Embedder-Policy: require-corp`) to enable `SharedArrayBuffer`.
- Owner: Project owner
- Evidence/ADR: `docs/decisions/ADR-0002-GAME-RUNTIME.md`, `docs/decisions/ADR-0003-OFFLINE-STORAGE.md`
