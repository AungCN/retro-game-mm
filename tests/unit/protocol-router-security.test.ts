import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { MAX_SAVE_BYTES, parseFrameMessage, PROTOCOL_VERSION } from '../../src/game-runtime/adapters/wasm-libretro/protocol';
import { parseRoute } from '../../src/app/router';
import { classifyTier } from '../../src/platform/capabilities/detect';
import { emulatorCsp, headersFor, shellCsp, staticHostHeadersFile } from '../../config/security-headers';

const NONCE = 'a'.repeat(32);
const env = (msg: unknown, nonce = NONCE, v: number = PROTOCOL_VERSION) => ({ v, nonce, msg });

describe('frame protocol', () => {
  it('accepts well-formed messages', () => {
    expect(parseFrameMessage(env({ t: 'ready' }), NONCE)).toEqual({ t: 'ready' });
    expect(parseFrameMessage(env({ t: 'started', discCount: 2 }), NONCE)).toEqual({ t: 'started', discCount: 2 });
    expect(parseFrameMessage(env({ t: 'save', data: null }), NONCE)).toEqual({ t: 'save', data: null });
  });
  it('drops wrong nonce, wrong version, unknown types and bad shapes', () => {
    expect(parseFrameMessage(env({ t: 'ready' }, 'b'.repeat(32)), NONCE)).toBeNull();
    expect(parseFrameMessage(env({ t: 'ready' }, NONCE, 2), NONCE)).toBeNull();
    expect(parseFrameMessage(env({ t: 'eval', code: 'x' }), NONCE)).toBeNull();
    expect(parseFrameMessage(env({ t: 'started', discCount: 999 }), NONCE)).toBeNull();
    expect(parseFrameMessage(env({ t: 'save', data: 'not bytes' }), NONCE)).toBeNull();
    expect(parseFrameMessage('string', NONCE)).toBeNull();
    expect(parseFrameMessage(null, NONCE)).toBeNull();
  });
  it('drops oversized saves and truncates error text', () => {
    expect(parseFrameMessage(env({ t: 'save', data: new Uint8Array(MAX_SAVE_BYTES + 1) }), NONCE)).toBeNull();
    const m = parseFrameMessage(env({ t: 'error', message: 'x'.repeat(5000) }), NONCE);
    expect(m && m.t === 'error' && m.message.length).toBe(300);
  });
});

describe('router', () => {
  it('parses known routes', () => {
    expect(parseRoute('')).toEqual({ name: 'catalogue' });
    expect(parseRoute('#/game/comet-courier')).toEqual({ name: 'game', id: 'comet-courier' });
    expect(parseRoute('#/play/ps1-player/123e4567-e89b-12d3-a456-426614174000')).toEqual({ name: 'play', id: 'ps1-player', discId: '123e4567-e89b-12d3-a456-426614174000' });
  });
  it.each(['#/game/../settings', '#/game/Comet', '#/game/x<script>', '#/play/ps1-player/not-a-uuid', '#javascript:alert(1)', '#/game/'])('treats %j as not found', (h) => {
    expect(parseRoute(h)).toEqual({ name: 'not-found' });
  });
});

describe('tier classification', () => {
  const base = { userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) Chrome/158', maxTouchPoints: 0, platform: 'MacIntel', hasFilePickers: true };
  it('desktop Chromium with pickers is tier-1', () => expect(classifyTier(base)).toBe('tier-1'));
  it('desktop without pickers is tier-2', () => expect(classifyTier({ ...base, hasFilePickers: false })).toBe('tier-2'));
  it('phones and iPads (even iPad desktop mode) are mobile', () => {
    expect(classifyTier({ ...base, userAgent: 'Mozilla/5.0 (Linux; Android 15) Mobile' })).toBe('mobile');
    expect(classifyTier({ ...base, maxTouchPoints: 5, hasFilePickers: false })).toBe('mobile');
    expect(classifyTier({ ...base, mobileHint: true })).toBe('mobile');
  });
});

describe('security headers', () => {
  const hash = createHash('sha256').update(readFileSync('public/emulator/inner.js')).digest('base64');
  it('keeps the shell CSP strict', () => {
    const c = shellCsp(false);
    expect(c).not.toMatch(/unsafe-(eval|inline)/);
    expect(c).toContain("frame-ancestors 'none'");
    expect(c).toContain("object-src 'none'");
    expect(c).toContain("connect-src 'self'");
    expect(c).not.toMatch(/https?:/);
  });
  it('limits emulator relaxations to the frame document and allows the bootstrap only by hash', () => {
    const c = emulatorCsp(hash);
    expect(c).toContain(`'sha256-${hash}'`);
    expect(c).toMatch(/script-src [^;]*'unsafe-eval'/);
    expect(c).not.toMatch(/script-src [^;]*'unsafe-inline'/);
    expect(c).toContain("connect-src 'self' blob:");
    expect(c).toContain("frame-ancestors 'self'");
    expect(headersFor('/emulator/frame.html', false, hash)['Content-Security-Policy']).toBe(c);
    expect(headersFor('/', false, hash)['Content-Security-Policy']).toBe(shellCsp(false));
    expect(headersFor('/emulator/ejs/loader.js', false, hash)['Content-Security-Policy']).toBe(shellCsp(false));
  });
  it('sends isolation headers everywhere', () => {
    for (const p of ['/', '/assets/x.js', '/emulator/frame.html', '/emulator/ejs/cores/x.data']) {
      const h = headersFor(p, false, hash);
      expect(h['Cross-Origin-Opener-Policy']).toBe('same-origin');
      expect(h['Cross-Origin-Embedder-Policy']).toBe('require-corp');
      expect(h['Cross-Origin-Resource-Policy']).toBe('same-origin');
      expect(h['X-Content-Type-Options']).toBe('nosniff');
    }
  });
  it('detaches the shell CSP and Permissions-Policy before setting the emulator ones in _headers', () => {
    const block = staticHostHeadersFile(hash).split('/emulator/frame.html\n')[1]!;
    const lines = block.split('\n').map((l) => l.trim());
    expect(lines.indexOf('! Content-Security-Policy')).toBeGreaterThanOrEqual(0);
    expect(lines.indexOf('! Permissions-Policy')).toBeGreaterThanOrEqual(0);
    const csp = lines.findIndex((l) => l.startsWith('Content-Security-Policy:'));
    const pp = lines.findIndex((l) => l.startsWith('Permissions-Policy:'));
    expect(csp).toBeGreaterThan(lines.indexOf('! Content-Security-Policy'));
    expect(pp).toBeGreaterThan(lines.indexOf('! Permissions-Policy'));
    expect(lines[csp]).toContain(`'sha256-${hash}'`);
    expect(lines[pp]).toContain('camera=()');
  });
});
