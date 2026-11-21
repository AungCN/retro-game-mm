import type { GameStatus } from '../contracts/types';

/** Allowed transitions — matches the state diagram in GAME_MODULE_CONTRACT.md. */
const ALLOWED: Record<GameStatus, GameStatus[]> = {
  loading: ['ready', 'error', 'disposed'],
  ready: ['running', 'disposed', 'error'],
  running: ['paused', 'error', 'disposed'],
  paused: ['running', 'error', 'disposed'],
  error: ['disposed'],
  disposed: [],
};

export function canTransition(from: GameStatus, to: GameStatus): boolean {
  return from === to || ALLOWED[from].includes(to);
}

export class LifecycleError extends Error {}

export class Lifecycle {
  private current: GameStatus = 'loading';
  private listeners = new Set<(s: GameStatus) => void>();

  get status() {
    return this.current;
  }

  to(next: GameStatus) {
    if (!canTransition(this.current, next)) throw new LifecycleError(`Invalid transition ${this.current} → ${next}`);
    if (next === this.current) return;
    this.current = next;
    this.listeners.forEach((l) => l(next));
  }

  onChange(l: (s: GameStatus) => void) {
    this.listeners.add(l);
    return () => this.listeners.delete(l);
  }
}
