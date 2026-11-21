# Game Specification — chess Chess

- Game ID: chess
- Display title: Chess
- Status: IN_DEVELOPMENT (draft v0.1, DEC-003)
- Spec owner: Project owner
- Related phase/task: Phase 04 (`tasks/phase-04-game-library.md`)

## 1. Game concept

Standard chess (FIDE movement rules): castling, en passant, promotion with a choice of piece, check, checkmate, stalemate, the fifty-move rule, threefold repetition, and insufficient material.

Modes: against the computer (Easy, Medium, Hard) or two players on the same device. Undo; the game in progress is saved automatically and resumed on return.

## 2. Player experience

- Genre: board (traditional, public-domain rules)
- Single-player / multiplayer: single-player vs. computer, or local two-player (no network play)
- Pause behavior: pause button or automatic on hidden tab / focus loss; the board is disabled while paused and any computer search is abandoned and re-requested on resume
- Restart behavior: New game button

## 3. Controls

| Input type | Mapping | Required? |
|---|---|---|
| Mouse / touch | Click/tap a piece then its destination | Yes |
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
- Restore behavior: the saved position is validated structurally (`validateChessState`); anything invalid is discarded and a new game starts

## 6. Offline requirements

- Offline supported: yes — part of the app bundle (rules, AI worker); no network requests

## 7. Technical implementation

- Renderer: DOM board (`src/game-modules/board/BoardView.ts`) shared by all board games
- Module: `src/game-modules/chess/module.ts` (extends `BoardGameModule`); rules `rules.ts`; computer player `ai.ts`, run in the shared worker `src/game-modules/board/ai-worker.ts`
- Computer player: Alpha-beta search with capture ordering and quiescence; depth 1/2/4 for Easy/Medium/Hard with a node cap. Measured on an Apple M4: Hard 0.25–1.6 s per move in a middlegame (runs in a Web Worker).
- Dependencies: none
- Tests: Move generation verified against the published perft node counts for five standard test positions; SAN notation, special moves and game endings are unit-tested; the AI finds a mate in one. (`tests/unit/board-games.test.ts`); browser tests in `tests/e2e/board-games.spec.ts`

## 8. Rights and provenance

- Original developer/creator: this project (implementation written by the AI coding agent at the owner's request, 2026-11-22); rules are traditional and in the public domain
- Code source and license: original; GPL-3.0-or-later (repository licence). No third-party engine, opening book, or evaluation tables were copied
- Art/sprite/font sources: Unicode chess symbols (U+265A–U+265F) shown with text presentation in the system font; no image assets
- Music/sound: none
- Name/trademark notes: "Chess" is a generic name of a traditional game
- Permission for offline distribution / mobile packaging: yes (original implementation)
- Rights reviewer:
- Rights decision: PENDING

## 9. Human evaluation

Reviewer:
Date:
Decision: PENDING
Comments:
