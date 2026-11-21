// Comet Courier — original lane game. Pure, deterministic rules (no DOM), so they can be unit-tested.

export const LANES = 5;
export const PLAYER_Y = 0.88; // fraction of field height
export const HIT_BAND = 0.06;

export type ObjectKind = 'comet' | 'star';
export interface FieldObject {
  id: number;
  lane: number;
  y: number;
  kind: ObjectKind;
}

export interface GameState {
  lane: number;
  objects: FieldObject[];
  score: number;
  lives: number;
  elapsed: number;
  spawnIn: number;
  nextId: number;
  seed: number;
  over: boolean;
  invulnerableFor: number;
}

export type GameEvent = 'collect' | 'hit' | 'game-over';

export interface StepInput {
  moveLeft: boolean; // edge-triggered: true for one step when pressed
  moveRight: boolean;
}

/** mulberry32 PRNG — deterministic for tests and replays. */
export function nextRandom(seed: number): [number, number] {
  let t = (seed + 0x6d2b79f5) >>> 0;
  let r = Math.imul(t ^ (t >>> 15), t | 1);
  r ^= r + Math.imul(r ^ (r >>> 7), r | 61);
  const value = ((r ^ (r >>> 14)) >>> 0) / 4294967296;
  return [value, t];
}

export function newGame(seed = 1): GameState {
  return { lane: 2, objects: [], score: 0, lives: 3, elapsed: 0, spawnIn: 0.6, nextId: 1, seed: seed >>> 0, over: false, invulnerableFor: 0 };
}

/** Field speed in field-heights per second; rises with time and is capped. */
export const speedAt = (elapsed: number) => Math.min(0.35 + elapsed * 0.01, 1.1);

export function step(prev: GameState, dt: number, input: StepInput): { state: GameState; events: GameEvent[] } {
  if (prev.over) return { state: prev, events: [] };
  const dtc = Math.min(Math.max(dt, 0), 0.1); // clamp long frames (tab switches) to keep collisions fair
  const s: GameState = { ...prev, objects: prev.objects.map((o) => ({ ...o })) };
  const events: GameEvent[] = [];

  if (input.moveLeft) s.lane = Math.max(0, s.lane - 1);
  if (input.moveRight) s.lane = Math.min(LANES - 1, s.lane + 1);

  s.elapsed += dtc;
  s.invulnerableFor = Math.max(0, s.invulnerableFor - dtc);
  const speed = speedAt(s.elapsed);
  for (const o of s.objects) o.y += speed * dtc;

  s.spawnIn -= dtc;
  if (s.spawnIn <= 0) {
    let r: number;
    [r, s.seed] = nextRandom(s.seed);
    const lane = Math.floor(r * LANES);
    [r, s.seed] = nextRandom(s.seed);
    const kind: ObjectKind = r < 0.35 ? 'star' : 'comet';
    s.objects.push({ id: s.nextId++, lane, y: -0.05, kind });
    [r, s.seed] = nextRandom(s.seed);
    s.spawnIn = Math.max(0.25, 0.9 - s.elapsed * 0.01) * (0.7 + r * 0.6);
  }

  const kept: FieldObject[] = [];
  for (const o of s.objects) {
    const hitting = o.lane === s.lane && Math.abs(o.y - PLAYER_Y) < HIT_BAND;
    if (hitting && o.kind === 'star') {
      s.score += 10;
      events.push('collect');
      continue;
    }
    if (hitting && o.kind === 'comet' && s.invulnerableFor === 0) {
      s.lives -= 1;
      s.invulnerableFor = 1.0;
      events.push('hit');
      continue;
    }
    if (o.y < 1.1) kept.push(o);
  }
  s.objects = kept;
  s.score += Math.floor(s.elapsed) - Math.floor(prev.elapsed); // +1 per whole second survived

  if (s.lives <= 0) {
    s.over = true;
    events.push('game-over');
  }
  return { state: s, events };
}
