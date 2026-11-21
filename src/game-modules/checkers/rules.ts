// Checkers / English draughts (traditional, public domain). 8×8, play on dark squares (row + col odd).
// Row 0 is the top of the board. Dark moves first, starts at the bottom (rows 5–7) and moves up.
// Captures are mandatory; a multi-jump must be completed; reaching the far row crowns and ends the move.

export type Side = 'dark' | 'light';
export interface Man {
  side: Side;
  king: boolean;
}
export interface CheckersState {
  board: (Man | null)[]; // 64 squares, index = row * 8 + col
  turn: Side;
  quietPlies: number; // plies since the last capture or crowning (draw after 80)
}
/** A move is the full path of squares; captured lists the jumped squares (empty for a simple step). */
export interface CheckersMove {
  path: number[];
  captured: number[];
}
export type CheckersResult = { kind: 'ongoing' } | { kind: 'win'; winner: Side } | { kind: 'draw' };

export const rowOf = (sq: number) => sq >> 3;
export const colOf = (sq: number) => sq & 7;
const at = (r: number, c: number) => (r >= 0 && r < 8 && c >= 0 && c < 8 ? r * 8 + c : -1);
export const isDark = (sq: number) => (rowOf(sq) + colOf(sq)) % 2 === 1;
export const opponent = (s: Side): Side => (s === 'dark' ? 'light' : 'dark');

export function newGame(): CheckersState {
  const board: (Man | null)[] = Array(64).fill(null);
  for (let sq = 0; sq < 64; sq++) {
    if (!isDark(sq)) continue;
    if (rowOf(sq) <= 2) board[sq] = { side: 'light', king: false };
    if (rowOf(sq) >= 5) board[sq] = { side: 'dark', king: false };
  }
  return { board, turn: 'dark', quietPlies: 0 };
}

function directions(m: Man): [number, number][] {
  if (m.king) return [[-1, -1], [-1, 1], [1, -1], [1, 1]];
  return m.side === 'dark' ? [[-1, -1], [-1, 1]] : [[1, -1], [1, 1]];
}

const crownRow = (side: Side) => (side === 'dark' ? 0 : 7);

function jumpsFrom(board: (Man | null)[], sq: number, man: Man, path: number[], captured: number[], out: CheckersMove[]) {
  let extended = false;
  for (const [dr, dc] of directions(man)) {
    const over = at(rowOf(sq) + dr, colOf(sq) + dc);
    const land = at(rowOf(sq) + 2 * dr, colOf(sq) + 2 * dc);
    if (over < 0 || land < 0) continue;
    const victim = board[over];
    if (!victim || victim.side === man.side || board[land] || captured.includes(over)) continue;
    extended = true;
    const crowned = !man.king && rowOf(land) === crownRow(man.side);
    if (crowned) out.push({ path: [...path, land], captured: [...captured, over] }); // crowning ends the move
    else {
      const b = board.slice();
      b[sq] = null;
      b[land] = man;
      jumpsFrom(b, land, man, [...path, land], [...captured, over], out);
    }
  }
  if (!extended && captured.length) out.push({ path, captured });
}

export function legalMoves(s: CheckersState): CheckersMove[] {
  const jumps: CheckersMove[] = [];
  const steps: CheckersMove[] = [];
  for (let sq = 0; sq < 64; sq++) {
    const man = s.board[sq];
    if (!man || man.side !== s.turn) continue;
    jumpsFrom(s.board, sq, man, [sq], [], jumps);
    for (const [dr, dc] of directions(man)) {
      const t = at(rowOf(sq) + dr, colOf(sq) + dc);
      if (t >= 0 && !s.board[t]) steps.push({ path: [sq, t], captured: [] });
    }
  }
  return jumps.length ? jumps : steps; // captures are mandatory
}

export function applyMove(s: CheckersState, m: CheckersMove): CheckersState {
  const board = s.board.slice();
  const from = m.path[0]!;
  const to = m.path[m.path.length - 1]!;
  const man = board[from]!;
  for (const c of m.captured) board[c] = null;
  board[from] = null;
  const crowned = !man.king && rowOf(to) === crownRow(man.side);
  board[to] = crowned ? { side: man.side, king: true } : man;
  return { board, turn: opponent(s.turn), quietPlies: m.captured.length || crowned ? 0 : s.quietPlies + 1 };
}

export function result(s: CheckersState): CheckersResult {
  if (legalMoves(s).length === 0) return { kind: 'win', winner: opponent(s.turn) };
  if (s.quietPlies >= 80) return { kind: 'draw' };
  return { kind: 'ongoing' };
}

export function sameMove(a: CheckersMove, b: CheckersMove) {
  return a.path.length === b.path.length && a.path.every((x, i) => x === b.path[i]);
}
