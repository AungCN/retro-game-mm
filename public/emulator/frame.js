// Outer emulator frame (same-origin, controlled by the service worker, served with the emulator CSP).
// It fetches the emulator files (from the offline cache when offline), then runs EmulatorJS inside an inner
// sandboxed srcdoc iframe with an opaque origin, which cannot reach the app's DOM, storage, or saves.
// Messages: app ⇄ this frame use the app origin + session nonce; this frame ⇄ inner frame use event.source checks.
(function () {
  'use strict';
  var PROTOCOL = 1;
  var nonce = location.hash.slice(1);
  var appOrigin = location.origin;
  var notice = document.getElementById('notice');
  var ASSETS = {
    'loader.js': '/emulator/ejs/loader.js',
    'emulator.min.js': '/emulator/ejs/emulator.min.js',
    'emulator.min.css': '/emulator/ejs/emulator.min.css',
    'pcsx_rearmed-wasm.data': '/emulator/ejs/cores/pcsx_rearmed-wasm.data',
    'pcsx_rearmed-legacy-wasm.data': '/emulator/ejs/cores/pcsx_rearmed-legacy-wasm.data',
    'pcsx_rearmed.json': '/emulator/ejs/cores/reports/pcsx_rearmed.json',
    'extract7z.js': '/emulator/ejs/compression/extract7z.js',
    'extractzip.js': '/emulator/ejs/compression/extractzip.js'
  };
  var TO_INNER = ['pause', 'resume', 'mute', 'get-save', 'put-save', 'save-state', 'load-state', 'set-disc'];
  var TO_APP = ['started', 'save', 'state', 'error'];
  var INNER_CSS = 'html,body{margin:0;height:100%;background:#000;color:#fff;font:15px/1.4 system-ui,sans-serif;overflow:hidden}' +
    '#game{position:absolute;inset:0}.notice{position:absolute;left:0;right:0;bottom:8px;text-align:center;margin:0;opacity:.8;pointer-events:none}' +
    '.notice:empty{display:none}.ejs_menu_bar,.ejs_context_menu{display:none!important}';

  if (!/^[0-9a-f]{32}$/.test(nonce) || window.parent === window) {
    notice.textContent = 'This page only runs inside Retro Arcade.';
    return;
  }

  var inner = null;
  var innerReady = null;
  var booting = false;

  function toApp(msg) {
    window.parent.postMessage({ v: PROTOCOL, nonce: nonce, msg: msg }, appOrigin);
  }
  function toInner(msg) {
    // The inner frame has an opaque origin, so '*' is the only possible target; it is our own child element.
    if (inner && inner.contentWindow) inner.contentWindow.postMessage(msg, '*');
  }

  function fetchBlob(url) {
    return fetch(url, { credentials: 'same-origin' }).then(function (r) {
      if (!r.ok) throw new Error('Emulator file missing: ' + url + ' (run npm run fetch:emulator)');
      return r.blob();
    });
  }

  function boot(m) {
    if (booting) return;
    booting = true;
    notice.textContent = 'Loading the PS1 player…';
    var names = Object.keys(ASSETS);
    Promise.all([
      Promise.all(names.map(function (n) { return fetchBlob(ASSETS[n]); })),
      fetch('/emulator/inner.js', { credentials: 'same-origin' }).then(function (r) {
        if (!r.ok) throw new Error('Emulator bootstrap missing');
        return r.text();
      })
    ]).then(function (res) {
      var assets = {};
      names.forEach(function (n, i) { assets[n] = res[0][i]; });
      var bootstrap = res[1];
      if (bootstrap.indexOf('</script') !== -1) throw new Error('invalid bootstrap');
      inner = document.createElement('iframe');
      inner.setAttribute('sandbox', 'allow-scripts');
      inner.setAttribute('allow', 'gamepad *; fullscreen *; screen-wake-lock *');
      inner.setAttribute('title', 'PS1 emulator');
      inner.className = 'inner';
      var ready = new Promise(function (resolve) { innerReady = resolve; });
      inner.srcdoc = '<!doctype html><html lang="en"><head><meta charset="utf-8"><style>' + INNER_CSS + '</style></head>' +
        '<body><div id="game"></div><p id="notice" class="notice"></p><script>' + bootstrap + '</script></body></html>';
      document.body.appendChild(inner);
      return ready.then(function () {
        notice.textContent = '';
        toInner({ t: 'boot', assets: assets, game: m.game, bios: m.bios instanceof File ? m.bios : null, volume: m.volume });
        inner.focus();
      });
    }).catch(function (err) {
      toApp({ t: 'error', message: String((err && err.message) || err).slice(0, 300) });
    });
  }

  window.addEventListener('message', function (e) {
    if (e.source === window.parent) {
      var d = e.data;
      if (e.origin !== appOrigin || !d || d.v !== PROTOCOL || d.nonce !== nonce || !d.msg || typeof d.msg.t !== 'string') return;
      if (d.msg.t === 'load') {
        if (!(d.msg.game instanceof File)) return toApp({ t: 'error', message: 'no game file' });
        boot(d.msg);
      } else if (TO_INNER.indexOf(d.msg.t) !== -1) {
        toInner(d.msg);
      }
      return;
    }
    if (inner && e.source === inner.contentWindow) {
      var x = e.data;
      if (!x || typeof x.t !== 'string') return;
      if (x.t === 'inner-ready') { if (innerReady) innerReady(); return; }
      if (TO_APP.indexOf(x.t) !== -1) toApp(x); // the app validates shape and sizes again
    }
  });

  window.addEventListener('focus', function () { if (inner) inner.focus(); });
  toApp({ t: 'ready' });
})();
