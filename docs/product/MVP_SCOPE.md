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

## MVP exit criteria

The MVP cannot be declared complete until all Must requirements in the PRD have evidence, all critical/high severity defects are resolved or explicitly accepted by the owner, licensing/provenance is documented, offline behavior is demonstrated, and the owner approves release readiness.

## Scope change process

A proposed scope addition must include user value, complexity, risk, schedule impact, effect on offline/mobile behavior, and whether it should be deferred to a later phase. The owner decides.
