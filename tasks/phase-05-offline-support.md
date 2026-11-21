# Phase 05 — PWA and Offline Game Support

- Status: PROPOSED
- Dependencies: Phase 01 architecture accepted; Phases 02–04B accepted

## Objective

Make the application shell and selected game packages reliably usable offline, with visible installation state and safe update/recovery behavior.

## Scope
- Add approved web app manifest and service worker strategy.
- Cache app shell and versioned static assets.
- Add per-game offline package/install state.
- Add progress, cancel, retry, remove, and error states as appropriate.
- Store package metadata and saves in approved storage layers.
- Implement cache versioning and cleanup.
- Test offline launch after closing/reopening browser.
- BYOR (added by SCR-001): cache the pinned emulator core as an offline package; verify a linked disc is offline-ready only when core, BIOS (if required) and disc are all locally available; implement and test the `NEEDS_PERMISSION` re-grant offline; confirm `crossOriginIsolated` is still true when the app is served by the service worker without network.

## Excluded
- Cloud synchronization
- Background downloads unless separately approved and supported
- Remote execution of game code

## Work steps
1. Reconfirm ADR-0003 and offline scenarios.
2. Plan cache keys, versioning, install flow, and rollback.
3. Implement app shell offline behavior.
4. Implement game asset preparation and verified offline-ready state.
5. Implement storage/quota/error recovery.
6. Run the offline test matrix, including actual network disconnection.

## Acceptance criteria
- [ ] App shell opens offline after successful initial setup.
- [ ] Fully installed games launch without network requests for required resources.
- [ ] Uninstalled/partial games are not labelled offline-ready.
- [ ] Interrupted downloads recover safely.
- [ ] Update does not destroy the last working package before replacement succeeds.
- [ ] Storage/quota errors are understandable and do not silently corrupt saves.
- [ ] User can see/manage offline game availability.
- [ ] No-network tests pass on agreed browsers/devices.
- [ ] A linked PS1 disc relaunches offline after browser restart on Tier 1 (with `NEEDS_PERMISSION` re-grant) and on Tier 2 (with the approved fallback).

## Human evaluation — owner only
- Reviewer:
- Review date:
- Owner decision: PENDING
- Comments:
- Phase accepted: NO
- Next phase authorized: NO
