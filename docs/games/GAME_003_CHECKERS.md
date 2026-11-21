# Game Specification — checkers Checkers

- Game ID: checkers
- Display title: Checkers
- Status: IN_DEVELOPMENT (draft v0.1, DEC-003)
- Spec owner: Project owner
- Related phase/task: Phase 04 (`tasks/phase-04-game-library.md`)

## 1. Game concept

English draughts on an 8×8 board: diagonal moves on dark squares, mandatory captures, multi-jumps completed in one move, crowning on the far row (which ends the move), kings move both ways; a side that cannot move loses; draw after 40 moves each without a capture or crowning.

Modes: against the computer (Easy, Medium, Hard) or two players on the same device. Undo; the game in progress is saved automatically and resumed on return.

## 2. Player experience

- Genre: board (traditional, public-domain rules)
- Single-player / multiplayer: single-player vs. computer, or local two-player (no network play)
- Pause behavior: pause button or automatic on hidden tab / focus loss; the board is disabled while paused and any computer search is abandoned and re-requested on resume
- Restart behavior: New game button

## 3. Controls

| Input type | Mapping | Required? |
|---|---|---|
| Mouse / touch | Click/tap a piece then its landing square (multi-jumps in one go) | Yes |
| Keyboard | Arrow keys move the focus square (Home/End along a row); Enter/Space selects; toolbar buttons are reachable with Tab | Yes |
| Gamepad | Not supported | No |

The board is an ARIA grid of real buttons with one tab stop; every square has a spoken label (for example "e4, white pawn, can move here"), and turn/result changes are announced through a status region.

## 4. Platform and viewport

- Orientation: any; the board scales to the viewport (side panel moves below on narrow screens)
- Audio: none
- Reduced motion: no animations

## 5. Save data

- Save supported: yes — mode, level, current position, and the last 400 moves of notation
- Schema version: 1
- Save trigger: after every move and on pause/exit
- Restore behavior: the saved position is validated structurally (`validateCheckersState`); anything invalid is discarded and a new game starts

## 6. Offline requirements

- Offline supported: yes — part of the app bundle (rules, AI worker); no network requests

## 7. Technical implementation

- Renderer: DOM board (`src/game-modules/board/BoardView.ts`) shared by all board games
- Module: `src/game-modules/checkers/module.ts` (extends `BoardGameModule`); rules `rules.ts`; computer player `ai.ts`, run in the shared worker `src/game-modules/board/ai-worker.ts`
- Computer player: Alpha-beta search, capture-first ordering; depth 2/4/8 for Easy/Medium/Hard with a node cap. Measured Hard ≈ 20 ms per move on an Apple M4.
- Dependencies: none
- Tests: Opening move count, forced capture, multi-jump, crowning, king movement, and win detection are unit-tested. (`tests/unit/board-games.test.ts`); browser tests in `tests/e2e/board-games.spec.ts`

## 8. Rights and provenance

- Original developer/creator: this project (implementation written by the AI coding agent at the owner's request, 2026-11-22); rules are traditional and in the public domain
- Code source and license: original; GPL-3.0-or-later (repository licence). No third-party engine, opening book, or evaluation tables were copied
- Art/sprite/font sources: Unicode/CSS shapes in the system font; no image assets
- Music/sound: none
- Name/trademark notes: "Checkers"/"draughts" are generic names of a traditional game
- Permission for offline distribution / mobile packaging: yes (original implementation)
- Rights reviewer:
- Rights decision: PENDING

## 9. Human evaluation

Reviewer:
Date:
Decision: PENDING
Comments:
