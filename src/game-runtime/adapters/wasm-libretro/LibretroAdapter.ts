import type { DiscSwappable, GameHostServices, GameModule, SaveStateCapable } from '../../contracts/types';
import { newNonce, parseFrameMessage, PROTOCOL_VERSION, type FrameToHost, type HostToFrame } from './protocol';

export const CORE_ID = 'pcsx_rearmed';
export const CORE_VERSION = '4.2.3'; // EmulatorJS + core package version pinned in scripts/fetch-emulator.mjs
const MEMCARD_SCHEMA = 1;
const STATE_SCHEMA = 1;
const AUTOSAVE_MS = 60_000;
const FRAME_URL = '/emulator/frame.html';

export interface LibretroLaunch {
  gameId: string;
  discId: string;
  game: File;
  bios: File | null;
}

/**
 * Host side of the wasm-libretro adapter. The outer emulator frame is same-origin (so the service worker can serve it
 * offline); it runs EmulatorJS inside an inner sandboxed srcdoc frame with an opaque origin, which cannot reach the
 * platform's DOM, storage, or saves. Memory cards and save states cross the boundary as bytes and are stored by the
 * host in its own namespaced storage.
 */
export class LibretroAdapter implements GameModule, SaveStateCapable, DiscSwappable {
  private frame: HTMLIFrameElement | null = null;
  private services!: GameHostServices;
  private readonly nonce = newNonce();
  private discCount = 1;
  private waiters = new Map<FrameToHost['t'], (m: FrameToHost) => void>();
  private autosave = 0;
  private started = false;

  constructor(private readonly launch: LibretroLaunch) {}

  private memcardKey() {
    return `disc/${this.launch.discId}/memcard/1`;
  }
  private stateKey(slot: number) {
    return `disc/${this.launch.discId}/state/${slot}`;
  }

  private onMessage = (e: MessageEvent) => {
    if (!this.frame || e.source !== this.frame.contentWindow || e.origin !== location.origin) return; // only our own frame
    const msg = parseFrameMessage(e.data, this.nonce);
    if (!msg) return;
    if (msg.t === 'error') {
      this.services.lifecycle.reportError({ kind: 'runtime', message: 'The emulator reported a problem with this disc.', recoverable: true });
      console.warn('emulator:', msg.message);
    }
    if (msg.t === 'started') this.discCount = Math.max(1, msg.discCount);
    if (msg.t === 'save' && msg.data && msg.data.byteLength > 0) void this.storeMemcard(msg.data);
    this.waiters.get(msg.t)?.(msg);
    this.waiters.delete(msg.t);
  };

  private post(msg: HostToFrame) {
    this.frame?.contentWindow?.postMessage({ v: PROTOCOL_VERSION, nonce: this.nonce, msg }, location.origin);
  }

  private waitFor<T extends FrameToHost['t']>(t: T, ms: number): Promise<Extract<FrameToHost, { t: T }>> {
    return new Promise((resolve, reject) => {
      const timer = setTimeout(() => {
        this.waiters.delete(t);
        reject(new Error(`emulator did not answer (${t})`));
      }, ms);
      this.waiters.set(t, (m) => {
        clearTimeout(timer);
        resolve(m as Extract<FrameToHost, { t: T }>);
      });
    });
  }

  async load(container: HTMLElement, services: GameHostServices) {
    this.services = services;
    window.addEventListener('message', this.onMessage);
    const frame = document.createElement('iframe');
    frame.src = `${FRAME_URL}#${this.nonce}`;
    frame.title = 'PS1 player';
    frame.className = 'emulator-frame';
    frame.dataset.playerFrame = 'true';
    frame.setAttribute('allow', 'gamepad; fullscreen');
    frame.setAttribute('referrerpolicy', 'no-referrer');
    this.frame = frame;
    const ready = this.waitFor('ready', 20_000);
    container.appendChild(frame);
    await ready;
  }

  async start() {
    if (this.started) return;
    this.started = true;
    const started = this.waitFor('started', 600_000); // includes the user pressing Start inside the player
    this.post({ t: 'load', game: this.launch.game, bios: this.launch.bios, volume: this.services.audio.isMuted() ? 0 : 0.6 });
    await started;
    await this.restore();
    this.autosave = window.setInterval(() => void this.save(), AUTOSAVE_MS);
    this.frame?.focus();
  }

  async pause() {
    this.post({ t: 'pause' });
    await this.save();
  }

  async resume() {
    this.post({ t: 'resume' });
    this.frame?.focus();
  }

  private async storeMemcard(data: Uint8Array) {
    try {
      await this.services.storage.blobs.write(this.launch.gameId, this.memcardKey(), data, MEMCARD_SCHEMA);
    } catch {
      this.services.lifecycle.reportError({ kind: 'save', message: 'Could not store the memory card (browser storage full or unavailable). Export your saves.', recoverable: true });
    }
  }

  /** Memory card: ask the frame for the current card; the reply is stored by onMessage. */
  async save() {
    if (!this.started) return;
    try {
      await (async () => {
        const reply = this.waitFor('save', 10_000);
        this.post({ t: 'get-save' });
        await reply;
      })();
    } catch {
      /* frame busy or gone; the next autosave retries */
    }
  }

  async restore() {
    const rec = await this.services.storage.blobs.read(this.launch.gameId, this.memcardKey()).catch(() => undefined);
    if (rec && rec.schemaVersion === MEMCARD_SCHEMA) this.post({ t: 'put-save', data: rec.data });
  }

  async saveState(slot: number) {
    const reply = this.waitFor('state', 20_000);
    this.post({ t: 'save-state' });
    const { data } = await reply;
    const wrapped = new TextEncoder().encode(`${CORE_ID}@${CORE_VERSION}\n`);
    const out = new Uint8Array(wrapped.length + data.length);
    out.set(wrapped, 0);
    out.set(data, wrapped.length);
    await this.services.storage.blobs.write(this.launch.gameId, this.stateKey(slot), out, STATE_SCHEMA);
  }

  async loadState(slot: number) {
    const rec = await this.services.storage.blobs.read(this.launch.gameId, this.stateKey(slot));
    if (!rec || rec.schemaVersion !== STATE_SCHEMA) throw new Error('No save state in this slot');
    const nl = rec.data.indexOf(10);
    const header = new TextDecoder().decode(rec.data.subarray(0, Math.max(0, nl)));
    if (header !== `${CORE_ID}@${CORE_VERSION}`) throw new Error('This save state was made with a different emulator version');
    this.post({ t: 'load-state', data: rec.data.slice(nl + 1) });
  }

  listDiscSlots() {
    return Array.from({ length: this.discCount }, (_, i) => ({ index: i, label: `Disc ${i + 1}` }));
  }

  async swapDisc(index: number) {
    if (Number.isInteger(index) && index >= 0 && index < this.discCount) this.post({ t: 'set-disc', index });
  }

  async destroy() {
    window.clearInterval(this.autosave);
    if (this.started) await this.save();
    window.removeEventListener('message', this.onMessage);
    this.waiters.clear();
    this.frame?.remove(); // removing the browsing context releases the core's memory (SPIKE-001 A8)
    this.frame = null;
  }
}
