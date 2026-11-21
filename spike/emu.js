// SPIKE-001 emulator iframe: configures EmulatorJS from the query string and records what happens.
// Records only measurements, CSP violations, and request URLs — never game data.
const q = new URLSearchParams(location.search);
const spike = (window.__spike = { startedAt: performance.now(), events: [], violations: [], gameStartMs: null, errors: [] });
const note = (type, data = {}) => { spike.events.push({ type, t: Math.round(performance.now()), ...data }); parent.postMessage({ spike: type, ...data }, location.origin); };

document.addEventListener('securitypolicyviolation', (e) => {
  spike.violations.push({ directive: e.effectiveDirective, blocked: e.blockedURI, source: e.sourceFile ? e.sourceFile.split('/').slice(-2).join('/') : null, line: e.lineNumber, sample: e.sample?.slice(0, 60) });
});
window.addEventListener('error', (e) => spike.errors.push(String(e.message).slice(0, 200)));
window.addEventListener('unhandledrejection', (e) => spike.errors.push(String(e.reason?.message ?? e.reason).slice(0, 200)));

window.EJS_player = '#game';
window.EJS_core = 'pcsx_rearmed';
window.EJS_pathtodata = '/ejs/';
window.EJS_gameUrl = `/fixtures-local/${q.get('game') ?? 'animated-triangle.exe'}`;
window.EJS_biosUrl = '';
window.EJS_startOnLoaded = true;
window.EJS_disableDatabases = true; // never let EmulatorJS cache user files in its own IndexedDB
window.EJS_threads = q.get('threads') === '1';
window.EJS_volume = 0;
window.EJS_onGameStart = () => { spike.gameStartMs = Math.round(performance.now() - spike.startedAt); note('game-start', { ms: spike.gameStartMs }); };

spike.frameNum = () => { try { return window.EJS_emulator.gameManager.functions.getFrameNum(); } catch { return null; } };
spike.resources = () => performance.getEntriesByType('resource').map((r) => ({ origin: new URL(r.name).origin, path: new URL(r.name).pathname.split('/').slice(-2).join('/'), kb: Math.round((r.transferSize || r.encodedBodySize || 0) / 1024) }));

const s = document.createElement('script');
s.src = '/ejs/loader.js';
s.onerror = () => note('loader-error');
document.body.appendChild(s);
note('configured', { game: window.EJS_gameUrl, threads: window.EJS_threads });
