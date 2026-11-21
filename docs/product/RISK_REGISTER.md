# Initial Product and Technical Risk Register

This is a starter register, not a completed risk assessment. R-010 to R-021 were added by SCR-001 (`docs/product/SCOPE_CHANGE_001_BYOR.md`); their likelihood and impact are proposals for owner confirmation. Review and score risks during Phase 00 and whenever material architecture or scope changes occur.

## Scoring guide

- Likelihood: Low / Medium / High
- Impact: Low / Medium / High
- Priority: derive from likelihood and impact; owner confirms prioritization.

| ID | Risk | Likelihood | Impact | Mitigation / response | Owner | Status |
|---|---|---|---|---|---|---|
| R-001 | Retro game code, ROMs, artwork, sound, fonts, or trademarks are not licensed for redistribution | Medium | High | Use original or rights-cleared content; maintain per-game provenance; block release if rights are unclear. SCR-001: BYOR model — the platform distributes no ROMs, disc images, BIOS files, commercial titles, or box art; users supply their own files locally | TBD | Open |
| R-002 | Offline-ready label is shown even though some assets still require network access | Medium | High | Verify required asset list and test launch with network disabled | TBD | Open |
| R-003 | Browser storage is cleared, unavailable, or reaches quota | Medium | Medium | Handle storage errors, provide clear UI, avoid treating local storage as a guaranteed backup | TBD | Open |
| R-004 | Game modules leak timers, event listeners, audio, or rendering resources when exited | Medium | High | Define lifecycle contract and automated cleanup tests | TBD | Open |
| R-005 | AI coding agent changes scope or architecture without approval | Medium | High | Enforce AGENTS.md, explicit approval gates, protected main branch, and owner-only fields | TBD | Open |
| R-006 | Target games perform poorly on lower-powered mobile browsers | Medium | Medium | Choose target devices early; profile representative games; optimize only against measured evidence | TBD | Open |
| R-007 | First-game scope becomes too large and delays the platform foundation | Medium | Medium | Choose a small vertical slice and freeze its acceptance criteria | TBD | Open |
| R-008 | Mobile wrapper introduces behavior differences from browser/PWA | Medium | Medium | Defer mobile implementation; test real devices and native lifecycle separately | TBD | Open |
| R-009 | Dependency or game-engine maintenance/licensing changes create project risk | Low | High | Review current status/license before adoption and at release checkpoints | TBD | Open |
| R-010 | Emulator core loads whole disc images into WASM memory instead of streaming, exhausting memory (PS1: 300–700 MB per disc; PS2: up to 4.7 GB, beyond 32-bit WASM limits) | PS1: Medium; PS2: High | PS1: Medium; PS2: High | Phase 01 PS1 spike measures loading behavior; prefer cores/filesystem layers that read in chunks; PS2 stays post-MVP | TBD | Open |
| R-011 | Persisted file-handle permissions do not survive browser restarts, so linked discs cannot relaunch without user action | High | Medium | `NEEDS_PERMISSION` state and one-action re-grant (FR-024); test across restarts on Tier 1 | TBD | Open |
| R-012 | Safari/Firefox storage eviction or quota limits delete BIOS files, copied discs, or saves | Medium | High | Request persistent storage; quota checks and warnings; save export/import (FR-022); explain site-data clearing | TBD | Open |
| R-013 | GPL obligations for distributed emulator cores are not met (source availability, notices, licence compatibility between cores) | Medium | High | Repository licence direction GPL-3.0-or-later (LICENSE file added in a separate approved step); per-core rights record; licence review in Phase 01 | TBD | Open |
| R-014 | BIOS legality and user confusion about where a BIOS comes from | Medium | Medium | Never ship or link to BIOS files; support HLE/no-BIOS where the core allows; neutral in-app explanation | TBD | Open |
| R-015 | Trademark wording in the UI implies affiliation with the console maker | Medium | Medium | No logos or trade dress; UI uses "PS1" with a clear non-affiliation notice (owner decision D2) | TBD | Open |
| R-016 | COOP/COEP headers block needed resources, or cross-origin isolation is lost when the app is served offline from the service worker | Medium | High | Self-host all assets; host must support custom headers; Phase 01 spike asserts `crossOriginIsolated` online and offline | TBD | Open |
| R-017 | PS1 performance is below the provisional target on Tier 2 browsers | Medium | Medium | Measure and report Tier 2 in the Phase 01 spike; only Tier 1 is gated; owner may revise targets | TBD | Open |
| R-018 | Emulator core supply chain: CDN-loaded or unmaintained core builds of unknown provenance | Medium | High | Self-host cores pinned by version and SHA-256; build provenance recorded in the core rights record; no remote code loading | TBD | Open |
| R-019 | No legally usable test disc images for automated and manual BYOR tests | Medium | Medium | Use openly licensed homebrew only, with provenance recorded; fetch by checksum; committed fixtures ≤ 1 MB (owner decision D5) | TBD | Open |
| R-020 | Imported save states, memory cards, or `.m3u` playlists are untrusted input (malformed data, path traversal) | Low | Medium | Validate formats and versions; resolve playlist entries only within the user-granted folder; reject without altering existing saves | TBD | Open |
| R-021 | Scope creeps to other consoles (`nes`, `snes`, `gba`, `arcade`) or to PS2 before the MVP | Medium | Medium | Out-of-scope list in `MVP_SCOPE.md`; any addition requires a scope change record and owner approval | TBD | Open |

## Risk review record

- Review date:
- Reviewed by:
- New risks:
- Changed risks:
- Owner decisions:
