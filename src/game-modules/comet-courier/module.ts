import type { GameHostServices, GameModule, GameModuleFactory, NormalizedInput } from '../../game-runtime/contracts/types';
import { assertManifest } from '../../domain/games/manifest';
import manifestJson from './manifest.json';
import { newGame, step, type GameState } from './logic';
import { render } from './render';

export const manifest = assertManifest(manifestJson);
const SAVE_SCHEMA = 1;
interface CometSave {
  highScore: number;
}

export class CometCourier implements GameModule {
  private services!: GameHostServices;
  private canvas: HTMLCanvasElement | null = null;
  private ctx: CanvasRenderingContext2D | null = null;
  private state: GameState = newGame(Date.now());
  private raf = 0;
  private last = 0;
  private running = false;
  private highScore = 0;
  private pending = { left: false, right: false };
  private unsubscribe: (() => void) | null = null;
  private resizeObserver: ResizeObserver | null = null;
  private reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;

  async load(container: HTMLElement, services: GameHostServices) {
    this.services = services;
    const canvas = document.createElement('canvas');
    canvas.setAttribute('role', 'img');
    canvas.setAttribute('aria-label', 'Comet Courier play field');
    canvas.className = 'game-canvas';
    container.appendChild(canvas);
    const ctx = canvas.getContext('2d');
    if (!ctx) throw new Error('Canvas 2D is not available');
    this.canvas = canvas;
    this.ctx = ctx;
    this.resizeObserver = new ResizeObserver(() => this.resize());
    this.resizeObserver.observe(container);
    this.resize();
    this.unsubscribe = services.input.subscribe(this.onInput);
    await this.restore();
    this.draw();
    services.lifecycle.reportStatus('ready');
  }

  private resize() {
    if (!this.canvas) return;
    const rect = this.canvas.parentElement?.getBoundingClientRect();
    const dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.canvas.width = Math.max(1, Math.round((rect?.width ?? 320) * dpr));
    this.canvas.height = Math.max(1, Math.round((rect?.height ?? 480) * dpr));
    this.draw();
  }

  private onInput = (e: NormalizedInput) => {
    if (e.kind !== 'button' || !e.pressed) return;
    if (e.control === 'left') this.pending.left = true;
    if (e.control === 'right') this.pending.right = true;
    if (e.control === 'start' || e.control === 'action') {
      if (this.state.over) {
        this.state = newGame(Date.now());
        void this.services.audio.playEffect('start');
        if (!this.running) void this.start();
      } else if (e.control === 'start') this.services.lifecycle.requestPause();
    }
  };

  private frame = (t: number) => {
    if (!this.running) return;
    const dt = this.last ? (t - this.last) / 1000 : 0;
    this.last = t;
    const { state, events } = step(this.state, dt, { moveLeft: this.pending.left, moveRight: this.pending.right });
    this.pending = { left: false, right: false };
    this.state = state;
    for (const ev of events) {
      if (ev === 'collect') void this.services.audio.playEffect('collect');
      if (ev === 'hit') void this.services.audio.playEffect('hit');
      if (ev === 'game-over') {
        this.highScore = Math.max(this.highScore, state.score);
        void this.save();
      }
    }
    this.draw();
    this.raf = requestAnimationFrame(this.frame);
  };

  private draw() {
    if (this.ctx) render(this.ctx, this.state, { reducedMotion: this.reducedMotion, paused: !this.running && !this.state.over, highScore: this.highScore });
  }

  async start() {
    if (this.running) return;
    this.running = true;
    this.last = 0;
    this.raf = requestAnimationFrame(this.frame);
    this.services.lifecycle.reportStatus('running');
  }

  async pause() {
    if (!this.running) return;
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.draw();
    this.services.lifecycle.reportStatus('paused');
  }

  async resume() {
    await this.start();
  }

  async save() {
    try {
      await this.services.storage.writeSave<CometSave>(manifest.id, { highScore: this.highScore }, SAVE_SCHEMA);
    } catch (err) {
      this.services.lifecycle.reportError({ kind: 'save', message: 'Could not save your best score (storage unavailable or full).', recoverable: true });
      console.warn('save failed', err);
    }
  }

  async restore() {
    try {
      const saved = await this.services.storage.readSave<CometSave>(manifest.id);
      const hs = saved?.highScore;
      this.highScore = typeof hs === 'number' && Number.isFinite(hs) && hs >= 0 ? Math.floor(hs) : 0;
    } catch {
      this.highScore = 0; // fail safe: never block play on a bad or missing save
    }
  }

  async destroy() {
    this.running = false;
    cancelAnimationFrame(this.raf);
    this.unsubscribe?.();
    this.unsubscribe = null;
    this.resizeObserver?.disconnect();
    this.resizeObserver = null;
    this.canvas?.remove();
    this.canvas = null;
    this.ctx = null;
    this.services?.lifecycle.reportStatus('disposed');
  }

  /** Test hook: true when no frame loop or input subscription remains. */
  isIdle() {
    return !this.running && this.unsubscribe === null;
  }
}

export const cometCourier: GameModuleFactory = { manifest, create: () => new CometCourier() };
