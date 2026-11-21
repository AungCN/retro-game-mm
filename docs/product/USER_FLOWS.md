# User Flows

These are initial flows for design and testing. Validate them with the owner before implementation.

## Flow A — Find and play a game online

1. Open the application.
2. Browse, search, or filter the catalogue.
3. Select a game.
4. Review description, controls, and offline status.
5. Select Play.
6. If resources are missing, show a clear loading/download state.
7. Start the game and provide an accessible way to pause or exit.
8. Return to the catalogue.

## Flow B — Prepare a game for offline play

1. Open a game's details while online.
2. Review package size and offline requirements when known.
3. Select Make available offline / Download.
4. Show progress, cancellation, and failure/retry states.
5. Verify required files and mark the game Offline ready only after verification.
6. Allow the user to remove the offline package later.

**BYOR note (SCR-001):** for the PS1 player, preparing for offline play has two parts: the platform downloads and caches the emulator core (steps 2–5 apply), and the user links their own disc image (Flow F). The disc is marked offline-ready only when both parts are verified.

## Flow C — Play offline

1. Launch the application with no network connection.
2. Show an offline indicator without blocking local navigation.
3. Show locally available games as playable.
4. Show unavailable games as unavailable offline with a useful explanation.
5. Launch an offline-ready game.
6. Preserve local progress where supported.
7. On reconnect, do not silently overwrite local data with remote data; cloud sync is a later feature requiring conflict rules.

## Flow D — Recover from a failure

1. Game or asset loading fails.
2. Show a plain-language message and safe recovery actions.
3. Preserve existing local saves where possible.
4. Offer retry, return to catalogue, or remove/re-download the package where appropriate.
5. Log diagnostic details without exposing secrets or unnecessary personal data.

## Flow E — Add a game (maintainer workflow)

1. Complete a game specification using `docs/games/GAME_TEMPLATE.md`.
2. Verify code, title, artwork, music, sound, fonts, and other distribution rights.
3. Prepare a manifest that follows the approved schema.
4. Implement the game against the shared module contract.
5. Add unit/integration and manual test cases.
6. Review performance, input, pause/resume, offline package, and save compatibility.
7. Obtain human acceptance before registering it in a production catalogue.

## PS1 BYOR flows (added by SCR-001)

Tiers are defined in `docs/product/MVP_SCOPE.md`. These flows describe product behavior; the storage and permission mechanisms are designed in Phase 01.

## Flow F — Set up the PS1 player and link a disc

1. Open the PS1 player from the catalogue.
2. The platform checks browser capability and tier (FR-019). On mobile, go to Flow J.
3. If the emulator core is not cached, download it with progress (online only).
4. Optional: import a BIOS file, or continue in HLE/no-BIOS mode where the core supports it. Show which mode is active and its compatibility implications.
5. Select a disc image from the device:
   - Tier 1: link the file so it can be reopened later without re-importing.
   - Tier 2: use the Phase 01-approved fallback (OPFS copy or session-only file), and explain whether the disc will need to be selected again next time.
6. Name the disc; add it to the local disc list.
7. Verify the file format without loading the whole image into memory; mark it ready.
8. **Error/recovery:** unsupported format, unreadable file, BIOS rejected, quota exceeded, or core download failure — show a plain-language message, keep existing discs and saves intact, and offer retry, choose another file, or return to the catalogue.

## Flow G — Relaunch a linked disc after restart or while offline

1. Open the app (online or offline) and the local disc list.
2. Discs show one of: offline-ready, `NEEDS_PERMISSION`, or unavailable (with the reason).
3. For `NEEDS_PERMISSION`, the user selects the disc and grants access with one action.
4. Launch the disc; memory cards load for that disc.
5. **Error/recovery:** permission denied, file moved/renamed/deleted, or core missing offline — explain what is missing, keep saves intact, and offer re-link, re-grant, or remove.

## Flow H — Swap discs in a multi-disc game

1. Launch a disc set from an `.m3u` playlist.
2. When the game asks for another disc, open the pause menu and choose the disc.
3. Resume play; the memory card stays attached.
4. **Error/recovery:** a referenced disc is missing or outside the granted folder — explain which disc is missing, keep the session paused, and offer to link it or return to the disc list.

## Flow I — Back up and restore saves

1. Open settings or the disc details and choose Export saves.
2. Download a `.zip` containing memory cards and save states.
3. To restore, choose Import saves and select a backup; show what will be replaced before confirming.
4. **Error/recovery:** invalid or incompatible backup, or quota exceeded — reject without changing existing saves and explain why.

## Flow J — Unsupported device or browser

1. User opens the PS1 player on a mobile browser, or attempts to open PS2 content.
2. Show a clear "not supported yet" message that explains the reason and points to the native games that do work.
3. Do not show broken controls or start downloading cores.
4. **Error/recovery:** if capability detection itself fails, treat the device as unsupported and say so rather than attempting launch.

## Flow K — Remove a disc, BIOS, or save data

1. Open the disc list, disc details, or settings and choose remove.
2. Explain exactly what will be deleted (link only, copied disc data, BIOS, memory cards, save states) and whether it can be recovered; offer Export saves first.
3. Confirm, delete, and update the disc list and storage usage.
4. **Error/recovery:** deletion fails partway — report what was and was not removed and leave the disc list consistent.
