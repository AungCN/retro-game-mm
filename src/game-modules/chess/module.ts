import type { GameModuleFactory } from '../../game-runtime/contracts/types';
import { assertManifest } from '../../domain/games/manifest';
import manifestJson from './manifest.json';
import { BoardGameModule } from '../board/BoardGameModule';
import type { Cell } from '../board/BoardView';
import {
  applyMove, inCheck, kingSquare, legalMoves, newGame, result, squareName, toSan,
  type ChessState, type Move, type Piece, type PieceType,
} from './rules';

export const manifest = assertManifest(manifestJson);

const GLYPH: Record<PieceType, string> = { K: '♚', Q: '♛', R: '♜', B: '♝', N: '♞', P: '♟' };
const NAME: Record<PieceType, string> = { K: 'king', Q: 'queen', R: 'rook', B: 'bishop', N: 'knight', P: 'pawn' };
const TEXT_STYLE = '︎'; // force text (not emoji) presentation
const toSquare = (displayIndex: number) => (7 - (displayIndex >> 3)) * 8 + (displayIndex & 7);

export function validateChessState(v: unknown): ChessState {
  const s = v as ChessState;
  const ok =
    s && Array.isArray(s.board) && s.board.length === 64 &&
    s.board.every((p) => p === null || (typeof p === 'object' && (p.c === 'w' || p.c === 'b') && 'PNBRQK'.includes(p.t) && p.t.length === 1)) &&
    (s.turn === 'w' || s.turn === 'b') && typeof s.castling === 'string' && /^[KQkq]{0,4}$/.test(s.castling) &&
    (s.ep === null || (Number.isInteger(s.ep) && s.ep >= 0 && s.ep < 64)) &&
    Number.isInteger(s.halfmove) && Number.isInteger(s.fullmove) && typeof s.seen === 'object' && s.seen !== null &&
    s.board.filter((p) => p?.t === 'K' && p.c === 'w').length === 1 && s.board.filter((p) => p?.t === 'K' && p.c === 'b').length === 1;
  if (!ok) throw new Error('invalid chess state');
  return s;
}

export class Chess extends BoardGameModule<ChessState> {
  protected readonly gameId = manifest.id;
  protected readonly aiGame = 'chess' as const;
  protected readonly boardLabel = 'Chess board, white at the bottom';
  private selected: number | null = null;
  private lastMove: Move | null = null;
  private promotion: { from: number; to: number } | null = null;
  private promoPanel: HTMLDivElement | null = null;

  protected newState() {
    this.selected = null;
    this.lastMove = null;
    return newGame();
  }
  protected validateState(v: unknown) {
    return validateChessState(v);
  }
  protected turnIndex(): 0 | 1 {
    return this.state.turn === 'w' ? 0 : 1;
  }
  protected isOver() {
    return result(this.state).kind !== 'ongoing';
  }

  protected cells(): Cell[] {
    const targets = this.selected === null ? [] : legalMoves(this.state).filter((m) => m.from === this.selected).map((m) => m.to);
    const checkSq = inCheck(this.state) ? kingSquare(this.state.board, this.state.turn) : -1;
    return Array.from({ length: 64 }, (_, i) => {
      const sq = toSquare(i);
      const p = this.state.board[sq];
      const classes: string[] = [];
      if (p) classes.push(`piece--${p.c}`);
      if (sq === this.selected) classes.push('is-selected');
      if (targets.includes(sq)) classes.push(p ? 'is-capture' : 'is-target');
      if (this.lastMove && (sq === this.lastMove.from || sq === this.lastMove.to)) classes.push('is-last');
      if (sq === checkSq) classes.push('is-check');
      const desc = p ? `${p.c === 'w' ? 'white' : 'black'} ${NAME[p.t]}` : 'empty';
      const extra = sq === this.selected ? ', selected' : targets.includes(sq) ? ', can move here' : '';
      return { text: p ? GLYPH[p.t] + TEXT_STYLE : '', label: `${squareName(sq)}, ${desc}${extra}`, classes };
    });
  }

  protected statusText(): string {
    const r = result(this.state);
    const side = this.state.turn === 'w' ? 'White' : 'Black';
    if (r.kind === 'checkmate') return `Checkmate — ${r.winner === 'w' ? 'White' : 'Black'} wins.`;
    if (r.kind === 'stalemate') return 'Stalemate — draw.';
    if (r.kind === 'draw') return `Draw (${r.reason === 'fifty-move' ? 'fifty-move rule' : r.reason === 'repetition' ? 'threefold repetition' : 'insufficient material'}).`;
    if (this.promotion) return 'Choose a piece for promotion.';
    const who = this.mode === 'computer' ? (this.state.turn === 'w' ? 'Your move (White)' : 'Computer (Black)') : `${side} to move`;
    return inCheck(this.state) ? `${who} — check!` : who;
  }

  protected onSquare(i: number) {
    if (this.promotion) return;
    const sq = toSquare(i);
    const p = this.state.board[sq];
    if (this.selected !== null) {
      const options = legalMoves(this.state).filter((m) => m.from === this.selected && m.to === sq);
      if (options.length > 1) {
        this.promotion = { from: this.selected, to: sq };
        this.showPromotion();
        this.render();
        return;
      }
      if (options.length === 1) {
        this.play(options[0]!);
        return;
      }
    }
    this.selected = p && p.c === this.state.turn && this.selected !== sq ? sq : null;
    this.render();
  }

  private play(m: Move) {
    const san = toSan(this.state, m);
    const number = this.state.turn === 'w' ? `${this.state.fullmove}. ` : `${this.state.fullmove}… `;
    this.selected = null;
    this.lastMove = m;
    this.commit(applyMove(this.state, m), number + san);
  }

  private showPromotion() {
    this.promoPanel?.remove();
    const panel = document.createElement('div');
    panel.className = 'promotion';
    panel.setAttribute('role', 'group');
    panel.setAttribute('aria-label', 'Promote pawn to');
    for (const t of ['Q', 'R', 'B', 'N'] as const) {
      const b = Object.assign(document.createElement('button'), { type: 'button', textContent: `${GLYPH[t]}${TEXT_STYLE} ${NAME[t]}` });
      b.addEventListener('click', () => {
        const pending = this.promotion!;
        this.promotion = null;
        panel.remove();
        this.promoPanel = null;
        this.play({ ...pending, promotion: t });
      });
      panel.appendChild(b);
    }
    this.view.root.prepend(panel);
    this.promoPanel = panel;
    (panel.firstChild as HTMLButtonElement).focus();
  }

  protected applyAiMove(move: unknown) {
    const m = move as Move | null;
    if (!m) return;
    const legal = legalMoves(this.state).find((x) => x.from === m.from && x.to === m.to && (x.promotion ?? null) === (m.promotion ?? null));
    if (legal) this.play(legal);
  }
}

export const chess: GameModuleFactory = { manifest, create: () => new Chess() };
export type { Piece };
