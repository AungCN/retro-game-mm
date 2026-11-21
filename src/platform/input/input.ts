import type { ControlId, NormalizedInput } from '../../game-runtime/contracts/types';

export const KEY_MAP: Record<string, ControlId> = {
  ArrowUp: 'up',
  ArrowDown: 'down',
  ArrowLeft: 'left',
  ArrowRight: 'right',
  KeyW: 'up',
  KeyS: 'down',
  KeyA: 'left',
  KeyD: 'right',
  Space: 'action',
  KeyX: 'secondary',
  Enter: 'start',
  KeyP: 'start',
};

/** Standard Gamepad mapping (https://w3c.github.io/gamepad/#remapping). */
const PAD_BUTTONS: [number, ControlId][] = [
  [12, 'up'],
  [13, 'down'],
  [14, 'left'],
  [15, 'right'],
  [0, 'action'],
  [1, 'secondary'],
  [9, 'start'],
  [8, 'select'],
];

type Handler = (e: NormalizedInput) => void;

/** Keyboard + gamepad + pointer (touch buttons) → normalized events. Attach while a game is mounted; detach on exit. */
export class InputService {
  private handlers = new Set<Handler>();
  private padState = new Map<string, boolean>();
  private raf = 0;
  private attached = false;

  private emit = (e: NormalizedInput) => this.handlers.forEach((h) => h(e));

  private onKey = (ev: KeyboardEvent) => {
    const control = KEY_MAP[ev.code];
    if (!control || ev.repeat || ev.altKey || ev.metaKey || ev.ctrlKey) return;
    ev.preventDefault();
    this.emit({ kind: 'button', control, pressed: ev.type === 'keydown', source: 'keyboard', timestamp: ev.timeStamp });
  };

  private pollPads = () => {
    for (const pad of navigator.getGamepads?.() ?? []) {
      if (!pad || pad.mapping !== 'standard') continue;
      for (const [index, control] of PAD_BUTTONS) {
        const pressed = pad.buttons[index]?.pressed ?? false;
        const key = `${pad.index}:${control}`;
        if ((this.padState.get(key) ?? false) !== pressed) {
          this.padState.set(key, pressed);
          this.emit({ kind: 'button', control, pressed, source: 'gamepad', timestamp: performance.now() });
        }
      }
      const x = pad.axes[0] ?? 0;
      for (const [control, active] of [['left', x < -0.5], ['right', x > 0.5]] as const) {
        const key = `${pad.index}:axis-${control}`;
        if ((this.padState.get(key) ?? false) !== active) {
          this.padState.set(key, active);
          this.emit({ kind: 'button', control, pressed: active, source: 'gamepad', timestamp: performance.now() });
        }
      }
    }
    this.raf = requestAnimationFrame(this.pollPads);
  };

  attach() {
    if (this.attached) return;
    this.attached = true;
    window.addEventListener('keydown', this.onKey);
    window.addEventListener('keyup', this.onKey);
    this.raf = requestAnimationFrame(this.pollPads);
  }

  detach() {
    this.attached = false;
    window.removeEventListener('keydown', this.onKey);
    window.removeEventListener('keyup', this.onKey);
    cancelAnimationFrame(this.raf);
    this.padState.clear();
  }

  /** Used by on-screen touch buttons. */
  pointer(control: ControlId, pressed: boolean) {
    this.emit({ kind: 'button', control, pressed, source: 'pointer', timestamp: performance.now() });
  }

  subscribe(h: Handler) {
    this.handlers.add(h);
    return () => {
      this.handlers.delete(h);
    };
  }

  listenerCount() {
    return this.handlers.size;
  }
}
