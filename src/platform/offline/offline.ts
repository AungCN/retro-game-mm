import type { AvailabilityState } from '../../game-runtime/contracts/types';

// ---------- service worker ----------
type UpdateListener = (waiting: ServiceWorker | null) => void;
const updateListeners = new Set<UpdateListener>();
let waitingWorker: ServiceWorker | null = null;

export function onUpdateAvailable(l: UpdateListener) {
  updateListeners.add(l);
  l(waitingWorker);
  return () => {
    updateListeners.delete(l);
  };
}

function setWaiting(w: ServiceWorker | null) {
  waitingWorker = w;
  updateListeners.forEach((l) => l(w));
}

export async function registerServiceWorker(): Promise<void> {
  if (!('serviceWorker' in navigator) || !import.meta.env.PROD) return;
  const reg = await navigator.serviceWorker.register('/sw.js', { scope: '/' });
  if (reg.waiting && navigator.serviceWorker.controller) setWaiting(reg.waiting);
  reg.addEventListener('updatefound', () => {
    const sw = reg.installing;
    sw?.addEventListener('statechange', () => {
      if (sw.state === 'installed' && navigator.serviceWorker.controller) setWaiting(sw);
    });
  });
  let reloading = false;
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    if (!reloading) {
      reloading = true;
      location.reload();
    }
  });
}

export function applyUpdate() {
  waitingWorker?.postMessage('skip-waiting');
}

// ---------- connectivity ----------
export function onConnectivity(l: (online: boolean) => void) {
  const on = () => l(true);
  const off = () => l(false);
  window.addEventListener('online', on);
  window.addEventListener('offline', off);
  l(navigator.onLine);
  return () => {
    window.removeEventListener('online', on);
    window.removeEventListener('offline', off);
  };
}

// ---------- emulator offline package ----------
const MANIFEST_URL = '/emulator/precache-manifest.json';
const PREFIX = 'emulator-';

interface PackageManifest {
  version: string;
  urls: string[];
}

async function fetchManifest(): Promise<PackageManifest | null> {
  try {
    const res = await fetch(MANIFEST_URL, { cache: 'no-cache' });
    if (!res.ok) return null;
    const m = (await res.json()) as PackageManifest;
    if (typeof m.version !== 'string' || !/^[0-9a-f]{16}$/.test(m.version) || !Array.isArray(m.urls)) return null;
    if (!m.urls.every((u) => typeof u === 'string' && u.startsWith('/emulator/') && !u.includes('..'))) return null;
    return m;
  } catch {
    return null;
  }
}

export async function emulatorPackageState(): Promise<AvailabilityState> {
  if (!('caches' in window)) return 'UNSUPPORTED';
  const names = (await caches.keys()).filter((k) => k.startsWith(PREFIX));
  const manifest = await fetchManifest();
  if (!manifest) return names.length ? 'OFFLINE_READY' : 'NOT_INSTALLED'; // offline with no manifest: trust what is installed
  const current = `${PREFIX}${manifest.version}`;
  if (names.includes(current)) {
    const cache = await caches.open(current);
    const missing = (await Promise.all(manifest.urls.map((u) => cache.match(u)))).some((r) => !r);
    return missing ? 'OFFLINE_UNAVAILABLE' : 'OFFLINE_READY';
  }
  return names.length ? 'UPDATE_AVAILABLE' : 'NOT_INSTALLED';
}

/** Downloads the whole package into a new cache; removes older versions only after the new one is complete. */
export async function installEmulatorPackage(onProgress: (done: number, total: number) => void): Promise<void> {
  const manifest = await fetchManifest();
  if (!manifest) throw new Error('The emulator package could not be found. Are you online?');
  const name = `${PREFIX}${manifest.version}`;
  const cache = await caches.open(name);
  const urls = [...manifest.urls, MANIFEST_URL];
  try {
    let done = 0;
    for (const u of urls) {
      const res = await fetch(u, { cache: 'reload', credentials: 'same-origin' });
      if (!res.ok) throw new Error(`Download failed: ${u}`);
      await cache.put(u, res);
      onProgress(++done, urls.length);
    }
  } catch (err) {
    await caches.delete(name); // never leave a partial package that could look installed
    throw err;
  }
  for (const k of await caches.keys()) if (k.startsWith(PREFIX) && k !== name) await caches.delete(k);
}

export async function removeEmulatorPackage(): Promise<void> {
  for (const k of await caches.keys()) if (k.startsWith(PREFIX)) await caches.delete(k);
}
