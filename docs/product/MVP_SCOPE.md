# MVP Scope

## Purpose

Define the smallest complete experience that proves the product and architecture before the game library grows.

## MVP in scope

### Platform shell
- Responsive landing/catalogue page
- Game card and game detail view
- Game launch/player view
- Navigation back to catalogue
- Basic connection and offline-readiness indicators

### Game experience
- One first game selected by the owner after a short options review
- Shared game lifecycle integration
- Declared keyboard and touch controls as appropriate
- Pause/resume and clean exit
- Local save/restore only if the selected game has meaningful persistent state

### PS1 BYOR player (added by SCR-001)

Scope change record: `docs/product/SCOPE_CHANGE_001_BYOR.md`. Delivered after the first native vertical slice; the exact roadmap phase is set in the Phase 01 plan.

- One generic PS1 player entry in the catalogue; the platform ships no game content for it.
- A local disc list of the user's own disc images, named by the user. No shipped title metadata.
- User-supplied disc images in formats approved in Phase 01 (candidates: `.chd`, `.cue`/`.bin`, `.m3u`).
- User-supplied BIOS, or HLE/no-BIOS mode where the selected core supports it. BIOS files are never shipped or committed.
- Virtual memory cards stored locally per disc.
- Browser tiers:
  - **Tier 1 — desktop Chromium:** full BYOR with persisted file handles.
  - **Tier 2 — desktop Safari and Firefox:** BYOR through an OPFS copy or a session-only file (mechanism selected in Phase 01).
  - **Mobile browsers:** native games only in the MVP; the PS1 player shows a clear "not supported yet" message.
- `NEEDS_PERMISSION` state: a linked disc whose file permission must be re-granted with one user action after a browser restart. It is shown distinctly and is playable offline after the re-grant.
- User disc images, BIOS files, and saves never leave the device.
- Provisional PS1 performance target, to be baselined in the Phase 01 spike before it becomes a requirement: ≥ 59 fps NTSC (≥ 49 fps PAL) sustained over a 5-minute session, ≤ 1% dropped frames, no audible audio underruns, on the owner's MacBook M4 in current stable Chrome, using an openly licensed homebrew test image. Tier 2 browsers are measured and reported, not gated.

### Offline
- App shell can load offline after initial successful installation/cache setup
- First game can be made available offline
- Offline launch tested after browser/app restart
- Clear UI for installed, downloading, unavailable, and error states

### Quality
- Basic automated unit/integration/end-to-end checks
- Responsive testing on agreed viewport sizes/devices
- Keyboard navigation and accessibility review
- Rights-cleared assets and recorded provenance

## Explicitly out of scope

- Multiple user profiles
- Cloud sync
- Multiplayer
- Leaderboards
- Authentication
- Payments or ads
- Public upload of games
- Native Android/iOS app stores
- PS2 emulation (experimental, post-MVP; must never block the MVP; Phase 01 covers desk research only)
- BYOR emulation on mobile browsers
- Other emulated platforms (`nes`, `snes`, `gba`, `arcade`)
- Shipping or committing ROMs, disc images, or BIOS files
- Commercial game titles, box art, logos, or third-party title-metadata databases in the catalogue
- Loading ROMs or disc images from a URL

## MVP exit criteria

The MVP cannot be declared complete until all Must requirements in the PRD have evidence, all critical/high severity defects are resolved or explicitly accepted by the owner, licensing/provenance is documented, offline behavior is demonstrated, and the owner approves release readiness.

For the PS1 BYOR player, evidence must also include:

- a Tier 1 and a Tier 2 launch using an openly licensed homebrew disc image;
- offline relaunch after a browser restart, including the `NEEDS_PERMISSION` re-grant on Tier 1;
- memory-card persistence across sessions;
- the "not supported yet" message on a mobile browser;
- a performance measurement against the PS1 target (or an owner-accepted revised target);
- rights records for every shipped emulator core.

## Scope change process

A proposed scope addition must include user value, complexity, risk, schedule impact, effect on offline/mobile behavior, and whether it should be deferred to a later phase. The owner decides.
