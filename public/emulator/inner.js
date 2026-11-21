(function () {
  'use strict';
  // Runs inside the sandboxed srcdoc frame (opaque origin). Allowed by its SHA-256 hash in the emulator CSP;
  // any edit to this file changes the hash, which vite.config.ts recomputes. Accepts messages only from its parent.
  var MAX_SAVE = 16 * 1024 * 1024;
  var parentWin = window.parent;
  var notice = document.getElementById('notice');
  var booted = false;

  function send(msg) { parentWin.postMessage(msg, '*'); }
  function gm() { return window.EJS_emulator && window.EJS_emulator.gameManager; }
  function fail(message) { send({ t: 'error', message: String(message).slice(0, 300) }); }

  function boot(m) {
    if (booted) return;
    booted = true;
    if (!(m.game instanceof File) || !m.assets) return fail('bad boot message');
    var paths = {};
    Object.keys(m.assets).forEach(function (k) {
      if (m.assets[k] instanceof Blob && /^[A-Za-z0-9_.-]+$/.test(k)) paths[k] = URL.createObjectURL(m.assets[k]);
    });
    if (!paths['loader.js']) return fail('loader missing');
    window.EJS_paths = paths;
    window.EJS_pathtodata = '/emulator/ejs/';
    window.EJS_player = '#game';
    window.EJS_core = 'pcsx_rearmed';
    window.EJS_gameUrl = m.game;
    window.EJS_gameName = 'disc';
    if (m.bios instanceof File) window.EJS_biosUrl = m.bios;
    window.EJS_language = 'en-US';
    window.EJS_disableAutoLang = false;
    window.EJS_startOnLoaded = false;
    window.EJS_disableDatabases = true;
    window.EJS_disableLocalStorage = true;
    window.EJS_threads = false;
    window.EJS_volume = typeof m.volume === 'number' ? Math.min(1, Math.max(0, m.volume)) : 0.6;
    window.EJS_Buttons = {
      playPause: false, restart: false, mute: false, settings: false, fullscreen: false, saveState: false, loadState: false,
      screenRecord: false, gamepad: false, cheat: false, volume: false, saveSavFiles: false, loadSavFiles: false,
      quickSave: false, quickLoad: false, screenshot: false, cacheManager: false, exitEmulation: false, netplay: false,
      diskButton: false, contextMenu: false, rightClick: false
    };
    window.EJS_onGameStart = function () {
      notice.textContent = '';
      var n = 1;
      try { n = gm().getDiskCount() || 1; } catch (e) { n = 1; }
      send({ t: 'started', discCount: n });
    };
    notice.textContent = 'Press Start to begin.';
    var s = document.createElement('script');
    s.src = paths['loader.js'];
    s.onerror = function () { fail('emulator loader failed'); };
    document.body.appendChild(s);
  }

  function handle(m) {
    var g = gm();
    try {
      switch (m.t) {
        case 'pause': if (g) { g.toggleMainLoop(0); window.EJS_emulator.paused = true; } break;
        case 'resume': if (g) { g.toggleMainLoop(1); window.EJS_emulator.paused = false; } break;
        case 'mute': if (window.EJS_emulator) window.EJS_emulator.setVolume(m.muted ? 0 : 0.6); break;
        case 'get-save':
          var d = g ? g.getSaveFile() : null;
          send({ t: 'save', data: d ? new Uint8Array(d) : null });
          break;
        case 'put-save':
          if (g && m.data instanceof Uint8Array && m.data.byteLength <= MAX_SAVE) { g.FS.writeFile(g.getSaveFilePath(), m.data); g.loadSaveFiles(); }
          break;
        case 'save-state': if (g) send({ t: 'state', data: g.getState() }); break;
        case 'load-state': if (g && m.data instanceof Uint8Array) g.loadState(m.data); break;
        case 'set-disc': if (g && Number.isInteger(m.index) && m.index >= 0 && m.index < g.getDiskCount()) g.setCurrentDisk(m.index); break;
      }
    } catch (err) {
      if (m.t === 'get-save') send({ t: 'save', data: null });
      fail(m.t + ' failed');
    }
  }

  window.addEventListener('message', function (e) {
    if (e.source !== parentWin) return;
    var m = e.data;
    if (!m || typeof m.t !== 'string') return;
    if (m.t === 'boot') boot(m); else handle(m);
  });
  send({ t: 'inner-ready' });
})();
