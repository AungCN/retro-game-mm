import { describe, expect, it } from 'vitest';
import { HIT_BAND, LANES, PLAYER_Y, newGame, nextRandom, speedAt, step, type GameState } from '../../src/game-modules/comet-courier/logic';
import { Lifecycle, LifecycleError, canTransition } from '../../src/game-runtime/host/lifecycle';

const noInput = { moveLeft: false, moveRight: false };
const withObject = (s: GameState, kind: 'comet' | 'star', lane = s.lane): GameState => ({ ...s, spawnIn: 99, objects: [{ id: 1, lane, y: PLAYER_Y, kind }] });

describe('Comet Courier rules', () => {
  it('is deterministic for a seed', () => {
    let a = newGame(42);
    let b = newGame(42);
    for (let i = 0; i < 300; i++) {
      a = step(a, 1 / 60, noInput).state;
      b = step(b, 1 / 60, noInput).state;
    }
    expect(a).toEqual(b);
    expect(nextRandom(1)[0]).toBeGreaterThanOrEqual(0);
    expect(nextRandom(1)[0]).toBeLessThan(1);
  });

  it('keeps the courier inside the lanes', () => {
    let s = newGame(1);
    for (let i = 0; i < 10; i++) s = step(s, 0.01, { moveLeft: true, moveRight: false }).state;
    expect(s.lane).toBe(0);
    for (let i = 0; i < 10; i++) s = step(s, 0.01, { moveLeft: false, moveRight: true }).state;
    expect(s.lane).toBe(LANES - 1);
  });

  it('collects stars and scores', () => {
    const r = step(withObject(newGame(1), 'star'), 0.001, noInput);
    expect(r.events).toContain('collect');
    expect(r.state.score).toBe(10);
    expect(r.state.objects).toHaveLength(0);
  });

  it('loses a life on a comet, then is briefly invulnerable', () => {
    const r = step(withObject(newGame(1), 'comet'), 0.001, noInput);
    expect(r.events).toContain('hit');
    expect(r.state.lives).toBe(2);
    const again = step(withObject(r.state, 'comet'), 0.001, noInput);
    expect(again.state.lives).toBe(2);
  });

  it('ignores objects in other lanes', () => {
    const s = newGame(1);
    const r = step(withObject(s, 'comet', (s.lane + 1) % LANES), 0.001, noInput);
    expect(r.state.lives).toBe(3);
  });

  it('ends the game at zero lives and then ignores input', () => {
    const s = { ...withObject(newGame(1), 'comet'), lives: 1 };
    const r = step(s, 0.001, noInput);
    expect(r.state.over).toBe(true);
    expect(r.events).toContain('game-over');
    expect(step(r.state, 1, { moveLeft: true, moveRight: false }).state).toBe(r.state);
  });

  it('clamps long frames so a background tab cannot skip through collisions', () => {
    const s = { ...newGame(1), spawnIn: 99, objects: [{ id: 1, lane: 2, y: PLAYER_Y - HIT_BAND - 0.01, kind: 'comet' as const }] };
    const r = step(s, 60, noInput); // one huge frame
    expect(r.state.elapsed).toBeCloseTo(0.1);
  });

  it('speeds up over time with a cap', () => {
    expect(speedAt(0)).toBeLessThan(speedAt(30));
    expect(speedAt(10_000)).toBe(1.1);
  });
});

describe('lifecycle', () => {
  it('follows the contract state machine', () => {
    const l = new Lifecycle();
    const seen: string[] = [];
    l.onChange((s) => seen.push(s));
    l.to('ready');
    l.to('running');
    l.to('paused');
    l.to('running');
    l.to('disposed');
    expect(seen).toEqual(['ready', 'running', 'paused', 'running', 'disposed']);
  });
  it('rejects invalid transitions', () => {
    const l = new Lifecycle();
    expect(() => l.to('running')).toThrow(LifecycleError);
    expect(canTransition('disposed', 'running')).toBe(false);
    expect(canTransition('error', 'running')).toBe(false);
    expect(canTransition('error', 'disposed')).toBe(true);
  });
});
