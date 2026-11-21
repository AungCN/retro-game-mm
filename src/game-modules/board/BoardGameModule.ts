import type { GameHostServices, GameModule } from '../../game-runtime/contracts/types';
import { BoardView, type Cell } from './BoardView';
import type { AiRequest } from './ai-worker';

export type Mode = 'computer' | 'two-player';
export type Level = 1 | 2 | 3;
export const SAVE_SCHEMA = 1;

interface Saved<S> {
  mode: Mode;
  level: Level;
  state: S;
  moves: string[];
}

/**
 * Shared implementation of the game contract for turn-based board games. Each game supplies its rules glue:
 * state creation, validation, rendering, square handling, and whose turn it is.
 */
export abstract class BoardGameModule<S> implements GameModule {
  protected services!: GameHostServices;
  protected view!: BoardView;
  protected state!: S;
  protected mode: Mode = 'computer';
  protected level: Level = 2;
  protected moves: string[] = [];
  protected paused = true;
  private history: { state: S; moves: string[] }[] = [];
  private worker: Worker | null = null;
  private aiRequest = 0;
  protected aiThinking = false;
  private root: HTMLDivElement | null = null;
  private moveList!: HTMLOListElement;
  private modeSelect!: HTMLSelectElement;
  private levelSelect!: HTMLSelectElement;

  protected abstract readonly gameId: string;
  protected abstract readonly aiGame: AiRequest['game'];
  protected abstract readonly boardLabel: string;
  protected abstract newState(): S;
  /** Throws if a restored state is not structurally valid. */
  protected abstract validateState(value: unknown): S;
  /** Index 0 = the player who moves first (the human in computer mode). */
  protected abstract turnIndex(): 0 | 1;
  protected abstract isOver(): boolean;
  protected abstract cells(): Cell[];
  protected abstract statusText(): string;
  protected abstract onSquare(displayIndex: number): void;
  /** Applies a computer move received from the worker (already shape-checked by the game). */
  protected abstract applyAiMove(move: unknown): void;
  /** Hook for automatic actions (e.g. Reversi pass); called after every change. */
  protected afterChange(): void {}

  async load(container: HTMLElement, services: GameHostServices) {
    this.services = services;
    const root = document.createElement('div');
    root.className = 'board-host';
    const tools = document.createElement('div');
    tools.className = 'board-tools';
    const newBtn = Object.assign(document.createElement('button'), { type: 'button', textContent: 'New game' });
    newBtn.addEventListener('click', () => this.reset());
    const undoBtn = Object.assign(document.createElement('button'), { type: 'button', textContent: 'Undo' });
    undoBtn.addEventListener('click', () => this.undo());
    this.modeSelect = this.select('Opponent', [['computer', 'Computer'], ['two-player', 'Two players (same device)']], (v) => {
      this.mode = v as Mode;
      this.changed();
    });
    this.levelSelect = this.select('Level', [['1', 'Easy'], ['2', 'Medium'], ['3', 'Hard']], (v) => {
      this.level = Number(v) as Level;
      void this.persist();
    });
    tools.append(newBtn, undoBtn, this.modeSelect.parentElement!, this.levelSelect.parentElement!);
    this.view = new BoardView(this.boardLabel, (i) => {
      if (this.paused || this.aiThinking || this.isOver()) return;
      if (this.mode === 'computer' && this.turnIndex() === 1) return;
      this.onSquare(i);
    });
    const side = document.createElement('div');
    side.className = 'board-side';
    const h = document.createElement('h2');
    h.textContent = 'Moves';
    this.moveList = document.createElement('ol');
    this.moveList.className = 'move-list';
    side.append(h, this.moveList);
    root.append(tools, this.view.root, side);
    container.appendChild(root);
    this.root = root;
    this.worker = new Worker(new URL('./ai-worker.ts', import.meta.url), { type: 'module' });
    this.worker.onmessage = (e: MessageEvent<{ id: number; move: unknown; error?: string }>) => {
      if (e.data.id !== this.aiRequest) return; // stale reply (new game, undo, or mode change)
      this.aiThinking = false;
      if (e.data.error) this.services.lifecycle.reportError({ kind: 'runtime', message: 'The computer player had a problem; try a new game.', recoverable: true });
      else if (!this.isOver()) this.applyAiMove(e.data.move);
      this.changed();
    };
    await this.restore();
    this.render();
  }

