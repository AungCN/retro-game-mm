import type { GameModuleFactory } from '../../game-runtime/contracts/types';
import { assertManifest } from '../../domain/games/manifest';
import manifestJson from './manifest.json';
import { BoardGameModule } from '../board/BoardGameModule';
import type { Cell } from '../board/BoardView';
import { applyMove, counts, legalMoves, newGame, result, type ReversiState } from './rules';

export const manifest = assertManifest(manifestJson);
const name = (sq: number) => 'abcdefgh'[sq & 7]! + String((sq >> 3) + 1);

export function validateReversiState(v: unknown): ReversiState {
  const s = v as ReversiState;
  const ok =
    s && Array.isArray(s.board) && s.board.length === 64 && s.board.every((d) => d === null || d === 'black' || d === 'white') &&
    (s.turn === 'black' || s.turn === 'white') && Number.isInteger(s.passes) && s.passes >= 0 && s.passes <= 2;
  if (!ok) throw new Error('invalid reversi state');
  return s;
}

export class Reversi extends BoardGameModule<ReversiState> {
  protected readonly gameId = manifest.id;
  protected readonly aiGame = 'reversi' as const;
  protected readonly boardLabel = 'Reversi board';
  private last: number | null = null;

  protected newState() {
    this.last = null;
    return newGame();
  }
  protected validateState(v: unknown) {
    return validateReversiState(v);
  }
  protected turnIndex(): 0 | 1 {
    return this.state.turn === 'black' ? 0 : 1;
  }
  protected isOver() {
    return result(this.state).kind !== 'ongoing';
  }

  /** A side with no legal move passes automatically (and the pass is recorded in the move list). */
  protected override afterChange() {
    if (!this.isOver() && legalMoves(this.state).length === 0) {
      const who = this.state.turn === 'black' ? 'Black' : 'White';
      this.state = applyMove(this.state, null);
      this.moves = [...this.moves, `${who} passes`];
    }
  }

  protected cells(): Cell[] {
    const humanTurn = this.mode === 'two-player' || this.state.turn === 'black';
    const hints = humanTurn && !this.isOver() ? new Set(legalMoves(this.state)) : new Set<number>();
    return Array.from({ length: 64 }, (_, i) => {
      const d = this.state.board[i];
      const classes: string[] = ['reversi-cell'];
      if (d) classes.push(`disc--${d}`);
      if (hints.has(i)) classes.push('is-target');
      if (i === this.last) classes.push('is-last');
      return { text: d ? '●' : '', label: `${name(i)}, ${d ?? 'empty'}${hints.has(i) ? ', can play here' : ''}`, classes };
    });
  }

  protected statusText(): string {
    const { black, white } = counts(this.state.board);
    const score = `Black ${black} – White ${white}.`;
    const r = result(this.state);
    if (r.kind === 'win') return `${r.winner === 'black' ? 'Black' : 'White'} wins. ${score}`;
    if (r.kind === 'draw') return `Draw. ${score}`;
    const who = this.mode === 'computer' ? (this.state.turn === 'black' ? 'Your move (Black)' : 'Computer (White)') : `${this.state.turn === 'black' ? 'Black' : 'White'} to move`;
    return `${who}. ${score}`;
  }

  protected onSquare(i: number) {
    if (legalMoves(this.state).includes(i)) this.play(i);
  }

  private play(sq: number) {
    const who = this.state.turn === 'black' ? 'Black' : 'White';
    this.last = sq;
    this.commit(applyMove(this.state, sq), `${who} ${name(sq)}`);
  }

  protected applyAiMove(move: unknown) {
    if (typeof move === 'number' && legalMoves(this.state).includes(move)) this.play(move);
  }
}

export const reversi: GameModuleFactory = { manifest, create: () => new Reversi() };
