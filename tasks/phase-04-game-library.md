# Phase 04 — Game Catalogue and Library Expansion

- Status: PROPOSED
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

## Human evaluation — owner only
- Reviewer:
- Review date:
- Owner decision: PENDING
- Comments:
- Phase accepted: NO
- Next phase authorized: NO
