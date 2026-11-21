# Data Model

- Status: Initial logical model; physical schema to be approved in Phase 01.
- MVP assumes local-only profile data.

## Core entities

### GameDescriptor

- `id`: stable unique game ID
- `title`, `description`, `genre`
- `version`
- `thumbnail` and optional media references
- `supportedInputs`
- `orientation`
- `offlineSupported`
- `requiredAssets`
- `saveSupported` and `saveSchemaVersion`
- `rightsRecordReference`
- `catalogueStatus`

### GameInstallation

- `gameId`
- `gameVersion`
- `state` (not installed, downloading, offline ready, error)
- `installedAt`
- `assetKeys[]`
- `lastVerifiedAt`

### GameSave

- `gameId`
- `schemaVersion`
- `savedAt`
- `data` (game-specific, validated payload)

### UserPreferences

- audio enabled/volume
- reduced-motion preference (where relevant)
- control preferences
- theme preference

### Favorite

- `gameId`
- `createdAt`

## Data rules

- Stable game IDs must not depend on display titles.
- Save data must be namespaced by game ID.
- Save schema changes require an explicit migration or safe reset strategy.
- Do not store passwords, tokens, or sensitive personal information in the local MVP data model.
- Keep data minimization in mind if accounts or telemetry are introduced later.
- Data deletion actions should explain what is deleted and whether it can be recovered.

## Future-only entities

Accounts, cloud save copies, sync-conflict records, multiplayer sessions, leaderboards, and social profiles are not part of the MVP. Add them only after separate requirements and security/privacy review.
