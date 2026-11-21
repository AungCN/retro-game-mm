import { applyMove, legalMoves, rowOf, type CheckersMove, type CheckersState, type Side } from './rules';

export type Level = 1 | 2 | 3;
const DEPTH: Record<Level, number> = { 1: 2, 2: 4, 3: 8 };
const WIN = 100_000;

export function evaluate(s: CheckersState, me: Side): number {
  let score = 0;
  s.board.forEach((m, sq) => {
    if (!m) return;
    const advance = m.side === 'dark' ? 7 - rowOf(sq) : rowOf(sq);
    const v = m.king ? 160 : 100 + advance * 3;
    score += m.side === me ? v : -v;
  });
  return score;
}

function search(s: CheckersState, depth: number, alpha: number, beta: number, ply: number, nodes: { n: number }): number {
  nodes.n++;
  const moves = legalMoves(s);
  if (moves.length === 0) return -WIN + ply;
  if (depth === 0 || nodes.n > 300_000) return evaluate(s, s.turn);
  moves.sort((a, b) => b.captured.length - a.captured.length);
  for (const m of moves) {
    const v = -search(applyMove(s, m), depth - 1, -beta, -alpha, ply + 1, nodes);
    if (v >= beta) return beta;
    if (v > alpha) alpha = v;
  }
  return alpha;
}

export function chooseMove(s: CheckersState, level: Level, random: () => number = Math.random): CheckersMove | null {
  const moves = legalMoves(s);
  if (moves.length === 0) return null;
  const nodes = { n: 0 };
  let best = moves[0]!;
  let bestScore = -Infinity;
  for (const m of moves) {
    const raw = -search(applyMove(s, m), DEPTH[level] - 1, -Infinity, level === 1 ? Infinity : -bestScore, 1, nodes);
    const score = level === 1 ? raw + random() * 40 : raw;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}
