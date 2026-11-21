# ADR-0003: Offline Caching and Local Storage (Split Shell vs. Multi-GB ROM Architecture)

- Status: PROPOSED — updated for PS1/PS2 & BYOR expansion

## Context

The application must support offline launch for selected games and preserve local preferences, memory cards, and save states. However, PS1 disc images (300 MB–700 MB per disc) and PS2 ISOs (1.5 GB–4.7 GB per disc) vastly exceed typical Service Worker Cache Storage limits and must never be committed to Git or bundled into static web builds.

## Proposed responsibility split

- **Service Worker & Cache Storage:** App shell, UI assets, catalog metadata JSON, and compiled WASM emulator cores (~5 MB–25 MB). Never used for multi-hundred-megabyte ROMs or ISOs.
- **File System Access API (Primary BYOR ROM Storage):** Store user-granted `FileSystemDirectoryHandle` / `FileSystemFileHandle` references in IndexedDB so PS1/PS2 `.chd` or `.iso` files stream directly from the user's local disk without duplicating gigabytes into browser cache.
- **IndexedDB (Fallback ROM Storage + Durable Saves):**
  - Store user-imported ROM blobs *only* on browsers lacking File System Access API (e.g., Safari/Firefox) with explicit storage quota checks.
  - Store structured catalog metadata, user-imported BIOS files, virtual memory card images (`.mcr`, `.ps2`), compressed emulator save states, and user preferences.
- **localStorage:** Small non-critical UI preferences only (e.g., theme, last selected filter).

## Alternatives / details to evaluate

- Streaming chunked reads from `FileSystemFileHandle` vs. full-file memory buffering for large PS2 ISOs
- Export/import `.zip` backup flow for IndexedDB virtual memory cards and save states
- Cache naming and atomic update strategy for WASM cores
- Storage quota estimation (`navigator.storage.estimate()`) and clear user warnings

## Recommendation

Decouple **Engine/Shell Offline Readiness** (managed by Service Worker + Cache Storage) from **ROM Availability** (managed via local File System handles or explicit IndexedDB import). Never mark a PS1/PS2 title as `OFFLINE_READY` unless both its required WASM core/BIOS and its local ROM handle are verified accessible offline.

- Implementation notes: Prioritize `.chd` (Compressed Hunks of Data) support to reduce PS1/PS2 file sizes by 40–60%.

## Owner decision

- Decision: PENDING
- Approved by/date:
