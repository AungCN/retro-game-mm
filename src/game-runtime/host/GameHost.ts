import type { CapabilityReport, GameError, GameHostServices, GameModule, GameStatus } from '../contracts/types';
import { Lifecycle } from './lifecycle';
import { InputService } from '../../platform/input/input';
import { AudioService } from '../../platform/audio/audio';
import { createStorageService } from '../../platform/storage/saves';

export interface HostCallbacks {
  onStatus(status: GameStatus): void;
  onError(error: GameError): void;
}

/** Mounts one GameModule at a time and owns its lifecycle, input, audio, and cleanup. */
export class GameHost {
  readonly lifecycle = new Lifecycle();
  readonly input = new InputService();
  readonly audio = new AudioService();
  private module: GameModule | null = null;
  private disposed = false;

  constructor(
    private readonly capabilities: CapabilityReport,
    private readonly callbacks: HostCallbacks,
  ) {
    this.lifecycle.onChange((s) => callbacks.onStatus(s));
  }

  private services(): GameHostServices {
    return {
      capabilities: this.capabilities,
      input: { subscribe: (h) => this.input.subscribe(h) },
      audio: {
        playEffect: (id) => this.audio.playEffect(id),
        setMuted: (m) => this.audio.setMuted(m),
        isMuted: () => this.audio.isMuted(),
      },
      storage: createStorageService(),
      lifecycle: {
        requestPause: () => void this.togglePause(),
        reportStatus: () => undefined, // the host drives status itself; modules' reports are advisory
        reportError: (e) => this.fail(e),
      },
    };
  }

  private onVisibility = () => {
    if (document.hidden && this.lifecycle.status === 'running') void this.pause();
  };
  private onBlur = () => {
    // Focus moving into our own player iframe (emulator) also blurs the window; that is not "leaving the game".
    setTimeout(() => {
      const active = document.activeElement;
      if (active instanceof HTMLIFrameElement && active.dataset.playerFrame === 'true') return;
      if (this.lifecycle.status === 'running') void this.pause();
    }, 0);
  };

  private fail(error: GameError) {
    this.callbacks.onError(error);
    if (!error.recoverable && this.lifecycle.status !== 'disposed') this.lifecycle.to('error');
  }

  private async guard(kind: GameError['kind'], fn: () => Promise<void>, message: string) {
    try {
      await fn();
    } catch (err) {
      console.error(err);
      this.fail({ kind, message, recoverable: false });
    }
  }

  async mount(module: GameModule, container: HTMLElement) {
    this.module = module;
    this.input.attach();
    document.addEventListener('visibilitychange', this.onVisibility);
    window.addEventListener('blur', this.onBlur);
    await this.guard('load', () => module.load(container, this.services()), 'The game could not be loaded.');
    if (this.lifecycle.status === 'loading') this.lifecycle.to('ready');
  }

  /** Called from a user gesture (Play button) so audio can be unlocked. */
  async start() {
    if (!this.module || this.lifecycle.status !== 'ready') return;
    this.audio.unlock();
    await this.guard('runtime', () => this.module!.start(), 'The game stopped unexpectedly.');
    if (this.lifecycle.status === 'ready') this.lifecycle.to('running');
  }

  async pause() {
    if (!this.module || this.lifecycle.status !== 'running') return;
    await this.guard('runtime', () => this.module!.pause(), 'The game could not be paused.');
    this.audio.suspend();
    if (this.lifecycle.status === 'running') this.lifecycle.to('paused');
  }

  async resume() {
    if (!this.module || this.lifecycle.status !== 'paused') return;
    this.audio.resume();
    await this.guard('runtime', () => this.module!.resume(), 'The game could not be resumed.');
    if (this.lifecycle.status === 'paused') this.lifecycle.to('running');
  }

  async togglePause() {
    if (this.lifecycle.status === 'running') await this.pause();
    else if (this.lifecycle.status === 'paused') await this.resume();
  }

  /** Always safe to call; releases everything even if the module throws. */
  async destroy() {
    if (this.disposed) return;
    this.disposed = true;
    document.removeEventListener('visibilitychange', this.onVisibility);
    window.removeEventListener('blur', this.onBlur);
    this.input.detach();
    try {
      await this.module?.destroy();
    } catch (err) {
      console.error('destroy failed', err);
    }
    this.module = null;
    await this.audio.close();
    if (this.lifecycle.status !== 'disposed') this.lifecycle.to('disposed');
  }

  get currentModule() {
    return this.module;
  }
}
