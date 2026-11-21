/// <reference lib="webworker" />
// One worker for all board-game opponents, so searches never block the page. Inputs are validated shapes;
// the worker only computes a move and has no access to storage or the network beyond the app's CSP.
import { chooseMove as chessMove } from '../chess/ai';
import { chooseMove as checkersMove } from '../checkers/ai';
import { chooseMove as reversiMove } from '../reversi/ai';
import type { ChessState } from '../chess/rules';
import type { CheckersState } from '../checkers/rules';
import type { ReversiState } from '../reversi/rules';

export type AiRequest =
  | { id: number; game: 'chess'; level: 1 | 2 | 3; state: ChessState }
  | { id: number; game: 'checkers'; level: 1 | 2 | 3; state: CheckersState }
  | { id: number; game: 'reversi'; level: 1 | 2 | 3; state: ReversiState };

self.onmessage = (e: MessageEvent<AiRequest>) => {
  const req = e.data;
  const level = req?.level === 1 || req?.level === 2 || req?.level === 3 ? req.level : 1;
  const valid = req && Number.isInteger(req.id) && req.state && Array.isArray((req.state as { board?: unknown }).board) && (req.state as { board: unknown[] }).board.length === 64;
  if (!valid) {
    self.postMessage({ id: req?.id ?? -1, move: null, error: 'bad request' });
    return;
  }
  try {
    const move = req.game === 'chess' ? chessMove(req.state, level) : req.game === 'checkers' ? checkersMove(req.state, level) : reversiMove(req.state, level);
    self.postMessage({ id: req.id, move });
  } catch (err) {
    self.postMessage({ id: req.id, move: null, error: err instanceof Error ? err.message : String(err) });
  }
};
