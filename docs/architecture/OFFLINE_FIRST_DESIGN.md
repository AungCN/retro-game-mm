# Offline-First Design

- Status: Proposed (updated in Phase 01 for SCR-001, browser tiers, and SPIKE-001 evidence).
- Definition: `OFFLINE_READY` means the app shell, the required emulator core (for BYOR entries), the BIOS if the selected mode requires one, and the user's disc image (through a persisted handle or an OPFS copy) are verified available without network access (PRD §7).

## Storage responsibilities

| Browser capability | Intended use | Do not use it for |
|---|---|---|
| Service Worker | Intercept eligible requests and coordinate offline behavior; return cached responses with their isolation headers intact | Storing user ROMs or arbitrary user records |
| Cache Storage | App shell, UI assets, metadata JSON, pinned emulator core files | Disc images (300 MB–4.7 GB) |
| File System Access API (Tier 1) | Read the user's own disc image in byte ranges through a handle persisted in IndexedDB | Storing app shell code; write access to user files |
| OPFS (Tier 2, if D3 selects it) | Copy of a user's disc image, read in byte ranges through a sync access handle in a worker | Anything that must survive "clear site data" |
| IndexedDB | File handles, disc and BIOS metadata, BIOS contents, memory cards, compressed save states, game saves, catalogue metadata | Executing unverified code; large disc images |
| localStorage | Small non-sensitive UI preferences only | Large assets, ROMs, BIOS files, or save data |

## Connectivity

- `ONLINE`: network is available; online and installed offline content can be used.
- `OFFLINE`: no network; only locally available content can be launched.

Connectivity is shown separately from availability; an entry can be `OFFLINE_READY` while the app is `ONLINE`.

## Availability states

Shared vocabulary with `GAME_MODULE_CONTRACT.md`, `DATA_MODEL.md`, and ADR-0003.

- `NOT_INSTALLED`: the entry's shipped files (game assets or emulator core) are not cached.
- `DOWNLOADING`: the app shell, game assets, or emulator core are being cached.
- `AWAITING_USER_ROM`: the catalogue entry and core are ready, but the user has not linked a disc (or, for a session-only file, must select it again).
- `NEEDS_PERMISSION`: a linked disc is stored locally but its file permission must be re-granted with one user action (typically after a browser restart on Tier 1). Playable offline after the re-grant.
- `OFFLINE_READY`: everything the entry needs is verified available without network access.
- `OFFLINE_UNAVAILABLE`: a required asset, core, BIOS, or disc is missing, moved, or revoked.
- `UPDATE_AVAILABLE`: a newer app shell, game, or core version exists. The working version stays until the update succeeds.
- `STORAGE_ERROR`: a package, permission, quota, or save operation failed.
- `UNSUPPORTED`: the browser or device does not meet the entry's requirements (for example BYOR on mobile, or PS2 outside Tier 1).

## Download / local-link verification flow

1. Read and validate the game's manifest (`runtimeAdapter`, `romConfig`, `hardwareRequirements`, `offline.contentSource`).
2. Build the capability report (`crossOriginIsolated`, File System Access, OPFS, WebGPU, tier). If requirements are not met, mark `UNSUPPORTED` and stop (Flow J).
3. Ensure the required core is cached in Cache Storage and matches its pinned SHA-256 (downloading with progress if online).
4. For BYOR entries, ask the user to link their disc:
   - Tier 1: `showOpenFilePicker`, handle persisted in IndexedDB.
   - Tier 2: the D3 mechanism (OPFS copy, or a session-only `<input type="file">`).
   - BIOS: only if `biosMode` is `required`, or `optional` and the user chooses to import one.
5. Verify file extension, header, and size, and read permission, without loading the whole image into memory.
6. Write the verified state to IndexedDB and mark `OFFLINE_READY` (or `AWAITING_USER_ROM` for a session-only file).
7. Test launch with network disabled.

## Relaunch after restart

| Tier | Storage kind | Expected state after restart | User action |
|---|---|---|---|
| 1 | `fs-handle` | `NEEDS_PERMISSION` (unless the browser kept the grant) | One click to re-grant; then `OFFLINE_READY` |
| 2 | `opfs-copy` | `OFFLINE_READY` (copy persisted across a Chrome restart in SPIKE-001; Safari/Firefox pending) | None |
| 2 | `session-file` | `AWAITING_USER_ROM` | Select the file again |

If a linked file was moved, renamed, or deleted, the disc becomes `OFFLINE_UNAVAILABLE` with a re-link action (Flow G).

## Cross-origin isolation offline

The app shell must still be cross-origin isolated when served by the service worker with no network. SPIKE-001 A2 verified this in Chrome 158: with the server stopped and the browser restarted, a network-first service worker that stores and returns responses unchanged kept `crossOriginIsolated === true`. Safari and Firefox are pending. Any service-worker library chosen in Phase 05 must preserve this behavior.

## Multi-disc & memory card handling (PS1)

- **Multi-disc:** support `.m3u` playlists referencing `.chd` or `.cue` files in the same user-granted directory (Tier 1) or the same import (Tier 2). The host pause overlay exposes disc swap through the contract's `DiscSwappable` extension.
- **Save-data safety:**
  - Namespace memory cards and save states by `gameId` and `discId`, with `schemaVersion` (and core version for save states).
  - Provide **Export saves (.zip)** — Must on Tier 2 (FR-022, owner decision D4) — so users can back up memory cards and save states outside browser storage.
  - Request persistent storage (`navigator.storage.persist()`) and warn users that clearing site data deletes saves, BIOS files, and OPFS copies.

## Testing scenarios

- First visit online and subsequent cold boot offline
- `crossOriginIsolated` true online, offline, and after browser restart offline
- Core cached offline; user links a local PS1 disc while offline
- Browser restarted offline: Tier 1 `NEEDS_PERMISSION` re-grant; Tier 2 OPFS copy still present; session file requires re-selection
- Linked file moved or renamed
- Multi-disc PS1 swap (Disc 1 → Disc 2) while offline
- BYOR entry on mobile and PS2 entry outside Tier 1 show `UNSUPPORTED` messaging
- Quota reached during OPFS copy or save-state creation
- Exporting and re-importing memory card and save-state backups
