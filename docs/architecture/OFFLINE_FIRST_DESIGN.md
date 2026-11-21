# Offline-First Design

- Status: Proposed (Updated for WASM Emulators & Large PS1/PS2 Disc Images).
- Definition: `OFFLINE_READY` means the app shell, required WASM runtime core, user BIOS (if applicable), and the local ROM/ISO file handle or cached bundle are verified available without network access.

## Storage responsibilities

| Browser capability | Intended use | Do not use it for |
|---|---|---|
| Service Worker | Intercept eligible requests and coordinate offline behavior | Storing user ROMs or arbitrary user records |
| Cache Storage | App shell, UI assets, metadata JSON, compiled WASM emulator cores (~5–25 MB) | Large PS1/PS2 ROMs or ISOs (300 MB–4.7 GB) |
| File System Access API | Direct chunked disk reads for user-owned PS1/PS2 `.chd`/`.iso`/`.m3u` files (handles persisted in IndexedDB) | Storing app shell code |
| IndexedDB | Game saves, virtual memory cards (`.mcr`/`.ps2`), compressed save states, user BIOS blobs, fallback ROM blobs (Safari/Firefox), catalog metadata | Executing unverified code |
| localStorage | Small non-sensitive UI preferences only | Large assets, ROMs, BIOS files, or save data |

## Offline states

- `ONLINE`: network is available; online and installed offline content can be used.
- `OFFLINE`: no network; only locally available content can be launched.
- `DOWNLOADING`: app shell or WASM emulator core is being cached.
- `AWAITING_USER_ROM`: catalog entry and WASM core are ready, but user has not linked their local ROM/BIOS file yet.
- `OFFLINE_READY`: WASM core, required BIOS, and local ROM file handle/blob are verified accessible offline.
- `OFFLINE_UNAVAILABLE`: one or more required runtime assets or linked local ROM handles are missing/revoked.
- `UPDATE_AVAILABLE`: a newer app shell or WASM core version exists.
- `STORAGE_ERROR`: package, permission, or save operation failed.

## Download / local-link verification flow

1. Read and validate the game's manifest (`runtimeAdapter`, `romConfig`, `hardwareRequirements`).
2. Verify browser capability (`crossOriginIsolated` for multi-threaded WASM; `navigator.gpu` for PS2).
3. Ensure the required WASM core is cached in Cache Storage (downloading with progress if online).
4. For BYOR titles (PS1/PS2), prompt the user to link their local ROM folder/file (via `showDirectoryPicker` / `showOpenFilePicker`, or `<input type="file">` fallback) and BIOS file if `requiresBios: true`.
5. Verify file extension, header/checksum where applicable, and read permissions without loading multi-GB ISOs entirely into RAM.
6. Write the verified state to IndexedDB and mark `OFFLINE_READY`.
7. Test launch with network disabled.

## Multi-disc & memory card handling (PS1 / PS2)

- **Multi-Disc PS1 Games:** Support `.m3u` playlists referencing multiple `.chd` or `.cue` files in the same user-granted directory handle; expose a `swapDisc(discIndex)` action in the host pause overlay.
- **Save-Data Safety:**
  - Namespace virtual memory cards and save states by `gameId` (or shared system memory card slot) and `schemaVersion`.
  - Provide a one-click **Export Saves (.zip)** utility so users can back up `.mcr`, `.ps2`, and save state files outside browser storage.
  - Warn users that clearing browser site data wipes IndexedDB saves and BIOS blobs.

## Testing scenarios

- First visit online and subsequent cold boot offline
- WASM core cached offline, user links local PS1 `.chd` file while offline
- Browser restarted offline: re-verifying `FileSystemFileHandle` read permission
- Multi-disc PS1 swap (Disc 1 -> Disc 2) while offline
- PS2 launch attempt on unsupported browser (graceful capability warning)
- IndexedDB quota reached during save state creation
- Exporting and re-importing virtual memory card backups
