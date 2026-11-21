# Phase 04 — Game Catalogue and Library Expansion

- Status: AWAITING_EVALUATION
- Dependencies: Phase 03 accepted

## Objective

Make the catalogue extensible and add a small set of additional games without coupling game-specific logic to the platform shell.

## Scope
- Finalize game registry and manifest validation.
- Add catalogue category/search/filter behavior approved for MVP.
- Add game detail metadata and controls display.
- Add a limited number of additional rights-cleared modules.
- Add per-game lifecycle, asset, input, and regression tests.
- Document game addition/release workflow.

## Excluded
- Public game uploads
- Marketplace or remote plugin execution
- Multiplayer, accounts, cloud sync, and social features

## Work steps
1. Review first-game lessons and contract changes.
2. Approve manifest/catalogue design.
3. Implement registration and metadata validation.
4. Add each new game as a separately scoped spec/task.
5. Test that games do not leak state/resources into one another.
6. Review catalogue usability and performance.

## Acceptance criteria
- [ ] New games can be registered without changing unrelated game modules.
- [ ] Invalid manifests are rejected safely.
- [ ] Search/filter behavior matches approved requirements.
- [ ] Each game has a complete specification and rights record.
- [ ] Game switch/exit does not leak timers, audio, listeners, or state.
- [ ] Regression suite passes.
- [ ] Human reviewer accepts the library behavior.

## AI report (draft v0.1, DEC-003)
- Summary:
  - Catalogue registry of bundled manifests only.
  - Manifests validated three ways: JSON Schema at build time (`npm run validate:manifests`), a runtime structural check (`assertManifest`), and unit tests that keep the two consistent.
  - Catalogue cards show the offline/unsupported state.
- Evidence: unit "every catalogue manifest passes the JSON Schema and the runtime check"; "runtime check rejects what the schema rejects".
- Update (2026-11-22, owner request "add more games like chess"):
  - Added Chess, Checkers (English draughts) and Reversi. Each has original rule implementations, a computer opponent at three levels (in a Web Worker), local two-player mode, undo, autosave/resume with validated restore, and an accessible keyboard/touch board (ARIA grid).
  - Library search and genre filter (FR-012) implemented.
  - Specs: `docs/games/GAME_002_CHESS.md`, `GAME_003_CHECKERS.md`, `GAME_004_REVERSI.md`.
  - Evidence:
    - unit tests: chess perft on five standard positions, rule edge cases, AI mate-in-one, checkers and reversi rules, save validation;
    - e2e: search/filter, chess mouse and keyboard play with computer reply, undo, keyboard pause, resume after reload, checkers and reversi replies, two-player mode.
  - Fixed: the host input service was cancelling arrow/Enter/Space page-wide, so toolbar buttons could not be pressed from the keyboard.
- Not done:
  - favourites (FR-013, Could);
  - computer strength tuning against human players;
  - per-game playtests.

## Human evaluation — owner only
- Reviewer:
- Review date:
- Owner decision: PENDING
- Comments:
- Phase accepted: NO
- Next phase authorized: NO
