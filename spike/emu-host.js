// SPIKE-001 host page for the emulator iframe: load → measure fps → measure memory → remove → measure memory (A3, A7, A8).
const q = new URLSearchParams(location.search);
const $ = (id) => document.getElementById(id);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const log = (o) => { $('out').textContent += JSON.stringify(o) + '\n'; return o; };
let frame = null;
let started = null;

window.addEventListener('message', (e) => {
  if (e.origin !== location.origin || !e.data?.spike) return;
  log({ fromFrame: e.data });
  if (e.data.spike === 'game-start') started?.(e.data.ms);
});

async function memoryMB() {
  if (typeof performance.measureUserAgentSpecificMemory !== 'function' || !crossOriginIsolated) return null;
  const r = await performance.measureUserAgentSpecificMemory();
  return Math.round(r.bytes / 1048576);
}

function load() {
  const params = new URLSearchParams({ game: q.get('game') ?? 'animated-triangle.exe', threads: q.get('threads') ?? '0' });
  frame = Object.assign(document.createElement('iframe'), { src: `/emu.html?${params}`, width: 660, height: 500 });
  const startPromise = new Promise((res) => { started = res; });
  $('slot').appendChild(frame);
  return startPromise;
}

async function fps(seconds = 10) {
  const w = frame?.contentWindow?.__spike;
  if (!w) return { error: 'no frame' };
  const f0 = w.frameNum(); const t0 = performance.now();
  await sleep(seconds * 1000);
  const f1 = w.frameNum(); const t1 = performance.now();
  return { frames: f1 - f0, seconds: +((t1 - t0) / 1000).toFixed(2), fps: +(((f1 - f0) / ((t1 - t0) / 1000))).toFixed(2) };
}

function frameReport() {
  const w = frame?.contentWindow;
  const s = w?.__spike;
  if (!s) return { error: 'no frame' };
  const res = s.resources();
  return {
    gameStartMs: s.gameStartMs,
    crossOriginIsolatedInFrame: w.crossOriginIsolated === true,
    threadsRequested: w.EJS_threads,
    violations: s.violations,
    errors: s.errors,
    crossOriginRequests: res.filter((r) => r.origin !== location.origin),
    sameOriginRequests: res.filter((r) => r.origin === location.origin).map((r) => `${r.path} (${r.kb} KB)`),
    idbDatabases: null,
  };
}

function remove() {
  frame?.remove();
  frame = null;
  return { removed: true };
}

$('btn-load').onclick = async () => log({ gameStart: await load() });
$('btn-fps').onclick = async () => log({ fps: await fps() });
$('btn-mem').onclick = async () => log({ memoryMB: await memoryMB() });
$('btn-remove').onclick = () => log(remove());

if (q.has('auto')) {
  (async () => {
    const out = (window.__hostOut = { crossOriginIsolated, step: 'start' });
    out.memoryBeforeMB = await memoryMB();
    const timeout = sleep(Number(q.get('timeoutMs') ?? 60000)).then(() => 'timeout');
    out.gameStart = await Promise.race([load(), timeout]);
    if (out.gameStart !== 'timeout') {
      await sleep(3000);
      out.fps = await fps(Number(q.get('fpsSeconds') ?? 10));
    }
    out.memoryRunningMB = await memoryMB();
    out.frame = frameReport();
    try { out.frame.idbDatabases = (await frame.contentWindow.indexedDB.databases()).map((d) => d.name); } catch (e) { out.frame.idbDatabases = String(e); }
    document.documentElement.dataset.readyForShot = '1';
    await sleep(Number(q.get('shotWaitMs') ?? 0));
    out.step = 'removing'; remove();
    out.step = 'removed'; await sleep(2000);
    out.step = 'measuring-after-remove';
    out.memoryAfterRemoveMB = await Promise.race([memoryMB(), sleep(30000).then(() => 'measure timed out after 30 s')]);
    out.step = 'done';
    $('auto').textContent = JSON.stringify(out);
    document.documentElement.dataset.probeDone = '1';
  })();
}
