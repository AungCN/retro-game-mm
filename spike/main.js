// SPIKE-001 diagnostics. Throwaway; never merged. Records measurements only — never file contents.
const STORE_KEY = 'spike001-results';
const CHUNK = 4 * 1024 * 1024;
const $ = (id) => document.getElementById(id);

function loadResults() {
  try { return JSON.parse(localStorage.getItem(STORE_KEY)) ?? []; } catch { return []; }
}
function record(id, data) {
  const entry = { id, at: new Date().toISOString(), browser: browserLabel(), data };
  const all = loadResults();
  all.push(entry);
  localStorage.setItem(STORE_KEY, JSON.stringify(all));
  $('log').textContent = JSON.stringify(all.slice(-12), null, 2);
  return entry;
}
function browserLabel() {
  const ua = navigator.userAgent;
  if (/Edg\//.test(ua)) return 'edge';
  if (/Chrome\//.test(ua)) return 'chrome';
  if (/Firefox\//.test(ua)) return 'firefox';
  if (/Safari\//.test(ua)) return 'safari';
  return 'other';
}
const errInfo = (e) => ({ error: e?.name ?? 'Error', message: String(e?.message ?? e) });
const withTimeout = (p, ms, label) => Promise.race([p, new Promise((_, rej) => setTimeout(() => rej(new Error(`${label} timed out after ${ms} ms`)), ms))]);
document.documentElement.dataset.probeStart = '1';

// ---------- A1: isolation ----------
async function isolationCheck(label = 'A1-isolation') {
  const out = {
    url: location.href,
    isSecureContext,
    crossOriginIsolated: self.crossOriginIsolated === true,
    swControlled: Boolean(navigator.serviceWorker?.controller),
    online: navigator.onLine,
    userAgent: navigator.userAgent,
    hardwareConcurrency: navigator.hardwareConcurrency,
    webgpu: 'gpu' in navigator,
    measureMemoryApi: typeof performance.measureUserAgentSpecificMemory === 'function',
    fileSystemAccessPickers: 'showOpenFilePicker' in self,
    opfs: Boolean(navigator.storage?.getDirectory),
  };
  try { new SharedArrayBuffer(16); out.sharedArrayBuffer = true; } catch (e) { out.sharedArrayBuffer = false; out.sabError = String(e); }
  try { new WebAssembly.Memory({ initial: 1, maximum: 1, shared: true }); out.sharedWasmMemory = true; } catch (e) { out.sharedWasmMemory = false; }
  if ('gpu' in navigator) {
    try { out.webgpuAdapter = Boolean(await withTimeout(navigator.gpu.requestAdapter(), 3000, 'requestAdapter')); } catch (e) { out.webgpuAdapter = false; out.webgpuAdapterError = String(e.message ?? e); }
  }
  try {
    const res = await withTimeout(fetch(location.href, { cache: 'no-store' }), 5000, 'header fetch');
    out.responseHeaders = {
      coop: res.headers.get('cross-origin-opener-policy'),
      coep: res.headers.get('cross-origin-embedder-policy'),
      corp: res.headers.get('cross-origin-resource-policy'),
    };
  } catch (e) {
    out.responseHeaders = { unavailable: errInfo(e) };
  }
  return record(label, out);
}

// ---------- A2: service worker ----------
async function swRegister() {
  if (!('serviceWorker' in navigator)) return record('A2-sw-register', { supported: false });
  try {
    const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
    await navigator.serviceWorker.ready;
    return record('A2-sw-register', { supported: true, scope: reg.scope, controlledNow: Boolean(navigator.serviceWorker.controller), hint: 'Reload once so the page is controlled and cached, then go offline.' });
  } catch (e) { return record('A2-sw-register', errInfo(e)); }
}
async function swStatus() {
  const regs = navigator.serviceWorker ? await navigator.serviceWorker.getRegistrations() : [];
  const keys = await caches.keys().catch(() => []);
  let cached = 0;
  for (const k of keys) cached += (await (await caches.open(k)).keys()).length;
  return record('A2-sw-status', { registrations: regs.length, controlled: Boolean(navigator.serviceWorker?.controller), caches: keys, cachedRequests: cached, crossOriginIsolated: self.crossOriginIsolated === true, online: navigator.onLine });
}
async function swUnregister() {
  const regs = navigator.serviceWorker ? await navigator.serviceWorker.getRegistrations() : [];
  for (const r of regs) await r.unregister();
  for (const k of await caches.keys()) await caches.delete(k);
  return record('A2-sw-unregister', { unregistered: regs.length });
}

// ---------- IndexedDB handle store ----------
function idb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open('spike001', 1);
    req.onupgradeneeded = () => req.result.createObjectStore('handles');
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}
async function idbPut(key, value) {
  const db = await idb();
  await new Promise((res, rej) => { const tx = db.transaction('handles', 'readwrite'); tx.objectStore('handles').put(value, key); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
}
async function idbGet(key) {
  const db = await idb();
  return new Promise((res, rej) => { const r = db.transaction('handles').objectStore('handles').get(key); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
}

// ---------- chunked read ----------
async function chunkedRead(blob) {
  const t0 = performance.now();
  let bytes = 0;
  for (let off = 0; off < blob.size; off += CHUNK) {
    const buf = await blob.slice(off, Math.min(off + CHUNK, blob.size)).arrayBuffer();
    bytes += buf.byteLength;
  }
  const ms = performance.now() - t0;
  return { bytes, ms: Math.round(ms), mbPerSec: Math.round(bytes / 1048576 / (ms / 1000)) };
}
const fileMeta = (f) => ({ name: f.name, sizeBytes: f.size, sizeMB: +(f.size / 1048576).toFixed(1) });

// ---------- A5: File System Access ----------
async function linkFile() {
  if (!('showOpenFilePicker' in self)) return record('A5-link', { supported: false });
  try {
    const [handle] = await showOpenFilePicker({ multiple: false });
    await idbPut('disc', handle);
    const file = await handle.getFile();
    return record('A5-link', { supported: true, ...fileMeta(file), permission: await handle.queryPermission({ mode: 'read' }) });
  } catch (e) { return record('A5-link', errInfo(e)); }
}
async function checkHandle() {
  try {
    const handle = await idbGet('disc');
    if (!handle) return record('A5-check-handle', { storedHandle: false });
    const permission = await handle.queryPermission({ mode: 'read' });
    const out = { storedHandle: true, name: handle.name, permission };
    if (permission === 'granted') {
      try { const f = await handle.getFile(); out.readable = true; out.sizeBytes = f.size; await f.slice(0, 65536).arrayBuffer(); }
      catch (e) { out.readable = false; out.readError = errInfo(e); }
    }
    return record('A5-check-handle', out);
  } catch (e) { return record('A5-check-handle', errInfo(e)); }
}
async function regrant() {
  try {
    const handle = await idbGet('disc');
    if (!handle) return record('A5-regrant', { storedHandle: false });
    const before = await handle.queryPermission({ mode: 'read' });
    const after = await handle.requestPermission({ mode: 'read' });
    return record('A5-regrant', { before, after });
  } catch (e) { return record('A5-regrant', errInfo(e)); }
}
async function handleRead() {
  try {
    const handle = await idbGet('disc');
    if (!handle) return record('A5-handle-read', { storedHandle: false });
    const f = await handle.getFile();
    return record('A5-handle-read', { ...fileMeta(f), ...(await chunkedRead(f)) });
  } catch (e) { return record('A5-handle-read', errInfo(e)); }
}

// ---------- A4/A5: session file, whole-file load, OPFS ----------
const sessionFile = () => $('input-session').files?.[0];
async function sessionRead() {
  const f = sessionFile();
  if (!f) return record('A5-session-read', { file: false });
  return record('A5-session-read', { ...fileMeta(f), ...(await chunkedRead(f)) });
}
async function wholeFile() {
  const f = sessionFile();
  if (!f) return record('A4-whole-file', { file: false });
  const out = { ...fileMeta(f) };
  const mem = async () => (typeof performance.measureUserAgentSpecificMemory === 'function' && crossOriginIsolated)
    ? Math.round((await performance.measureUserAgentSpecificMemory()).bytes / 1048576) : null;
  out.memoryBeforeMB = await mem().catch(() => null);
  const t0 = performance.now();
  try {
    let buf = await f.arrayBuffer();
    out.loadMs = Math.round(performance.now() - t0);
    out.loadedBytes = buf.byteLength;
    out.memoryWhileHeldMB = await mem().catch(() => null);
    buf = null;
  } catch (e) { out.loadError = errInfo(e); out.loadMs = Math.round(performance.now() - t0); }
  return record('A4-whole-file', out);
}
function opfsWorker(msg, transfer = []) {
  return new Promise((resolve) => {
    const w = new Worker(new URL('./opfs-worker.js', import.meta.url), { type: 'module' });
    w.onmessage = (e) => { resolve(e.data); w.terminate(); };
    w.onerror = (e) => { resolve({ error: 'WorkerError', message: e.message }); w.terminate(); };
    w.postMessage(msg, transfer);
  });
}
async function opfsCopy() {
  const f = sessionFile();
  if (!f) return record('A5-opfs-copy', { file: false });
  if (!navigator.storage?.getDirectory) return record('A5-opfs-copy', { supported: false });
  return record('A5-opfs-copy', { ...fileMeta(f), ...(await opfsWorker({ op: 'copy', file: f })) });
}
const opfsCheck = async () => record('A5-opfs-check', await opfsWorker({ op: 'stat' }));
const opfsRead = async () => record('A5-opfs-read', await opfsWorker({ op: 'read' }));
const opfsDelete = async () => record('A5-opfs-delete', await opfsWorker({ op: 'delete' }));

// ---------- A6: storage ----------
async function storageCheck() {
  const out = {};
  try { out.persisted = await navigator.storage.persisted(); } catch (e) { out.persisted = errInfo(e); }
  try { const est = await navigator.storage.estimate(); out.usageMB = Math.round(est.usage / 1048576); out.quotaMB = Math.round(est.quota / 1048576); } catch (e) { out.estimate = errInfo(e); }
  return record('A6-storage', out);
}
async function requestPersist() {
  try { return record('A6-persist', { granted: await navigator.storage.persist() }); } catch (e) { return record('A6-persist', errInfo(e)); }
}

// ---------- export ----------
function exportResults() {
  const blob = new Blob([JSON.stringify({ spike: 'SPIKE-001', exportedAt: new Date().toISOString(), results: loadResults() }, null, 2)], { type: 'application/json' });
  const a = Object.assign(document.createElement('a'), { href: URL.createObjectURL(blob), download: `spike001-${browserLabel()}-${Date.now()}.json` });
  a.click();
  URL.revokeObjectURL(a.href);
}

const bind = (id, fn) => $(id).addEventListener('click', fn);
bind('btn-isolation', () => isolationCheck());
bind('btn-sw-register', swRegister);
bind('btn-sw-status', swStatus);
bind('btn-sw-unregister', swUnregister);
bind('btn-link', linkFile);
bind('btn-check-handle', checkHandle);
bind('btn-regrant', regrant);
bind('btn-handle-read', handleRead);
bind('btn-session-read', sessionRead);
bind('btn-session-whole', wholeFile);
bind('btn-opfs-copy', opfsCopy);
bind('btn-opfs-check', opfsCheck);
bind('btn-opfs-read', opfsRead);
bind('btn-opfs-delete', opfsDelete);
bind('btn-storage', storageCheck);
bind('btn-persist', requestPersist);
bind('btn-export', exportResults);
bind('btn-clear', () => { localStorage.removeItem(STORE_KEY); $('log').textContent = ''; });

// Automatic probe on load (also read by headless Chrome via --dump-dom).
(async () => {
  const auto = { isolation: (await isolationCheck('A1-isolation-auto')).data, storage: (await storageCheck()).data };
  if (new URLSearchParams(location.search).has('autosw')) auto.sw = (await swRegister()).data;
  auto.swStatus = (await swStatus()).data;
  $('auto').textContent = JSON.stringify(auto);
  document.documentElement.dataset.probeDone = '1';
})();
