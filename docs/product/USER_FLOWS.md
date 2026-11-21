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
