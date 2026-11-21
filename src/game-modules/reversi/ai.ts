import { applyMove, counts, legalMoves, result, type Disc, type ReversiState } from './rules';

export type Level = 1 | 2 | 3;
const DEPTH: Record<Level, number> = { 1: 1, 2: 3, 3: 6 };

// Positional weights written for this project: corners are strong; squares next to an EMPTY corner are risky
// (they can hand the corner to the opponent) but are fine once that corner is taken; edges help.
function weight(sq: number, board: ReversiState['board']): number {
  const r = sq >> 3;
  const c = sq & 7;
  const edgeR = r === 0 || r === 7;
  const edgeC = c === 0 || c === 7;
  if (edgeR && edgeC) return 100;
  const nearCorner = (r <= 1 || r >= 6) && (c <= 1 || c >= 6);
  if (nearCorner) {
    const corner = (r <= 1 ? 0 : 7) * 8 + (c <= 1 ? 0 : 7);
    if (board[corner] !== null) return edgeR || edgeC ? 10 : 5;
    return edgeR || edgeC ? -20 : -50;
  }
  if (edgeR || edgeC) return 10;
  return 1;
}

export function evaluate(s: ReversiState, me: Disc): number {
  const res = result(s);
  if (res.kind !== 'ongoing') {
    const { black, white } = counts(s.board);
    const diff = me === 'black' ? black - white : white - black;
    return diff > 0 ? 10_000 + diff : diff < 0 ? -10_000 + diff : 0;
  }
  let score = 0;
  s.board.forEach((d, sq) => {
    if (d) score += (d === me ? 1 : -1) * weight(sq, s.board);
  });
  const mobility = legalMoves(s).length * (s.turn === me ? 1 : -1);
  return score + mobility * 5;
}

function search(s: ReversiState, depth: number, alpha: number, beta: number): number {
  if (depth === 0 || result(s).kind !== 'ongoing') return evaluate(s, s.turn);
  const moves = legalMoves(s);
  if (moves.length === 0) return -search(applyMove(s, null), depth - 1, -beta, -alpha);
  for (const m of moves) {
    const v = -search(applyMove(s, m), depth - 1, -beta, -alpha);
    if (v >= beta) return beta;
    if (v > alpha) alpha = v;
  }
  return alpha;
}

/** Returns the square to play, or null to pass. */
export function chooseMove(s: ReversiState, level: Level, random: () => number = Math.random): number | null {
  const moves = legalMoves(s);
  if (moves.length === 0) return null;
  let best = moves[0]!;
  let bestScore = -Infinity;
  for (const m of moves) {
    const raw = -search(applyMove(s, m), DEPTH[level] - 1, -Infinity, level === 1 ? Infinity : -bestScore);
    const score = level === 1 ? raw + random() * 30 : raw;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
