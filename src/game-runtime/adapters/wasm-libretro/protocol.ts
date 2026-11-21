// Typed message protocol between the host and the outer emulator frame (ADR-0002). Messages are accepted only when
// event.source is our iframe, event.origin is our own origin, and the per-session random nonce matches; shapes and
// sizes are validated. The outer frame relays to the sandboxed inner frame (see public/emulator/frame.js).

export const PROTOCOL_VERSION = 1;
export const MAX_SAVE_BYTES = 16 * 1024 * 1024;

export type HostToFrame =
  | { t: 'load'; game: File; bios: File | null; volume: number }
  | { t: 'pause' }
  | { t: 'resume' }
  | { t: 'mute'; muted: boolean }
  | { t: 'get-save' }
  | { t: 'put-save'; data: Uint8Array }
  | { t: 'save-state' }
  | { t: 'load-state'; data: Uint8Array }
  | { t: 'set-disc'; index: number };

export type FrameToHost =
  | { t: 'ready' }
  | { t: 'started'; discCount: number }
  | { t: 'save'; data: Uint8Array | null }
  | { t: 'state'; data: Uint8Array }
  | { t: 'error'; message: string };

export interface Envelope<T> {
  v: typeof PROTOCOL_VERSION;
  nonce: string;
  msg: T;
}

export function newNonce(): string {
  const b = new Uint8Array(16);
  crypto.getRandomValues(b);
  return [...b].map((x) => x.toString(16).padStart(2, '0')).join('');
}

const isBytes = (x: unknown, max: number): x is Uint8Array => x instanceof Uint8Array && x.byteLength <= max;

/** Returns the validated frame message, or null for anything unexpected (dropped silently by the caller). */
export function parseFrameMessage(data: unknown, nonce: string): FrameToHost | null {
  if (typeof data !== 'object' || data === null) return null;
  const env = data as Partial<Envelope<Record<string, unknown>>>;
  if (env.v !== PROTOCOL_VERSION || env.nonce !== nonce || typeof env.msg !== 'object' || env.msg === null) return null;
  const m = env.msg;
  switch (m.t) {
    case 'ready':
      return { t: 'ready' };
    case 'started':
      return Number.isInteger(m.discCount) && (m.discCount as number) >= 0 && (m.discCount as number) <= 16 ? { t: 'started', discCount: m.discCount as number } : null;
    case 'save':
      return m.data === null || isBytes(m.data, MAX_SAVE_BYTES) ? { t: 'save', data: (m.data as Uint8Array | null) ?? null } : null;
    case 'state':
      return isBytes(m.data, 64 * 1024 * 1024) ? { t: 'state', data: m.data } : null;
    case 'error':
      return typeof m.message === 'string' ? { t: 'error', message: m.message.slice(0, 300) } : null;
    default:
      return null;
  }
}
