import { describe, expect, it } from 'vitest';
import * as C from '../../src/game-modules/chess/rules';
import { chooseMove as chessAi } from '../../src/game-modules/chess/ai';
import * as K from '../../src/game-modules/checkers/rules';
import { chooseMove as checkersAi } from '../../src/game-modules/checkers/ai';
import * as R from '../../src/game-modules/reversi/rules';
import { chooseMove as reversiAi } from '../../src/game-modules/reversi/ai';
import { validateChessState } from '../../src/game-modules/chess/module';
import { validateCheckersState } from '../../src/game-modules/checkers/module';
import { validateReversiState } from '../../src/game-modules/reversi/module';

const sq = C.parseSquare;
const move = (s: C.ChessState, from: string, to: string, promotion?: C.PieceType) => {
  const m = C.legalMoves(s).find((x) => x.from === sq(from) && x.to === sq(to) && (x.promotion ?? undefined) === promotion);
  if (!m) throw new Error(`illegal ${from}${to}`);
  return m;
};
const play = (s: C.ChessState, ...uci: string[]) =>
  uci.reduce((st, u) => C.applyMove(st, move(st, u.slice(0, 2), u.slice(2, 4), (u[4]?.toUpperCase() as C.PieceType) || undefined)), s);

describe('chess move generation (perft)', () => {
  it.each([
    ['start', C.START_FEN, [20, 400, 8902]],
    ['kiwipete', 'r3k2r/p1ppqpb1/bn2pnp1/3PN3/1p2P3/2N2Q1p/PPPBBPPP/R3K2R w KQkq - 0 1', [48, 2039]],
    ['position 3', '8/2p5/3p4/KP5r/1R3p1k/8/4P1P1/8 w - - 0 1', [14, 191, 2812]],
    ['position 4', 'r3k2r/Pppp1ppp/1b3nbN/nP6/BBP1P3/q4N2/Pp1P2PP/R2Q1RK1 w kq - 0 1', [6, 264, 9467]],
    ['position 5', 'rnbq1k1r/pp1Pbppp/2p5/8/2B5/8/PPP1NnPP/RNBQK2R w KQ - 1 8', [44, 1486]],
  ] as const)('%s matches published node counts', (_n, fen, counts) => {
    const s = C.fromFen(fen);
    expect(counts.map((_, i) => C.perft(s, i + 1))).toEqual(counts);
  });
});

describe('chess rules', () => {
  it('detects checkmate (fool’s mate) and writes SAN with #', () => {
    const s = play(C.newGame(), 'f2f3', 'e7e5', 'g2g4');
    expect(C.toSan(s, move(s, 'd8', 'h4'))).toBe('Qh4#');
    expect(C.result(C.applyMove(s, move(s, 'd8', 'h4')))).toEqual({ kind: 'checkmate', winner: 'b' });
  });
  it('detects stalemate', () => {
    expect(C.result(C.fromFen('7k/5Q2/6K1/8/8/8/8/8 b - - 0 1'))).toEqual({ kind: 'stalemate' });
  });
  it('detects threefold repetition', () => {
    const s = play(C.newGame(), 'g1f3', 'g8f6', 'f3g1', 'f6g8', 'g1f3', 'g8f6', 'f3g1', 'f6g8');
    expect(C.result(s)).toEqual({ kind: 'draw', reason: 'repetition' });
  });
  it('detects insufficient material and the fifty-move rule', () => {
    expect(C.result(C.fromFen('8/8/4k3/8/8/3NK3/8/8 w - - 0 1'))).toEqual({ kind: 'draw', reason: 'material' });
    expect(C.result(C.fromFen('8/8/4k3/8/8/3RK3/8/8 w - - 100 80'))).toEqual({ kind: 'draw', reason: 'fifty-move' });
  });
  it('handles castling, en passant and promotion in SAN', () => {
    const castle = C.fromFen('r3k2r/8/8/8/8/8/8/R3K2R w KQkq - 0 1');
    expect(C.toSan(castle, move(castle, 'e1', 'g1'))).toBe('O-O');
    expect(C.toSan(castle, move(castle, 'e1', 'c1'))).toBe('O-O-O');
    const ep = C.fromFen('4k3/8/8/3pP3/8/8/8/4K3 w - d6 0 1');
    const after = C.applyMove(ep, move(ep, 'e5', 'd6'));
    expect(after.board[sq('d5')]).toBeNull();
    const promo = C.fromFen('4k3/P7/8/8/8/8/8/4K3 w - - 0 1');
    expect(C.legalMoves(promo).filter((m) => m.from === sq('a7'))).toHaveLength(4);
    expect(C.toSan(promo, move(promo, 'a7', 'a8', 'Q'))).toBe('a8=Q+');
  });
  it('cannot castle out of, through, or into check', () => {
    const through = C.fromFen('4k3/8/8/8/8/8/5r2/4K2R w K - 0 1');
    expect(C.legalMoves(through).some((m) => m.from === sq('e1') && m.to === sq('g1'))).toBe(false);
  });
  it('disambiguates SAN', () => {
    const s = C.fromFen('4k3/8/8/8/8/7K/8/R6R w - - 0 1'); // both rooks can reach d1
    expect(C.toSan(s, move(s, 'a1', 'd1'))).toBe('Rad1');
    expect(C.toSan(C.fromFen('4k3/8/8/8/8/8/8/R3K2R w - - 0 1'), move(C.fromFen('4k3/8/8/8/8/8/8/R3K2R w - - 0 1'), 'a1', 'd1'))).toBe('Rd1'); // h1 rook is blocked by the king
  });
});

