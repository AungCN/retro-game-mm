# Data Model

- Status: Initial logical model; physical schema to be approved in Phase 01.
- MVP assumes local-only profile data. User disc images, BIOS files, and saves never leave the device (FR-027).
- Updated for SCR-001 (BYOR PS1): runtime packages, disc links, BIOS records, memory cards, save states.

## Shared availability states

Used by `GameInstallation`, `RuntimePackage`, and `DiscLink`. The same vocabulary appears in `GAME_MODULE_CONTRACT.md`, `OFFLINE_FIRST_DESIGN.md`, and ADR-0003.

`NOT_INSTALLED`, `DOWNLOADING`, `AWAITING_USER_ROM`, `NEEDS_PERMISSION`, `OFFLINE_READY`, `OFFLINE_UNAVAILABLE`, `UPDATE_AVAILABLE`, `STORAGE_ERROR`, `UNSUPPORTED`

## Core entities

### GameDescriptor

Derived from a validated manifest (`game-manifest.schema.json`, manifest version 1).

- `id`: stable unique game ID
- `title`, `description`, `genre`
- `version`, `manifestVersion`
- `platform` (`web-native`, `ps1`, `ps2`) and `runtimeAdapter`
- `thumbnail` and optional media references (original art only)
- `supportedInputs`, `controllerProfile`
- `orientation`
- `hardwareRequirements` (including `browserTiers`)
- `romConfig` (BYOR entries only: `coreId`, `acceptedExtensions`, `biosMode`, `maxDiscs`)
- `offlineSupported`, `contentSource` (`bundled` or `user-supplied`)
- `requiredAssets`
- `saveSupported` and `saveSchemaVersion`
- `rightsRecordReference`
- `catalogueStatus`

### GameInstallation

For bundled native games.

- `gameId`
- `gameVersion`
- `state` (AvailabilityState; normally `NOT_INSTALLED`, `DOWNLOADING`, `OFFLINE_READY`, `UPDATE_AVAILABLE`, `STORAGE_ERROR`)
- `installedAt`
- `assetKeys[]`
- `lastVerifiedAt`

### RuntimePackage

A pinned, self-hosted emulator core cached for offline use.

- `coreId`, `coreVersion`
- `sha256` per file
- `state` (AvailabilityState)
- `cachedAt`, `lastVerifiedAt`
- `rightsRecordReference` (core rights record in `GAME_CATALOG_POLICY.md`)

### DiscLink

A user's own disc image, known to the app.

- `discId`: generated locally, stable for the life of the link
- `gameId`: the player entry it belongs to (for example `ps1-player`)
- `label`: entered by the user; never looked up from a title database
- `storageKind`: `fs-handle` (Tier 1), `opfs-copy` or `session-file` (Tier 2; per D3)
- `handle` (for `fs-handle`, the persisted `FileSystemFileHandle`), or `opfsPath` (for `opfs-copy`); nothing stored for `session-file`
- `fileName`, `sizeBytes`
- `fingerprint`: locally computed SHA-256 of the file size plus the first and last 1 MiB, used to match saves to the same disc after re-linking. Never sent anywhere.
- `discSet`: ordered disc IDs for `.m3u` multi-disc sets, if any
- `state` (AvailabilityState; normally `AWAITING_USER_ROM`, `NEEDS_PERMISSION`, `OFFLINE_READY`, `OFFLINE_UNAVAILABLE`, `STORAGE_ERROR`)
- `linkedAt`, `lastVerifiedAt`

### BiosRecord

- `biosId`, `platform`
- `source`: `user` (imported file) or `hle` (no file; core's built-in mode)
- `fileName`, `sizeBytes`, `sha256` (for `user`; computed locally)
- `importedAt`

No list of known BIOS hashes is shipped. Validation is limited to size and format checks.

### MemoryCard

- `gameId`, `discId` (or a shared-slot key)
- `slot`
- `schemaVersion`
- `data` (binary)
- `updatedAt`

### SaveState

- `gameId`, `discId`, `slot`
- `coreId`, `coreVersion` (a state from a different core version is not loaded)
- `schemaVersion`
- `data` (compressed binary)
- `createdAt`

### GameSave

- `gameId`
- `schemaVersion`
- `savedAt`
- `data` (game-specific, validated payload)

### UserPreferences

- audio enabled/volume
- reduced-motion preference (where relevant)
- control preferences and per-profile key/gamepad mappings
- theme preference

### Favorite

- `gameId`
- `createdAt`

## Storage placement

Detailed in ADR-0003.

| Entity | Store |
|---|---|
| App shell, catalogue metadata, emulator core files | Cache Storage (service worker) |
| GameDescriptor cache, GameInstallation, RuntimePackage, DiscLink (including file handles), BiosRecord metadata, MemoryCard, SaveState, GameSave, UserPreferences, Favorite | IndexedDB |
| BIOS file contents | IndexedDB (small, a few hundred KB) |
| Copied disc images (`opfs-copy`) | OPFS |
| Disc images on Tier 1 | Not stored — read from the user's file through the handle |
| Small non-sensitive UI preferences | localStorage |

## Data rules

- Stable game IDs must not depend on display titles.
- Save data, memory cards and save states must be namespaced by game ID and disc ID.
- Save schema changes require an explicit migration or safe reset strategy.
- Do not store passwords, tokens, or sensitive personal information in the local MVP data model.
- Disc labels, file names, and fingerprints are personal data about the user's library: keep them local and never include them in diagnostics.
- Keep data minimization in mind if accounts or telemetry are introduced later.
- Data deletion actions should explain what is deleted and whether it can be recovered (Flow K); offer save export first.

## Future-only entities

Accounts, cloud save copies, sync-conflict records, multiplayer sessions, leaderboards, and social profiles are not part of the MVP. Add them only after separate requirements and security/privacy review.
