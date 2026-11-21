# Game Specification — comet-courier Comet Courier

- Game ID: comet-courier
- Display title: Comet Courier
- Status: IN_DEVELOPMENT (first draft, DEC-003)
- Spec owner: Project owner
- Target release: MVP
- Related phase/task: Phase 03 (`tasks/phase-03-first-game.md`)

## 1. Game concept

An original lane game. The player steers a courier ship across five vertical lanes at the bottom of a star field. Stars and comets fall from the top. Catching a star scores 10 points; touching a comet costs one of three lives, followed by one second of invulnerability. One point is scored per second survived. Speed and spawn rate rise over time, up to a cap. A session lasts about one to three minutes; the best score is saved.

## 2. Player experience

- Target audience: casual players; short sessions
- Genre: arcade (lane-dodging / collecting)
- Difficulty progression: field speed 0.35 → 1.1 field-heights per second over time; spawn interval shrinks
- Single-player / multiplayer: single-player
- Pause behavior: pause button, Enter/P, or gamepad Start; automatic pause when the tab is hidden or the window loses focus
- Restart behavior: Enter/Space or gamepad A after game over

## 3. Controls

| Input type | Action | Mapping | Required? |
|---|---|---|---|
| Keyboard | Move left / right | Arrow keys, A / D | Yes |
| Keyboard | Pause / resume | Enter, P | Yes |
| Keyboard | Restart after game over | Enter, Space | Yes |
| Touch | Move left / right, pause | On-screen ◀ ❚❚ ▶ buttons (shown on coarse-pointer devices) | Yes (mobile) |
| Gamepad | Move, pause, restart | D-pad or left stick; Start; A (standard mapping) | No |

## 4. Platform and viewport

- Orientation: any
- Minimum supported viewport: 320 × 480 CSS px
- Scaling behavior: canvas fills the player area at device pixel ratio (capped at 2); lanes scale with width
- Fullscreen behavior: not implemented in the draft
- Audio requirements: synthesized effects through the host's AudioContext; muted by preference
- Reduced-motion/accessibility considerations: background star motion stops when `prefers-reduced-motion` is set; state is shown as text (score, lives, best); objects differ by shape as well as colour (star vs. circle)

## 5. Save data

- Save supported: yes
- Data saved: best score (`{ highScore: number }`)
- Schema version: 1
- Save trigger: game over
- Restore behavior: on load; invalid or missing data falls back to 0
- Migration/reset strategy: unknown versions are ignored (safe reset)

## 6. Offline requirements

- Offline supported: yes
- Required asset list: none beyond the app bundle (no images or audio files)
- Approximate package size: part of the app shell (~90 KB gzip for the whole app)
- Network requests during play: none
- Offline verification steps: e2e test "works offline after the first visit"

## 7. Technical implementation

- Renderer/engine: Canvas 2D, project-owned (no engine dependency; ADR-0001 native-runtime decision deferred to Phase 03 review)
- Module entry point: `src/game-modules/comet-courier/module.ts`
- Game manifest path: `src/game-modules/comet-courier/manifest.json`
- Dependencies: none
- Asset directory: none
- Test directory: `tests/unit/game-and-lifecycle.test.ts`, `tests/e2e/app.spec.ts`

## 8. Rights and provenance

- Original developer/creator: this project (first draft written by the AI coding agent at the owner's request, 2026-11-22)
- Code source and license: original; GPL-3.0-or-later (repository licence)
- Art/sprite/font sources and licenses: none — shapes are drawn in code; system font
- Music/sound sources and licenses: none — effects are synthesized oscillator tones
- Name/logo/trademark notes: "Comet Courier" chosen as an original name; a trademark search has not been done
- Required attribution: none
- Permission for offline distribution: yes (original)
- Permission for mobile packaging: yes (original)
- Evidence/reference: source history on branch `draft/v0.1-first-build`
- Rights reviewer:
- Rights decision: PENDING

## 9. Acceptance criteria

- [ ] Game can be launched through the shared host
- [ ] All declared controls work
- [ ] Lifecycle transitions work
- [ ] Game handles resize/orientation as specified
- [ ] Resource cleanup is verified
- [ ] Save/restore verified if supported
- [ ] Offline launch verified if supported
- [ ] Rights record is complete and cleared
- [ ] Game-specific tests pass
- [ ] Human playtest completed

(Checkboxes are left for the owner's evaluation; automated evidence is listed in the Phase 03 AI report.)

## 10. Human evaluation

Reviewer:
Date:
Decision: PENDING
Comments:
