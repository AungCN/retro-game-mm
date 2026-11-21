# Product Goals and Boundaries

## Product vision

Create a welcoming, modern arcade hub for a curated collection of retro-style games. The platform should be quick to open, simple to navigate, enjoyable on desktop and mobile browsers, and useful even when the user is offline.

## Primary goals

1. Provide a central library for discovering and launching games.
2. Make each game a self-contained module that can be added or updated without rewriting the platform.
3. Support online play and offline play for games whose assets have been installed/cached.
4. Support responsive layouts and appropriate keyboard/touch controls.
5. Preserve game progress/settings locally where the game supports saving.
6. Make offline readiness and storage state understandable to users.
7. Keep the architecture suitable for later Android/iOS packaging.
8. Maintain a clear record of game provenance, assets, and licenses.
9. Let users play their own legally obtained PS1 disc images in the browser (BYOR — Bring Your Own ROM), with files, BIOS, and saves kept on their device. Added by SCR-001 (`docs/product/SCOPE_CHANGE_001_BYOR.md`).

## Initial assumptions

- The MVP is primarily single-player.
- “Online and offline” means that a user can play a previously available/downloaded game while connected or disconnected. It does not imply online multiplayer.
- The web app is the source product. Mobile apps are a later delivery target.
- The initial game(s) will be original or otherwise demonstrably rights-cleared.
- The platform distributes no third-party ROMs, disc images, or BIOS files. BYOR content is supplied by, and remains the responsibility of, the user; it stays on the user's device.
- User accounts and cloud synchronization are not required for the initial MVP.

## MVP success outcomes

The MVP is successful when a user can:

- Open the application in a supported modern browser.
- Browse the available game catalogue.
- Open a game's information page and see controls and offline availability.
- Launch and play an installed game.
- Use supported keyboard and touch controls.
- Pause, resume, and exit cleanly.
- Save and restore local progress if applicable.
- Relaunch the app without internet and play a game previously made available offline.
- Understand when a game is not installed or requires a connection.

## Non-goals for the MVP

- Online multiplayer or matchmaking
- Public leaderboards
- User-generated content or a game marketplace
- Account registration and authentication
- Cross-device cloud save synchronization
- Payments, subscriptions, advertisements, or in-app purchases
- Social feeds, chat, or messaging
- AI-generated game content at runtime
- Native-only features that are not needed for the web MVP
- Shipping or committing ROMs, disc images, or BIOS files
- Commercial game titles, box art, logos, or third-party title metadata in the catalogue
- PS2 emulation in the MVP (experimental, post-MVP)
- BYOR emulation on mobile browsers in the MVP
- Emulation of other consoles (`nes`, `snes`, `gba`, `arcade`)

These may be reconsidered through a documented scope change and ADR.

## Product principles

- Simple before extensive: a polished small collection is better than many unreliable games.
- Consistent player experience: common controls, pause behavior, navigation, and settings.
- Offline clarity: show what is ready offline and what is not.
- Respectful nostalgia: retro-inspired presentation without unauthorized copying of protected assets or brands.
- Accessibility: readable text, understandable controls, reduced-motion consideration, and alternatives to color-only information.
- Privacy by default: local-only data in the MVP; do not add tracking without an explicit product decision.
- User files stay on the device: user-supplied disc images, BIOS files, and saves are never uploaded or sent over the network.

## Measures to consider

- Successful game-launch rate
- Crash/error rate during game sessions
- Time to first playable frame
- Offline launch success rate
- Save/restore success rate
- Keyboard and touch control task completion
- Application and per-game download sizes
- Accessibility issues found and resolved

Targets should be agreed during Phase 00; do not invent performance thresholds without a baseline and test devices.
