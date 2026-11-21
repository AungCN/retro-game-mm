# ADR-0003: Offline Caching and Local Storage (Split Shell vs. Multi-GB ROM Architecture)

- Status: PROPOSED — updated for PS1/PS2 & BYOR expansion; Phase 01 adds browser tiers, `NEEDS_PERMISSION`, storage durability, and SPIKE-001 evidence

## Context

The application must support offline launch for selected games and preserve local preferences, memory cards, and save states. However, PS1 disc images (300 MB–700 MB per disc) and PS2 ISOs (1.5 GB–4.7 GB per disc) vastly exceed typical Service Worker Cache Storage limits and must never be committed to Git or bundled into static web builds.

Browser support differs by tier (SCR-001): only desktop Chromium (Tier 1) has the File System Access pickers with persisted handles. Desktop Safari and Firefox (Tier 2) need a fallback. Mobile has no BYOR in the MVP.

## Proposed responsibility split

- **Service Worker & Cache Storage:** App shell, UI assets, catalog metadata JSON, and pinned emulator core files (~5–25 MB). Never used for multi-hundred-megabyte ROMs or ISOs. Cached responses are returned unchanged so isolation headers survive offline.
- **File System Access API (Tier 1):** Store user-granted `FileSystemFileHandle` references in IndexedDB so disc images are read in byte ranges directly from the user's local disk, without duplicating gigabytes into browser storage.
- **Tier 2 fallback (decision D3):** OPFS copy or session-only file (options below).
- **IndexedDB (durable local data):** file handles, disc and BIOS metadata, user-imported BIOS files, virtual memory card images, compressed emulator save states, structured catalog metadata, and user preferences.
- **localStorage:** Small non-critical UI preferences only (e.g., theme, last selected filter).

## Tier 2 options (decision D3)

| Option | How it works | Pros | Cons | Evidence so far |
|---|---|---|---|---|
| **A. OPFS copy** | Copy the selected file into the origin private file system once; read it in ranges through a sync access handle in a worker | Survives restarts; no re-selection; fast range reads | Duplicates the disc in browser storage (quota); deleted with site data; Safari may evict without persistent storage | Chrome 158: 648 MiB copied in 900 ms (~720 MB/s), still present after restart. **Safari and Firefox not yet measured** |
| **B. Session-only file** | Keep the `File` from `<input type="file">` for this session only; read in ranges with `Blob.slice` | No duplication, no quota cost | User re-selects the file every session; not `OFFLINE_READY` between sessions (`AWAITING_USER_ROM`) | Chrome 158: 648 MiB read in 4 MiB slices in 352 ms |
| C. IndexedDB blob | Store the file as a blob in IndexedDB | Works everywhere | Duplicates data like OPFS but without efficient range reads | Not recommended; not measured |

**Provisional recommendation (to confirm with the owner's Safari/Firefox session):** Option A (OPFS copy), with Option B as the fallback when quota is insufficient or persistent storage is refused. The UI must state that a copy is made and how much space it uses. D3 stays open until Tier 2 numbers exist.

## Permission lifecycle (Tier 1)

1. **Link:** `showOpenFilePicker` (user gesture). Store the handle in IndexedDB. State: `OFFLINE_READY`.
2. **Browser restart:** `queryPermission({ mode: 'read' })` typically returns `prompt`. State: `NEEDS_PERMISSION`.
3. **Re-grant:** the user selects the disc, and the app calls `requestPermission({ mode: 'read' })` from that click. If granted, `OFFLINE_READY`; if denied, the state stays `NEEDS_PERMISSION` with an explanation.
4. **File moved, renamed, or deleted:** reading fails. State: `OFFLINE_UNAVAILABLE`, offering a re-link.

Only read permission is ever requested. The exact Chrome prompt wording, and whether "allow on every visit" is offered, are recorded in the owner session (SPIKE-001 A5).

## Storage durability

- Call `navigator.storage.persist()` after the user links their first disc or imports a BIOS, so the request follows a meaningful action. Record `persisted()` in the capability report.
- Check `navigator.storage.estimate()` before an OPFS copy. If free quota is below the file size plus a margin, offer Option B instead.
- Tell users that clearing site data deletes BIOS files, saves, and OPFS copies, and point them to save export (FR-022, Must on Tier 2).
- SPIKE-001 (Chrome headless): `persisted()` was `false`, and quota was about 10 GB. Usage reporting after restart looked wrong (0 MB with a 648 MiB OPFS file present), so it is to be re-checked in real browsers.

## Shared availability states

`NOT_INSTALLED`, `DOWNLOADING`, `AWAITING_USER_ROM`, `NEEDS_PERMISSION`, `OFFLINE_READY`, `OFFLINE_UNAVAILABLE`, `UPDATE_AVAILABLE`, `STORAGE_ERROR`, `UNSUPPORTED` — the same vocabulary as `GAME_MODULE_CONTRACT.md`, `DATA_MODEL.md`, and `OFFLINE_FIRST_DESIGN.md`.

## Alternatives / details to evaluate

- Streaming chunked reads from `FileSystemFileHandle` vs. full-file memory buffering. SPIKE-001: whole-file loading holds memory equal to the file size (649 MB for 648 MiB at the platform level; 657 MB inside EmulatorJS). EmulatorJS 4.2.3 always loads whole files, so the storage layer's range reads are only used once Phase 04B adds a streaming loader.
- EmulatorJS's own IndexedDB caches (`EmulatorJS-roms`, `EmulatorJS-core`) must stay disabled (`EJS_disableDatabases`); otherwise every disc would be silently copied into browser storage, outside this ADR's rules.
- Export/import `.zip` backup flow for memory cards and save states. Zip implementation is chosen in Phase 04B or 05 with dependency approval.
- Cache naming and atomic update strategy for emulator cores (Phase 05)
- Storage quota estimation and clear user warnings (above)

## Recommendation

Decouple **Engine/Shell Offline Readiness** (managed by Service Worker + Cache Storage) from **ROM Availability** (managed through local file handles on Tier 1 and the D3 mechanism on Tier 2). Never mark a PS1/PS2 title as `OFFLINE_READY` unless both its required WASM core/BIOS and its local ROM handle are verified accessible offline.

- Implementation notes: Prioritize `.chd` (Compressed Hunks of Data) support to reduce PS1/PS2 file sizes by 40–60%.

## Consequences

- Tier 1 users see a one-click re-grant after most browser restarts (`NEEDS_PERMISSION`); the UI and flows must make this quick and clear.
- With an OPFS copy, Tier 2 users pay the disc's size in browser storage and lose the copy if site data is cleared; with a session-only file, they re-select the disc each session.
- Saves live only in browser storage unless exported, so `.zip` export is essential on Tier 2.
- Whole-file loading by the core would cost memory equal to the disc size; streaming through range reads is preferred.
- `OFFLINE_READY` for BYOR depends on user-controlled files outside the app, so the state must be re-verified at launch, not trusted from a stored flag.

## Owner decision

- Decision: PENDING
- Approved by/date:
