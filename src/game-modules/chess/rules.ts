// Chess rules (traditional, public domain). Pure and deterministic: no DOM, so it can run in a worker and be tested.
// Squares are 0..63 with a1 = 0, h1 = 7, a8 = 56 (rank-major).

export type Color = 'w' | 'b';
export type PieceType = 'P' | 'N' | 'B' | 'R' | 'Q' | 'K';
export interface Piece {
  c: Color;
  t: PieceType;
}
export interface Move {
  from: number;
  to: number;
  promotion?: PieceType;
}
export interface ChessState {
  board: (Piece | null)[];
  turn: Color;
  castling: string; // subset of "KQkq"
  ep: number | null; // en-passant target square
  halfmove: number;
  fullmove: number;
  seen: Record<string, number>; // position key → count (threefold repetition)
}

export type GameResult =
  | { kind: 'ongoing' }
  | { kind: 'checkmate'; winner: Color }
  | { kind: 'stalemate' }
  | { kind: 'draw'; reason: 'fifty-move' | 'repetition' | 'material' };

export const fileOf = (sq: number) => sq & 7;
export const rankOf = (sq: number) => sq >> 3;
const at = (f: number, r: number) => (f >= 0 && f < 8 && r >= 0 && r < 8 ? r * 8 + f : -1);
export const other = (c: Color): Color => (c === 'w' ? 'b' : 'w');
export const squareName = (sq: number) => 'abcdefgh'[fileOf(sq)]! + String(rankOf(sq) + 1);
export function parseSquare(name: string): number {
  const f = 'abcdefgh'.indexOf(name[0] ?? '');
  const r = Number(name[1]) - 1;
  return at(f, r);
}

const KNIGHT = [[1, 2], [2, 1], [2, -1], [1, -2], [-1, -2], [-2, -1], [-2, 1], [-1, 2]] as const;
const KING = [[1, 0], [1, 1], [0, 1], [-1, 1], [-1, 0], [-1, -1], [0, -1], [1, -1]] as const;
const DIAG = [[1, 1], [1, -1], [-1, 1], [-1, -1]] as const;
const ORTHO = [[1, 0], [-1, 0], [0, 1], [0, -1]] as const;

export function fromFen(fen: string): ChessState {
  const [placement = '', turn = 'w', castling = '-', ep = '-', half = '0', full = '1'] = fen.trim().split(/\s+/);
  const board: (Piece | null)[] = Array(64).fill(null);
  const rows = placement.split('/');
  if (rows.length !== 8) throw new Error('bad FEN');
  rows.forEach((row, i) => {
    const r = 7 - i;
    let f = 0;
    for (const ch of row) {
      if (/\d/.test(ch)) f += Number(ch);
      else {
        const t = ch.toUpperCase() as PieceType;
        if (!'PNBRQK'.includes(t) || f > 7) throw new Error('bad FEN');
        board[r * 8 + f] = { c: ch === t ? 'w' : 'b', t };
        f++;
      }
    }
  });
  const s: ChessState = {
    board,
    turn: turn === 'b' ? 'b' : 'w',
    castling: castling === '-' ? '' : castling.replace(/[^KQkq]/g, ''),
    ep: ep === '-' ? null : parseSquare(ep),
    halfmove: Number(half) || 0,
    fullmove: Number(full) || 1,
    seen: {},
  };
  s.seen[positionKey(s)] = 1;
  return s;
}

export const START_FEN = 'rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR w KQkq - 0 1';
export const newGame = () => fromFen(START_FEN);

export function positionKey(s: ChessState): string {
  let k = '';
  for (const p of s.board) k += p ? (p.c === 'w' ? p.t : p.t.toLowerCase()) : '.';
  return `${k} ${s.turn} ${s.castling || '-'} ${s.ep ?? '-'}`;
}

export function isAttacked(board: (Piece | null)[], sq: number, by: Color): boolean {
  const f = fileOf(sq);
  const r = rankOf(sq);
  const pr = by === 'w' ? r - 1 : r + 1;
  for (const df of [-1, 1]) {
    const p = board[at(f + df, pr)];
    if (p && p.c === by && p.t === 'P') return true;
  }
  for (const [df, dr] of KNIGHT) {
    const p = board[at(f + df, r + dr)];
    if (p && p.c === by && p.t === 'N') return true;
  }
  for (const [df, dr] of KING) {
    const p = board[at(f + df, r + dr)];
    if (p && p.c === by && p.t === 'K') return true;
  }
  const ray = (dirs: readonly (readonly [number, number])[], kinds: PieceType[]) => {
    for (const [df, dr] of dirs) {
      for (let i = 1; i < 8; i++) {
        const t = at(f + df * i, r + dr * i);
        if (t < 0) break;
        const p = board[t];
        if (p) {
          if (p.c === by && kinds.includes(p.t)) return true;
          break;
        }
      }
    }
    return false;
  };
  return ray(DIAG, ['B', 'Q']) || ray(ORTHO, ['R', 'Q']);
}

export function kingSquare(board: (Piece | null)[], c: Color): number {
  return board.findIndex((p) => p?.c === c && p.t === 'K');
}

export function inCheck(s: ChessState, c: Color = s.turn): boolean {
  const k = kingSquare(s.board, c);
  return k >= 0 && isAttacked(s.board, k, other(c));
}

function pseudoMoves(s: ChessState): Move[] {
  const moves: Move[] = [];
  const { board, turn } = s;
  const push = (from: number, to: number) => {
    const p = board[from]!;
    if (p.t === 'P' && (rankOf(to) === 7 || rankOf(to) === 0)) for (const promotion of ['Q', 'R', 'B', 'N'] as const) moves.push({ from, to, promotion });
    else moves.push({ from, to });
  };
  for (let sq = 0; sq < 64; sq++) {
    const p = board[sq];
    if (!p || p.c !== turn) continue;
    const f = fileOf(sq);
    const r = rankOf(sq);
    if (p.t === 'P') {
      const dir = turn === 'w' ? 1 : -1;
      const one = at(f, r + dir);
      if (one >= 0 && !board[one]) {
        push(sq, one);
        const startRank = turn === 'w' ? 1 : 6;
        const two = at(f, r + 2 * dir);
        if (r === startRank && !board[two]) moves.push({ from: sq, to: two });
      }
      for (const df of [-1, 1]) {
        const t = at(f + df, r + dir);
        if (t < 0) continue;
        if ((board[t] && board[t]!.c !== turn) || t === s.ep) push(sq, t);
      }
    } else if (p.t === 'N' || p.t === 'K') {
      for (const [df, dr] of p.t === 'N' ? KNIGHT : KING) {
        const t = at(f + df, r + dr);
        if (t >= 0 && board[t]?.c !== turn) moves.push({ from: sq, to: t });
      }
      if (p.t === 'K') {
        const home = turn === 'w' ? 4 : 60;
        const enemy = other(turn);
        if (sq === home && !isAttacked(board, home, enemy)) {
          const [k, q] = turn === 'w' ? ['K', 'Q'] : ['k', 'q'];
          if (s.castling.includes(k!) && !board[home + 1] && !board[home + 2] && board[home + 3]?.t === 'R' && board[home + 3]?.c === turn &&
              !isAttacked(board, home + 1, enemy) && !isAttacked(board, home + 2, enemy)) moves.push({ from: home, to: home + 2 });
          if (s.castling.includes(q!) && !board[home - 1] && !board[home - 2] && !board[home - 3] && board[home - 4]?.t === 'R' && board[home - 4]?.c === turn &&
              !isAttacked(board, home - 1, enemy) && !isAttacked(board, home - 2, enemy)) moves.push({ from: home, to: home - 2 });
        }
      }
    } else {
      const dirs = p.t === 'B' ? DIAG : p.t === 'R' ? ORTHO : [...DIAG, ...ORTHO];
      for (const [df, dr] of dirs) {
        for (let i = 1; i < 8; i++) {
          const t = at(f + df * i, r + dr * i);
          if (t < 0) break;
          if (board[t]) {
            if (board[t]!.c !== turn) moves.push({ from: sq, to: t });
            break;
          }
          moves.push({ from: sq, to: t });
        }
      }
    }
  }
  return moves;
}

/**
 * Applies a move without legality checks (callers pass moves from legalMoves). Returns a new state.
 * `track` records the position for threefold repetition; search and legality checks skip it for speed.
 */
export function applyMove(s: ChessState, m: Move, track = true): ChessState {
  const board = s.board.slice();
  const piece = board[m.from]!;
  const captured = board[m.to];
  let ep: number | null = null;
  let castling = s.castling;
  board[m.to] = m.promotion ? { c: piece.c, t: m.promotion } : piece;
  board[m.from] = null;
  if (piece.t === 'P') {
    if (m.to === s.ep) board[m.to + (piece.c === 'w' ? -8 : 8)] = null; // en passant capture
    if (Math.abs(m.to - m.from) === 16) ep = (m.from + m.to) / 2;
  }
  if (piece.t === 'K') {
    castling = castling.replace(piece.c === 'w' ? /[KQ]/g : /[kq]/g, '');
    if (m.to - m.from === 2) {
      board[m.from + 1] = board[m.from + 3]!;
      board[m.from + 3] = null;
    } else if (m.from - m.to === 2) {
      board[m.from - 1] = board[m.from - 4]!;
      board[m.from - 4] = null;
    }
  }
  const corner: Record<number, string> = { 0: 'Q', 7: 'K', 56: 'q', 63: 'k' };
  for (const sq of [m.from, m.to]) if (corner[sq]) castling = castling.replace(corner[sq]!, '');
  const next: ChessState = {
    board,
    turn: other(s.turn),
    castling,
    ep,
    halfmove: piece.t === 'P' || captured ? 0 : s.halfmove + 1,
    fullmove: s.turn === 'b' ? s.fullmove + 1 : s.fullmove,
    seen: track ? { ...s.seen } : s.seen,
  };
  if (track) {
    const key = positionKey(next);
    next.seen[key] = (next.seen[key] ?? 0) + 1;
  }
  return next;
}

export function legalMoves(s: ChessState): Move[] {
  return pseudoMoves(s).filter((m) => {
    const n = applyMove(s, m, false);
    return !inCheck(n, s.turn);
  });
}

function insufficientMaterial(board: (Piece | null)[]): boolean {
  const pieces = board.filter((p): p is Piece => p !== null && p.t !== 'K');
  if (pieces.length === 0) return true;
  if (pieces.length === 1 && (pieces[0]!.t === 'N' || pieces[0]!.t === 'B')) return true;
  if (pieces.every((p) => p.t === 'B')) {
    const colors = new Set(board.map((p, sq) => (p?.t === 'B' ? (fileOf(sq) + rankOf(sq)) % 2 : -1)).filter((x) => x >= 0));
    return colors.size === 1;
  }
  return false;
}

export function result(s: ChessState): GameResult {
  if (legalMoves(s).length === 0) return inCheck(s) ? { kind: 'checkmate', winner: other(s.turn) } : { kind: 'stalemate' };
  if (s.halfmove >= 100) return { kind: 'draw', reason: 'fifty-move' };
  if ((s.seen[positionKey(s)] ?? 0) >= 3) return { kind: 'draw', reason: 'repetition' };
  if (insufficientMaterial(s.board)) return { kind: 'draw', reason: 'material' };
  return { kind: 'ongoing' };
}

/** Standard algebraic notation for a legal move in state s. */
export function toSan(s: ChessState, m: Move): string {
  const p = s.board[m.from]!;
  let san: string;
  if (p.t === 'K' && Math.abs(m.to - m.from) === 2) san = m.to > m.from ? 'O-O' : 'O-O-O';
  else {
    const capture = Boolean(s.board[m.to]) || (p.t === 'P' && m.to === s.ep);
    if (p.t === 'P') san = (capture ? 'abcdefgh'[fileOf(m.from)] + 'x' : '') + squareName(m.to) + (m.promotion ? '=' + m.promotion : '');
    else {
      const rivals = legalMoves(s).filter((o) => o.to === m.to && o.from !== m.from && s.board[o.from]?.t === p.t);
      let dis = '';
      if (rivals.length) {
        const sameFile = rivals.some((o) => fileOf(o.from) === fileOf(m.from));
        const sameRank = rivals.some((o) => rankOf(o.from) === rankOf(m.from));
        dis = !sameFile ? 'abcdefgh'[fileOf(m.from)]! : !sameRank ? String(rankOf(m.from) + 1) : squareName(m.from);
      }
      san = p.t + dis + (capture ? 'x' : '') + squareName(m.to);
    }
  }
  const after = applyMove(s, m);
  if (inCheck(after)) san += legalMoves(after).length === 0 ? '#' : '+';
  return san;
}

/** Counts leaf nodes to a given depth (standard move-generator correctness check). */
export function perft(s: ChessState, depth: number): number {
  if (depth === 0) return 1;
  let n = 0;
  for (const m of legalMoves(s)) n += depth === 1 ? 1 : perft(applyMove(s, m, false), depth - 1);
  return n;
}