  private select(label: string, options: [string, string][], onChange: (v: string) => void): HTMLSelectElement {
    const wrap = document.createElement('label');
    wrap.textContent = `${label} `;
    const sel = document.createElement('select');
    for (const [value, text] of options) sel.append(Object.assign(document.createElement('option'), { value, textContent: text }));
    sel.addEventListener('change', () => onChange(sel.value));
    wrap.appendChild(sel);
    return sel;
  }

  /** Records a move: keeps undo history, updates the move list, saves, and lets the computer reply. */
  protected commit(next: S, notation: string) {
    this.history.push({ state: this.state, moves: this.moves });
    if (this.history.length > 400) this.history.shift();
    this.state = next;
    this.moves = [...this.moves, notation];
    this.changed();
  }

  protected changed() {
    this.afterChange();
    this.render();
    void this.persist();
    this.maybeAskComputer();
  }

  private maybeAskComputer() {
    if (this.paused || this.isOver() || this.mode !== 'computer' || this.turnIndex() !== 1 || this.aiThinking || !this.worker) return;
    this.aiThinking = true;
    this.aiRequest++;
    this.render();
    this.worker.postMessage({ id: this.aiRequest, game: this.aiGame, level: this.level, state: this.state } as AiRequest);
  }

  protected render() {
    if (!this.root) return;
    const prefix = this.paused ? 'Paused. ' : this.aiThinking ? 'Computer is thinking… ' : '';
    this.view.update(this.cells(), prefix + this.statusText(), this.paused);
    this.modeSelect.value = this.mode;
    this.levelSelect.value = String(this.level);
    this.levelSelect.disabled = this.mode !== 'computer';
    const items = this.moves.map((m) => Object.assign(document.createElement('li'), { textContent: m }));
    this.moveList.replaceChildren(...items);
    this.moveList.scrollTop = this.moveList.scrollHeight;
  }

  private reset() {
    this.aiRequest++;
    this.aiThinking = false;
    this.history = [];
    this.state = this.newState();
    this.moves = [];
    this.changed();
    this.view.focus();
  }

  private undo() {
    if (!this.history.length) return;
    this.aiRequest++;
    this.aiThinking = false;
    // In computer mode, step back to the human's turn.
    let snap = this.history.pop()!;
    this.state = snap.state;
    this.moves = snap.moves;
    while (this.mode === 'computer' && this.turnIndex() === 1 && this.history.length) {
      snap = this.history.pop()!;
      this.state = snap.state;
      this.moves = snap.moves;
    }
    this.changed();
  }

  async start() {
    this.paused = false;
    this.changed();
    this.view.focus();
  }
  async pause() {
    this.paused = true;
    this.aiRequest++; // abandon any running search; it is re-requested on resume
    this.aiThinking = false;
    this.render();
    await this.persist();
  }
  async resume() {
    await this.start();
  }
  async save() {
    await this.persist();
  }

  private async persist() {
    try {
      const data: Saved<S> = { mode: this.mode, level: this.level, state: this.state, moves: this.moves.slice(-400) };
      await this.services.storage.writeSave(this.gameId, data, SAVE_SCHEMA);
    } catch {
      this.services.lifecycle.reportError({ kind: 'save', message: 'Could not save this game (browser storage unavailable or full).', recoverable: true });
    }
  }

  async restore() {
    this.state = this.newState();
    this.moves = [];
    try {
      const saved = await this.services.storage.readSave<Saved<unknown>>(this.gameId);
      if (!saved) return;
      this.state = this.validateState(saved.state);
      this.mode = saved.mode === 'two-player' ? 'two-player' : 'computer';
      this.level = saved.level === 1 || saved.level === 3 ? saved.level : 2;
      this.moves = Array.isArray(saved.moves) ? saved.moves.filter((m): m is string => typeof m === 'string').slice(-400) : [];
    } catch {
      this.state = this.newState(); // corrupted or incompatible save: start fresh rather than fail
      this.moves = [];
    }
  }

  async destroy() {
    this.aiRequest++;
    this.worker?.terminate();
    this.worker = null;
    this.root?.remove();
    this.root = null;
  }
}
