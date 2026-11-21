# Project Decision Log

Record material product, technical, scope, and release decisions. Link to the full ADR or evaluation record.

| Date | ID | Decision | Owner | Status | Related document |
|---|---|---|---|---|---|
| To be completed | DEC-000 | Starter-kit assumptions require Phase 00 validation | Project owner | APPROVED | `GOALS.md`, PRD |
| 2026-11-21 | DEC-001 | Adopt Mixed Runtime Adapter model (native-canvas, wasm-libretro for PS1, wasm-ps2) and split offline/local BYOR ROM streaming | Project owner | PROPOSED | `ADR-0002`, `ADR-0003` |
| 2026-11-21 | DEC-002 | Scope change SCR-001: PS1 BYOR player in MVP; PS2 experimental post-MVP; no distributed ROMs/BIOS/commercial titles; browser tiers | Project owner | APPROVED | `docs/product/SCOPE_CHANGE_001_BYOR.md` |
| 2026-11-22 | DEC-003 | Draft-first mode: per-phase plan approval suspended; agent builds a first draft across phases for later owner review; study/research, non-commercial use | Project owner | APPROVED IN CHAT — owner to confirm | `AGENTS.md` (Owner override) |
| 2026-11-22 | DEC-004 | Emulator iframe CSP relaxation (`script-src 'unsafe-eval' blob:`, `connect-src blob:`), non-threaded PS1 core, EmulatorJS via integrity-verified tarballs | Project owner | APPROVED IN CHAT — owner to confirm | `ADR-0002`, `SECURITY_GUIDELINES.md`, SPIKE-001 |

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

### DEC-003: Draft-first mode
- Date: 2026-11-22
- Context: Phase 00 and Phase 01 were accepted. The owner asked to stop phase-by-phase approval, build a first draft across phases, and review it later. The project is for study and research, not commercial use.
- Decision: per-phase plan approval is suspended (see `AGENTS.md`, Owner override). All other rules — owner-only fields, protected branch, licensing, security — still apply.
- Consequences: phases 02–06 and 04B are drafted together on branch `draft/v0.1-first-build` and set to `AWAITING_EVALUATION`. Review happens after the draft.
- Owner: Project owner (statement in chat, 2026-11-22; the status column records that it was given in chat)

### DEC-004: Emulator iframe CSP and core configuration
- Date: 2026-11-22
- Context: SPIKE-001 showed EmulatorJS 4.2.3 cannot start under the baseline CSP.
- Decision:
  - The emulator iframe document alone gets `script-src 'unsafe-eval' blob:` and `connect-src blob:`; `connect-src` otherwise stays `'self'`.
  - Use the non-threaded `pcsx_rearmed` core.
  - Fetch EmulatorJS as integrity-verified npm tarballs, never via `npm install`.
- Consequences: the shell keeps the strict CSP. The update check and CDN core fallback stay blocked.
- Owner: Project owner (approved in chat, 2026-11-22; to be confirmed in ADR-0002's owner block)

