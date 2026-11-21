import type { GameModuleFactory } from '../../game-runtime/contracts/types';
import { assertManifest } from '../../domain/games/manifest';
import manifestJson from './manifest.json';
import { BoardGameModule } from '../board/BoardGameModule';
import type { Cell } from '../board/BoardView';
import { applyMove, colOf, isDark, legalMoves, newGame, result, rowOf, sameMove, type CheckersMove, type CheckersState } from './rules';

export const manifest = assertManifest(manifestJson);
const name = (sq: number) => 'abcdefgh'[colOf(sq)]! + String(8 - rowOf(sq));

export function validateCheckersState(v: unknown): CheckersState {
  const s = v as CheckersState;
  const ok =
    s && Array.isArray(s.board) && s.board.length === 64 &&
    s.board.every((m, sq) => m === null || (typeof m === 'object' && (m.side === 'dark' || m.side === 'light') && typeof m.king === 'boolean' && isDark(sq))) &&
    (s.turn === 'dark' || s.turn === 'light') && Number.isInteger(s.quietPlies) && s.quietPlies >= 0;
  if (!ok) throw new Error('invalid checkers state');
  return s;
}

export class Checkers extends BoardGameModule<CheckersState> {
  protected readonly gameId = manifest.id;
  protected readonly aiGame = 'checkers' as const;
  protected readonly boardLabel = 'Checkers board, dark pieces at the bottom';
  private selected: number | null = null;
  private last: CheckersMove | null = null;

  protected newState() {
    this.selected = null;
    this.last = null;
    return newGame();
  }
  protected validateState(v: unknown) {
    return validateCheckersState(v);
  }
  protected turnIndex(): 0 | 1 {
    return this.state.turn === 'dark' ? 0 : 1;
  }
  protected isOver() {
    return result(this.state).kind !== 'ongoing';
  }

  private movesFrom(sq: number) {
    return legalMoves(this.state).filter((m) => m.path[0] === sq);
  }

  protected cells(): Cell[] {
    const options = this.selected === null ? [] : this.movesFrom(this.selected);
    const targets = new Set(options.map((m) => m.path[m.path.length - 1]!));
    const movable = new Set(legalMoves(this.state).map((m) => m.path[0]!));
    return this.state.board.map((m, sq) => {
      const classes: string[] = [];
      if (m) classes.push(`man--${m.side}`, ...(m.king ? ['man--king'] : []));
      if (sq === this.selected) classes.push('is-selected');
      if (targets.has(sq)) classes.push('is-target');
      if (this.last?.path.includes(sq)) classes.push('is-last');
      const desc = m ? `${m.side} ${m.king ? 'king' : 'piece'}` : isDark(sq) ? 'empty' : 'light square';
      const extra = sq === this.selected ? ', selected' : targets.has(sq) ? ', can move here' : m && movable.has(sq) && m.side === this.state.turn ? ', can move' : '';
      return { text: m ? (m.king ? '♛︎' : '●') : '', label: `${name(sq)}, ${desc}${extra}`, classes };
    });
  }

  protected statusText(): string {
    const r = result(this.state);
    if (r.kind === 'win') return `${r.winner === 'dark' ? 'Dark' : 'Light'} wins — the other side cannot move.`;
    if (r.kind === 'draw') return 'Draw — 40 moves each without a capture or crowning.';
    const mustJump = legalMoves(this.state).some((m) => m.captured.length);
    const who = this.mode === 'computer' ? (this.state.turn === 'dark' ? 'Your move (Dark)' : 'Computer (Light)') : `${this.state.turn === 'dark' ? 'Dark' : 'Light'} to move`;
    return mustJump ? `${who} — you must capture.` : who;
  }

  protected onSquare(sq: number) {
    if (this.selected !== null) {
      const options = this.movesFrom(this.selected).filter((m) => m.path[m.path.length - 1] === sq);
      if (options.length) {
        // If two jump routes end on the same square, take the one that captures more.
        const move = options.sort((a, b) => b.captured.length - a.captured.length)[0]!;
        this.play(move);
        return;
      }
    }
    this.selected = this.movesFrom(sq).length && this.selected !== sq ? sq : null;
    this.render();
  }

  private play(m: CheckersMove) {
    const notation = m.path.map(name).join(m.captured.length ? '×' : '–');
    this.selected = null;
    this.last = m;
    this.commit(applyMove(this.state, m), notation);
  }

  protected applyAiMove(move: unknown) {
    const m = move as CheckersMove | null;
    if (!m || !Array.isArray(m.path)) return;
    const legal = legalMoves(this.state).find((x) => sameMove(x, m));
    if (legal) this.play(legal);
  }
}

export const checkers: GameModuleFactory = { manifest, create: () => new Checkers() };
