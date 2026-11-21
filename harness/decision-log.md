# Project Decision Log

Record material product, technical, scope, and release decisions. Link to the full ADR or evaluation record.

| Date | ID | Decision | Owner | Status | Related document |
|---|---|---|---|---|---|
| To be completed | DEC-000 | Starter-kit assumptions require Phase 00 validation | Project owner | PENDING | `GOALS.md`, PRD |
| 2026-11-21 | DEC-001 | Adopt Mixed Runtime Adapter model (native-canvas, wasm-libretro for PS1, wasm-ps2) and split offline/local BYOR ROM streaming | Project owner | PROPOSED | `ADR-0002`, `ADR-0003` |
| 2026-11-21 | DEC-002 | Scope change SCR-001: PS1 BYOR player in MVP; PS2 experimental post-MVP; no distributed ROMs/BIOS/commercial titles; browser tiers | Project owner | PROPOSED | `docs/product/SCOPE_CHANGE_001_BYOR.md` |

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

### DEC-002: Scope change SCR-001 — BYOR PS1 in MVP, experimental PS2 post-MVP
- Date: 2026-11-21
- Context: DEC-001 introduced PS1/PS2 emulation at the architecture level while product documents still described a native-only MVP.
- Options considered: native only; native + PS1 BYOR in MVP with PS2 post-MVP; all three in MVP; emulation-first; curated commercial catalogue; generic player without a disc list (see SCR-001 §3).
- Decision (as proposed in SCR-001): native games first; generic PS1 BYOR player in the MVP; PS2 experimental, post-MVP, Phase 01 desk research only; platforms limited to `web-native`, `ps1`, `ps2`; browser Tier 1 desktop Chromium, Tier 2 desktop Safari/Firefox, no BYOR on mobile in the MVP; no distributed ROMs, BIOS, commercial titles, or box art; repository licence direction GPL-3.0-or-later (LICENSE file in a separate step); host must support COOP/COEP headers.
- Rationale: aligns product scope with DEC-001, keeps the rights posture explicit, and prevents PS2 uncertainty from blocking the MVP.
- Consequences: Phase 01 grows (architecture alignment, PS1 spike, PS2 desk research, licence review); one new roadmap phase for the PS1 BYOR adapter; new risks R-010–R-021.
- Owner: Project owner
- Evidence/ADR: `docs/product/SCOPE_CHANGE_001_BYOR.md`
