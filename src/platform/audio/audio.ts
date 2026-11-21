// Host-owned audio: one AudioContext, unlocked on a user gesture, suspended on pause/hidden, closed on exit.
// Effects are synthesized (no audio files), so there are no asset rights to track.

const EFFECTS: Record<string, { freq: number; to: number; ms: number; type: OscillatorType }> = {
  collect: { freq: 660, to: 990, ms: 90, type: 'square' },
  hit: { freq: 220, to: 60, ms: 260, type: 'sawtooth' },
  start: { freq: 440, to: 880, ms: 150, type: 'triangle' },
};

export class AudioService {
  private ctx: AudioContext | null = null;
  private muted = false;

  unlock() {
    this.ctx ??= new AudioContext();
    if (this.ctx.state === 'suspended') void this.ctx.resume();
  }

  async playEffect(id: string) {
    const fx = EFFECTS[id];
    if (!fx || this.muted || !this.ctx || this.ctx.state !== 'running') return;
    const t = this.ctx.currentTime;
    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    osc.type = fx.type;
    osc.frequency.setValueAtTime(fx.freq, t);
    osc.frequency.exponentialRampToValueAtTime(fx.to, t + fx.ms / 1000);
    gain.gain.setValueAtTime(0.08, t);
    gain.gain.exponentialRampToValueAtTime(0.0001, t + fx.ms / 1000);
    osc.connect(gain).connect(this.ctx.destination);
    osc.start(t);
    osc.stop(t + fx.ms / 1000);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }

  setMuted(m: boolean) {
    this.muted = m;
  }
  isMuted() {
    return this.muted;
  }
  suspend() {
    void this.ctx?.suspend();
  }
  resume() {
    if (this.ctx?.state === 'suspended') void this.ctx.resume();
  }
  async close() {
    const c = this.ctx;
    this.ctx = null;
    await c?.close().catch(() => undefined);
  }
  state() {
    return this.ctx?.state ?? 'closed';
  }
}
