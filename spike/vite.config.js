// SPIKE-001 — the exact header configuration ADR-0001 proposes, set identically on dev and preview.
// The emulator iframe document (/emu.html) also gets the baseline CSP from SECURITY_GUIDELINES.md,
// with frame-ancestors 'self'. EMU_CSP_EXTRA / EMU_CONNECT_EXTRA let a run add script-src / connect-src sources to test what the core needs.
import { defineConfig } from 'vite';

const isolationHeaders = {
  'Cross-Origin-Opener-Policy': 'same-origin',
  'Cross-Origin-Embedder-Policy': 'require-corp',
  'Cross-Origin-Resource-Policy': 'same-origin',
};

const extra = process.env.EMU_CSP_EXTRA ?? '';
const connectExtra = process.env.EMU_CONNECT_EXTRA ?? '';
const emuCsp = [
  "default-src 'self'",
  `script-src 'self' 'wasm-unsafe-eval' ${extra}`.trim(),
  "worker-src 'self' blob:",
  `connect-src 'self' ${connectExtra}`.trim(),
  "img-src 'self' blob: data:",
  "media-src 'self' blob:",
  "frame-src 'self'",
  "object-src 'none'",
  "base-uri 'none'",
  "form-action 'none'",
  "frame-ancestors 'self'",
].join('; ');

const emuCspPlugin = {
  name: 'spike-emu-csp',
  configureServer(server) { server.middlewares.use(addCsp); },
  configurePreviewServer(server) { server.middlewares.use(addCsp); },
};
function addCsp(req, res, next) {
  if (req.url?.startsWith('/emu.html')) res.setHeader('Content-Security-Policy', emuCsp);
  next();
}

export default defineConfig({
  plugins: [emuCspPlugin],
  server: { headers: isolationHeaders },
  preview: { headers: isolationHeaders },
  build: {
    target: 'es2022',
    rollupOptions: { input: { main: 'index.html', emuHost: 'emu-host.html', emu: 'emu.html' } },
  },
});
