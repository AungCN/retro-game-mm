# Phase 04B — PS1 BYOR Player (`wasm-libretro` Adapter)

- Status: PROPOSED
- Dependencies: Phase 04 accepted; ADR-0002 and ADR-0003 accepted
- Origin: SCR-001 (`docs/product/SCOPE_CHANGE_001_BYOR.md`), owner decision D6

## Objective

Deliver the generic PS1 player described in `docs/product/MVP_SCOPE.md`: users play their own PS1 disc images through the `wasm-libretro` adapter behind the shared game-module contract, with files, BIOS and saves kept on their device.

## Scope

### Included
- PS1 player specification and rights record, including the emulator-core rights record required by `docs/product/GAME_CATALOG_POLICY.md`.
- Pinned, self-hosted emulator core fetched at build time with SHA-256 verification (never committed).
- `wasm-libretro` adapter implementing `GameModule` v2 (`docs/architecture/GAME_MODULE_CONTRACT.md`), isolated per ADR-0002.
- Capability and tier gating (FR-019); mobile "not supported yet" message (Flow J).
- Disc linking and local disc list (FR-016, FR-017); Tier 1 persisted file handles with `NEEDS_PERMISSION` re-grant (FR-024); Tier 2 fallback selected by D3.
- BIOS optional / HLE mode (FR-018).
- Memory cards per disc (FR-020); save states (FR-021); `.zip` save export/import (FR-022, Must on Tier 2).
- Multi-disc `.m3u` and disc swap (FR-023), if supported by the approved core.
- Keyboard mapping (Must) and gamepad (Should) for PS1 controls (FR-026).
- Removal flows (FR-025, Flow K) and the no-upload guarantee (FR-027).

### Excluded
- PS2 (post-MVP experiment)
- BYOR on mobile browsers
- Other emulated platforms
- Shipping ROMs, disc images or BIOS files; commercial titles, metadata or art
- Offline packaging of the core beyond what Phase 05 delivers

## Work steps
1. Review SPIKE-001 findings and accepted ADR-0002/ADR-0003.
2. Write and approve the PS1 player specification and core rights record.
3. Propose a file-level implementation plan for owner approval.
4. Implement the adapter, file service, and save storage behind the contract.
5. Add automated tests and the manual BYOR checklist from `docs/quality/TEST_STRATEGY.md`.
6. Record evidence for each acceptance criterion.

## Acceptance criteria
- [ ] Openly licensed homebrew test image boots on Tier 1 and Tier 2 through the shared host.
- [ ] Linked disc relaunches after browser restart (Tier 1 with `NEEDS_PERMISSION` re-grant; Tier 2 with the approved fallback).
- [ ] Memory cards persist across sessions; `.zip` export/import round-trips.
- [ ] Capability gating and mobile "not supported yet" message verified.
- [ ] No network request carries user files (verified).
- [ ] Teardown releases the core, workers/iframe, and audio (verified).
- [ ] Performance measured against the PS1 target or an owner-accepted revision.
- [ ] Core rights record complete; no ROM/BIOS/commercial content in the repository or build.

## AI report
- Summary:
- Files changed:
- Open questions:
- Evidence links:

## Human evaluation — owner only
- Reviewer:
- Review date:
- Owner decision: PENDING
- Comments:
- Phase accepted: NO
- Next phase authorized: NO