describe('chess computer', () => {
  it('finds a mate in one', () => {
    const s = C.fromFen('6k1/5ppp/8/8/8/8/5PPP/R5K1 w - - 0 1');
    const m = chessAi(s, 2)!;
    expect(C.result(C.applyMove(s, m))).toEqual({ kind: 'checkmate', winner: 'w' });
  });
  it('always returns a legal move at every level', () => {
    const s = play(C.newGame(), 'e2e4', 'e7e5');
    for (const lvl of [1, 2, 3] as const) {
      const m = chessAi(s, lvl, () => 0.5)!;
      expect(C.legalMoves(s).some((x) => x.from === m.from && x.to === m.to)).toBe(true);
    }
  });
});

describe('checkers', () => {
  it('starts with 12 pieces each and 7 opening moves for dark', () => {
    const s = K.newGame();
    expect(s.board.filter((m) => m?.side === 'dark')).toHaveLength(12);
    expect(s.board.filter((m) => m?.side === 'light')).toHaveLength(12);
    expect(K.legalMoves(s)).toHaveLength(7);
  });
  it('forces captures and chains multi-jumps', () => {
    const board: K.CheckersState['board'] = Array(64).fill(null);
    board[7 * 8 + 0] = { side: 'dark', king: false }; // a1 (row 7, col 0)
    board[6 * 8 + 1] = { side: 'light', king: false };
    board[4 * 8 + 3] = { side: 'light', king: false };
    board[7 * 8 + 6] = { side: 'dark', king: false }; // another piece with a plain step available
    const s: K.CheckersState = { board, turn: 'dark', quietPlies: 0 };
    const moves = K.legalMoves(s);
    expect(moves).toHaveLength(1);
    expect(moves[0]!.captured).toHaveLength(2);
    const after = K.applyMove(s, moves[0]!);
    expect(after.board.filter((m) => m?.side === 'light')).toHaveLength(0);
    expect(K.result(after)).toEqual({ kind: 'win', winner: 'dark' });
  });
  it('crowns on the far row and ends the move there', () => {
    const board: K.CheckersState['board'] = Array(64).fill(null);
    board[1 * 8 + 2] = { side: 'dark', king: false };
    board[0 * 8 + 7] = { side: 'light', king: false };
    const after = K.applyMove({ board, turn: 'dark', quietPlies: 3 }, { path: [1 * 8 + 2, 0 * 8 + 1], captured: [] });
    expect(after.board[1]).toEqual({ side: 'dark', king: true });
    expect(after.quietPlies).toBe(0);
  });
  it('lets kings move backwards', () => {
    const board: K.CheckersState['board'] = Array(64).fill(null);
    board[3 * 8 + 4] = { side: 'dark', king: true };
    expect(K.legalMoves({ board, turn: 'dark', quietPlies: 0 })).toHaveLength(4);
  });
  it('computer returns a legal move', () => {
    const s = K.newGame();
    const m = checkersAi(K.applyMove(s, K.legalMoves(s)[0]!), 2)!;
    expect(m.path.length).toBeGreaterThan(1);
  });
});

describe('reversi', () => {
  it('opens with four legal moves and flips correctly', () => {
    const s = R.newGame();
    expect(R.legalMoves(s).sort((a, b) => a - b)).toEqual([19, 26, 37, 44]);
    const after = R.applyMove(s, 19);
    expect(R.counts(after.board)).toEqual({ black: 4, white: 1 });
    expect(() => R.applyMove(s, 0)).toThrow();
  });
  it('passes and ends when neither side can move', () => {
    const board: R.ReversiState['board'] = Array(64).fill('black');
    board[63] = null;
    const s: R.ReversiState = { board, turn: 'white', passes: 0 };
    expect(R.legalMoves(s)).toEqual([]);
    expect(R.result(s)).toMatchObject({ kind: 'win', winner: 'black' });
  });
  it('values corners: the one-move evaluation takes an available corner', () => {
    const board: R.ReversiState['board'] = Array(64).fill(null);
    board[9] = 'black'; // b2
    board[18] = 'white'; // c3 — white can take the a1 corner by flipping b2
    board[27] = 'black';
    board[28] = 'white';
    board[35] = 'white';
    board[36] = 'black';
    const s: R.ReversiState = { board, turn: 'white', passes: 0 };
    expect(R.legalMoves(s)).toContain(0);
    expect(reversiAi(s, 1, () => 0)).toBe(0);
    expect(R.legalMoves(s)).toContain(reversiAi(s, 3)!); // deeper levels may prefer other moves, but always legal
  });
});

describe('saved-state validation (untrusted input)', () => {
  it('accepts fresh states', () => {
    expect(validateChessState(JSON.parse(JSON.stringify(C.newGame())))).toBeTruthy();
    expect(validateCheckersState(JSON.parse(JSON.stringify(K.newGame())))).toBeTruthy();
    expect(validateReversiState(JSON.parse(JSON.stringify(R.newGame())))).toBeTruthy();
  });
  it('rejects tampered states', () => {
    const chess = JSON.parse(JSON.stringify(C.newGame()));
    chess.board[4] = null; // no white king
    expect(() => validateChessState(chess)).toThrow();
    expect(() => validateChessState({ ...C.newGame(), castling: 'KQkq<script>' })).toThrow();
    const ck = JSON.parse(JSON.stringify(K.newGame()));
    ck.board[0] = { side: 'dark', king: false }; // light square
    expect(() => validateCheckersState(ck)).toThrow();
    expect(() => validateReversiState({ ...R.newGame(), passes: 9 })).toThrow();
    expect(() => validateReversiState(null)).toThrow();
  });
});
