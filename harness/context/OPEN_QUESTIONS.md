# Open Owner Questions

Use this file to collect questions requiring a project-owner decision. Remove or mark each item resolved only after recording the decision in the relevant authoritative document.

1. Is the initial product strictly single-player with offline support, or is multiplayer a near-term requirement?
2. Which users and devices should be prioritized: desktop browsers, mobile browsers, or equal priority?
   - **Resolved (SCR-001 and owner decision, 2026-11-21):** PS1 BYOR prioritizes desktop browsers (tiers in `docs/product/MVP_SCOPE.md`); native games are desktop first, responsive mobile second — recorded in `docs/product/PRODUCT_REQUIREMENTS.md` §9.
3. What initial game count and genres should be included in the MVP?
4. Which original/rights-cleared game should be the first vertical slice?
   - **Partly resolved (owner decision, 2026-11-21):** selection method — a small original arcade vertical slice first, per `docs/games/GAME_001_FIRST_GAME_BRIEF.md`. The specific concept remains an owner decision in that brief.
5. Should users explicitly download each game for offline use, or should a small starter set be cached by default?
   - **Partly resolved (SCR-001):** for PS1 BYOR, the emulator core is cached and the user links their own disc; a disc is offline-ready only when both are verified (`docs/product/USER_FLOWS.md` Flow B note, PRD §7). The policy for native games remains open.
6. Which browsers and minimum device capabilities should be supported?
   - **Partly resolved (SCR-001):** browser tiers recorded in `docs/product/MVP_SCOPE.md`. Minimum browser versions and device capabilities remain open.
7. What visual direction should the product use?
8. Will the catalogue contain only original games, or also licensed third-party titles?
   - **Resolved (SCR-001):** original native games plus a generic BYOR PS1 player; no third-party games, commercial titles, or box art are distributed — recorded in `docs/product/GAME_CATALOG_POLICY.md` (Emulation and BYOR) and `docs/product/MVP_SCOPE.md`.
9. What measurable performance and reliability targets should be adopted?
   - **Partly resolved (SCR-001):** provisional PS1 performance target recorded in `docs/product/MVP_SCOPE.md` and the PRD non-functional requirements, to be baselined in the Phase 01 spike. Other targets remain open.
10. Is there a preferred Git hosting provider and coding agent?

## Added by SCR-001

Context: `docs/product/SCOPE_CHANGE_001_BYOR.md` §7.

11. **D2** — UI wording for console names.
    - **Resolved (owner decision, 2026-11-21):** use "PS1" with a clear non-affiliation notice — recorded in `docs/product/GAME_CATALOG_POLICY.md` (Trademark wording).
12. **D3** — Tier 2 BYOR fallback: OPFS copy or session-only file?
    - **Open — deferred by owner decision (2026-11-21)** to SPIKE-001 evidence in Phase 01 (`docs/product/SCOPE_CHANGE_001_BYOR.md` §7).
13. **D4** — Should save export/import (FR-022) be Must on Tier 2?
    - **Resolved (owner decision, 2026-11-21):** yes — recorded in `docs/product/PRODUCT_REQUIREMENTS.md` FR-022.
14. **D5** — Size limit for committing small test fixtures.
    - **Resolved (owner decision, 2026-11-21):** ≤ 1 MB per committed fixture; larger fixtures are fetched by checksum — recorded in `docs/product/GAME_CATALOG_POLICY.md` (Test fixtures).
15. **D6** — Roadmap placement of the PS1 BYOR adapter phase.
    - **Resolved (owner decision, 2026-11-21):** insert Phase 04B between Phase 04 and Phase 05, without renumbering — recorded in `docs/product/SCOPE_CHANGE_001_BYOR.md` §7; the roadmap row is added in Phase 01.
16. When should the GPL-3.0-or-later LICENSE file be added (its own approved step)?
    - **Partly resolved (owner decision, 2026-11-21):** an optional Phase 01 item, using the verbatim GNU GPL-3.0 text, that the owner approves separately — recorded in `docs/product/SCOPE_CHANGE_001_BYOR.md` §7.
