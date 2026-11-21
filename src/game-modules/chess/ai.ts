// Chess computer opponent: negamax alpha-beta with capture ordering and a short quiescence search.
// Evaluation is material plus simple positional terms written for this project. Runs in a worker.
import { applyMove, fileOf, inCheck, legalMoves, rankOf, type ChessState, type Color, type Move, type Piece } from './rules';

const VALUE: Record<Piece['t'], number> = { P: 100, N: 320, B: 330, R: 500, Q: 900, K: 0 };
const MATE = 100_000;

function centrality(sq: number): number {
  const df = Math.abs(fileOf(sq) - 3.5);
  const dr = Math.abs(rankOf(sq) - 3.5);
  return 7 - (df + dr); // 0 (corner) .. 6 (centre)
}

function pieceScore(p: Piece, sq: number, endgame: boolean): number {
  const r = p.c === 'w' ? rankOf(sq) : 7 - rankOf(sq); // ranks advanced from own side
  switch (p.t) {
    case 'P': return VALUE.P + r * r * 2 + (fileOf(sq) >= 2 && fileOf(sq) <= 5 ? r * 2 : 0);
    case 'N': return VALUE.N + centrality(sq) * 6 - (r === 0 ? 10 : 0);
    case 'B': return VALUE.B + centrality(sq) * 3 - (r === 0 ? 10 : 0);
    case 'R': return VALUE.R + (r === 6 ? 20 : 0);
    case 'Q': return VALUE.Q + centrality(sq) * 2;
    case 'K': return endgame ? centrality(sq) * 8 : (r === 0 ? 20 : -10 * r) - (fileOf(sq) >= 3 && fileOf(sq) <= 4 && r === 0 ? 10 : 0);
  }
}

/** Static evaluation from the point of view of the side to move. */
export function evaluate(s: ChessState): number {
  let material = 0;
  for (const p of s.board) if (p && p.t !== 'P' && p.t !== 'K') material += VALUE[p.t];
  const endgame = material <= 2600;
  let score = 0;
  s.board.forEach((p, sq) => {
    if (p) score += (p.c === 'w' ? 1 : -1) * pieceScore(p, sq, endgame);
  });
  return s.turn === 'w' ? score : -score;
}

function ordered(s: ChessState, moves: Move[]): Move[] {
  const score = (m: Move) => {
    const victim = s.board[m.to];
    const attacker = s.board[m.from]!;
    return (victim ? 10 * VALUE[victim.t] - VALUE[attacker.t] : 0) + (m.promotion ? VALUE[m.promotion] : 0);
  };
  return moves.map((m) => [score(m), m] as const).sort((a, b) => b[0] - a[0]).map(([, m]) => m);
}

interface Budget {
  nodes: number;
  limit: number;
}

function quiesce(s: ChessState, alpha: number, beta: number, depth: number, b: Budget): number {
  b.nodes++;
  const stand = evaluate(s);
  if (stand >= beta) return beta;
  if (stand > alpha) alpha = stand;
  if (depth === 0 || b.nodes > b.limit) return alpha;
  const captures = ordered(s, legalMoves(s).filter((m) => s.board[m.to] || m.promotion));
  for (const m of captures) {
    const score = -quiesce(applyMove(s, m, false), -beta, -alpha, depth - 1, b);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

function negamax(s: ChessState, depth: number, alpha: number, beta: number, ply: number, b: Budget): number {
  b.nodes++;
  const moves = legalMoves(s);
  if (moves.length === 0) return inCheck(s) ? -MATE + ply : 0;
  if (s.halfmove >= 100) return 0;
  if (depth === 0 || b.nodes > b.limit) return quiesce(s, alpha, beta, 4, b);
  for (const m of ordered(s, moves)) {
    const score = -negamax(applyMove(s, m, false), depth - 1, -beta, -alpha, ply + 1, b);
    if (score >= beta) return beta;
    if (score > alpha) alpha = score;
  }
  return alpha;
}

export type Level = 1 | 2 | 3;
const DEPTH: Record<Level, number> = { 1: 1, 2: 2, 3: 4 };

/** Picks a move for the side to move. `random` makes level 1 less predictable; pass Math.random in the app. */
export function chooseMove(s: ChessState, level: Level, random: () => number = Math.random): Move | null {
  const moves = legalMoves(s);
  if (moves.length === 0) return null;
  const b: Budget = { nodes: 0, limit: level === 3 ? 400_000 : 120_000 };
  let best: Move = moves[0]!;
  let bestScore = -Infinity;
  for (const m of ordered(s, moves)) {
    // Level 1 scores every move exactly (full window) and adds noise; higher levels use normal alpha-beta bounds.
    const raw = -negamax(applyMove(s, m, false), DEPTH[level] - 1, -Infinity, level === 1 ? Infinity : -bestScore, 1, b);
    const score = level === 1 ? raw + random() * 60 : raw;
    if (score > bestScore) {
      bestScore = score;
      best = m;
    }
  }
  return best;
}

export const sideToMove = (s: ChessState): Color => s.turn;
