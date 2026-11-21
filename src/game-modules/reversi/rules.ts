// Reversi (traditional, public domain). 8×8; black moves first; a move must flip at least one opposing disc.
// A player with no legal move passes; the game ends when neither can move.

export type Disc = 'black' | 'white';
export interface ReversiState {
  board: (Disc | null)[]; // index = row * 8 + col
  turn: Disc;
  passes: number; // consecutive passes (2 = game over)
}
export type ReversiResult = { kind: 'ongoing' } | { kind: 'win'; winner: Disc; black: number; white: number } | { kind: 'draw'; black: number; white: number };

const DIRS = [[-1, -1], [-1, 0], [-1, 1], [0, -1], [0, 1], [1, -1], [1, 0], [1, 1]] as const;
export const flip = (d: Disc): Disc => (d === 'black' ? 'white' : 'black');

export function newGame(): ReversiState {
  const board: (Disc | null)[] = Array(64).fill(null);
  board[27] = 'white';
  board[28] = 'black';
  board[35] = 'black';
  board[36] = 'white';
  return { board, turn: 'black', passes: 0 };
}

/** Squares that would flip if `turn` plays at sq (empty when the move is illegal). */
export function flipsFor(board: (Disc | null)[], sq: number, turn: Disc): number[] {
  if (board[sq]) return [];
  const r0 = sq >> 3;
  const c0 = sq & 7;
  const out: number[] = [];
  for (const [dr, dc] of DIRS) {
    const line: number[] = [];
    let r = r0 + dr;
    let c = c0 + dc;
    while (r >= 0 && r < 8 && c >= 0 && c < 8 && board[r * 8 + c] === flip(turn)) {
      line.push(r * 8 + c);
      r += dr;
      c += dc;
    }
    if (line.length && r >= 0 && r < 8 && c >= 0 && c < 8 && board[r * 8 + c] === turn) out.push(...line);
  }
  return out;
}

export function legalMoves(s: ReversiState): number[] {
  const out: number[] = [];
  for (let sq = 0; sq < 64; sq++) if (flipsFor(s.board, sq, s.turn).length) out.push(sq);
  return out;
}

/** Plays at sq, or passes when sq is null (only valid when there is no legal move). */
export function applyMove(s: ReversiState, sq: number | null): ReversiState {
  if (sq === null) return { board: s.board, turn: flip(s.turn), passes: s.passes + 1 };
  const flips = flipsFor(s.board, sq, s.turn);
  if (!flips.length) throw new Error('illegal move');
  const board = s.board.slice();
  board[sq] = s.turn;
  for (const f of flips) board[f] = s.turn;
  return { board, turn: flip(s.turn), passes: 0 };
}

export function counts(board: (Disc | null)[]) {
  let black = 0;
  let white = 0;
  for (const d of board) {
    if (d === 'black') black++;
    else if (d === 'white') white++;
  }
  return { black, white };
}

export function result(s: ReversiState): ReversiResult {
  const over = s.passes >= 2 || s.board.every((d) => d !== null) || (legalMoves(s).length === 0 && legalMoves({ ...s, turn: flip(s.turn) }).length === 0);
  if (!over) return { kind: 'ongoing' };
  const { black, white } = counts(s.board);
  if (black === white) return { kind: 'draw', black, white };
  return { kind: 'win', winner: black > white ? 'black' : 'white', black, white };
}
