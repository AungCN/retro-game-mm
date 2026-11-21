import { LANES, PLAYER_Y, type GameState } from './logic';

export interface RenderOptions {
  reducedMotion: boolean;
  paused: boolean;
  highScore: number;
}

/** Draws the field into a canvas sized to its container (any aspect ratio). Shapes only; no image assets. */
export function render(ctx: CanvasRenderingContext2D, s: GameState, opts: RenderOptions) {
  const { width: w, height: h } = ctx.canvas;
  const laneW = w / LANES;
  ctx.fillStyle = '#0b0820';
  ctx.fillRect(0, 0, w, h);

  // Background stars: static when reduced motion is requested.
  ctx.fillStyle = '#2f2a5a';
  for (let i = 0; i < 40; i++) {
    const x = ((i * 97) % 100) / 100;
    const base = ((i * 61) % 100) / 100;
    const y = opts.reducedMotion ? base : (base + s.elapsed * 0.05 * (1 + (i % 3))) % 1;
    ctx.fillRect(x * w, y * h, 2, 2);
  }

  ctx.strokeStyle = '#1d1840';
  ctx.lineWidth = 1;
  for (let i = 1; i < LANES; i++) {
    ctx.beginPath();
    ctx.moveTo(i * laneW, 0);
    ctx.lineTo(i * laneW, h);
    ctx.stroke();
  }

  const size = Math.min(laneW, h) * 0.32;
  for (const o of s.objects) {
    const cx = (o.lane + 0.5) * laneW;
    const cy = o.y * h;
    if (o.kind === 'star') {
      ctx.fillStyle = '#ffd34d';
      ctx.beginPath();
      for (let k = 0; k < 10; k++) {
        const r = k % 2 === 0 ? size * 0.6 : size * 0.25;
        const a = (Math.PI / 5) * k - Math.PI / 2;
        ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a));
      }
      ctx.closePath();
      ctx.fill();
    } else {
      ctx.fillStyle = '#ff6b5a';
      ctx.beginPath();
      ctx.arc(cx, cy, size * 0.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.fillStyle = 'rgba(255,107,90,0.35)';
      ctx.fillRect(cx - size * 0.15, cy - size * 1.4, size * 0.3, size * 0.9);
    }
  }

  // Courier ship (blinks while invulnerable).
  if (s.invulnerableFor === 0 || Math.floor(s.invulnerableFor * 10) % 2 === 0) {
    const px = (s.lane + 0.5) * laneW;
    const py = PLAYER_Y * h;
    ctx.fillStyle = '#5ad1ff';
    ctx.beginPath();
    ctx.moveTo(px, py - size * 0.6);
    ctx.lineTo(px + size * 0.5, py + size * 0.5);
    ctx.lineTo(px - size * 0.5, py + size * 0.5);
    ctx.closePath();
    ctx.fill();
  }

  ctx.fillStyle = '#ffffff';
  ctx.font = `${Math.max(14, Math.round(h * 0.035))}px system-ui, sans-serif`;
  ctx.textBaseline = 'top';
  ctx.fillText(`Score ${s.score}   Lives ${s.lives}   Best ${Math.max(opts.highScore, s.score)}`, 12, 10);

  if (opts.paused || s.over) {
    ctx.fillStyle = 'rgba(0,0,0,0.55)';
    ctx.fillRect(0, 0, w, h);
    ctx.fillStyle = '#ffffff';
    ctx.textAlign = 'center';
    ctx.fillText(s.over ? 'Game over — press Start or Enter to play again' : 'Paused', w / 2, h / 2);
    ctx.textAlign = 'start';
  }
}
