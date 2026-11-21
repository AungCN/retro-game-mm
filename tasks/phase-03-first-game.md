# Phase 03 — First Game and Shared Runtime Vertical Slice

- Status: AWAITING_EVALUATION
- Dependencies: Phase 02 accepted; GAME_001 specification approved

## Objective

Deliver one complete playable game through the shared game host to prove the platform/game boundary before expanding the library.

## Scope
- Complete and approve `docs/games/GAME_001_*.md`.
- Implement manifest and game registration.
- Implement approved shared host lifecycle.
- Implement one original or rights-cleared game.
- Add declared keyboard/touch input.
- Implement pause/resume/exit and cleanup.
- Implement local save/restore if the game supports meaningful persistence.
- Add game-specific tests and a manual playtest checklist.

## Excluded
- Multiple additional games
- Cloud saves
- Multiplayer
- Game marketplace or remote arbitrary code loading

## Work steps
1. Review approved game spec and rights evidence.
2. Plan runtime/host integration.
3. Implement lifecycle and platform service adapters.
4. Implement game logic and rendering.
5. Add tests for rules, input, lifecycle, resize, save, and cleanup.
6. Perform human playtest and record defects.

## Acceptance criteria
- [ ] Game launches from the catalogue through the shared host.
- [ ] Declared controls work.
- [ ] Pause/resume/exit behavior is correct.
- [ ] Resize/orientation handling follows the game spec.
- [ ] Resources are released after exit.
- [ ] Save/restore works if applicable, including failure behavior.
- [ ] Game-specific tests pass.
- [ ] Rights and asset provenance are cleared.
- [ ] Human playtest is completed and recorded.

## AI report (draft v0.1, DEC-003)
- Summary:
  - Comet Courier is an original Canvas 2D lane game (`docs/games/GAME_001_COMET_COURIER.md`).
  - GameHost enforces lifecycle transitions and auto-pauses on hidden tab or blur.
  - Input: keyboard, gamepad (standard mapping), and touch buttons.
  - Audio is synthesized and owned by the host.
  - The best score is saved with schema version 1 and a safe reset; destroy releases the canvas, loop, listeners and audio.
- Evidence:
  - Unit: game rules, including deterministic RNG, collisions, invulnerability, frame clamp and game over; lifecycle state machine.
  - e2e: start, input, pause, resume, exit, with the canvas removed afterwards.
  - e2e: playable offline.
- Not done:
  - human playtest;
  - touch on a real device;
  - rights decision (owner);
  - native runtime decision (Phaser vs Canvas — drafted with Canvas 2D, no dependency).

## Human evaluation — owner only
- Reviewer:
- Review date:
- Owner decision: PENDING
- Comments:
- Phase accepted: NO
- Next phase authorized: NO
