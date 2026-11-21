import { createHash } from 'node:crypto';
import { existsSync, readdirSync, readFileSync, rmSync, statSync, writeFileSync } from 'node:fs';
import { join, relative, sep } from 'node:path';
import type { IncomingMessage, ServerResponse } from 'node:http';
import { defineConfig, type Plugin } from 'vite';
import { headersFor, staticHostHeadersFile, EMULATOR_PATH_PREFIX } from './config/security-headers.ts';

/** SHA-256 (base64) of the inner emulator bootstrap, which the outer frame inlines into a sandboxed srcdoc. */
const innerScriptHash = () => createHash('sha256').update(readFileSync(new URL('./public/emulator/inner.js', import.meta.url))).digest('base64');

type Next = (err?: unknown) => void;

function securityHeaders(dev: boolean) {
  return (req: IncomingMessage, res: ServerResponse, next: Next) => {
    const pathname = new URL(req.url ?? '/', 'http://localhost').pathname;
    for (const [k, v] of Object.entries(headersFor(pathname, dev, innerScriptHash()))) res.setHeader(k, v);
    next();
  };
}

function listFiles(dir: string): string[] {
  const out: string[] = [];
  for (const name of readdirSync(dir)) {
    const p = join(dir, name);
    if (statSync(p).isDirectory()) out.push(...listFiles(p));
    else out.push(p);
  }
  return out;
}

/** Applies security headers on dev/preview servers and writes dist/_headers + precache manifests at build time. */
function arcadePlugin(): Plugin {
  let outDir = 'dist';
  return {
    name: 'retro-arcade-security-and-precache',
    configureServer(server) {
      server.middlewares.use(securityHeaders(true));
    },
    configurePreviewServer(server) {
      server.middlewares.use(securityHeaders(false));
    },
    configResolved(config) {
      outDir = config.build.outDir;
    },
    closeBundle() {
      // Repository docs in public/ (README.md) are not part of the site.
      for (const doc of ['README.md']) if (existsSync(join(outDir, doc))) rmSync(join(outDir, doc));
      writeFileSync(join(outDir, '_headers'), staticHostHeadersFile(innerScriptHash()));
      const files = listFiles(outDir).map((f) => '/' + relative(outDir, f).split(sep).join('/'));
      const hashOf = (urls: string[]) => {
        const h = createHash('sha256');
        for (const u of urls.sort()) h.update(u).update(readFileSync(join(outDir, u.slice(1))));
        return h.digest('hex').slice(0, 16);
      };
      const excluded = new Set(['/_headers', '/precache-manifest.json', '/sw.js']);
      const shell = files.filter((u) => !u.startsWith(EMULATOR_PATH_PREFIX) && !excluded.has(u) && !u.endsWith('.map'));
      const emulator = files.filter((u) => u.startsWith(EMULATOR_PATH_PREFIX) && !u.endsWith('precache-manifest.json'));
      const shellVersion = hashOf(shell);
      writeFileSync(join(outDir, 'precache-manifest.json'), JSON.stringify({ version: shellVersion, urls: ['/', ...shell] }, null, 2));
      writeFileSync(join(outDir, 'emulator', 'precache-manifest.json'), JSON.stringify({ version: hashOf(emulator), urls: emulator }, null, 2));
      const template = readFileSync(new URL('./config/sw-template.js', import.meta.url), 'utf8');
      writeFileSync(join(outDir, 'sw.js'), template.replace("'__VERSION__'", JSON.stringify(shellVersion)).replace('__SHELL__', JSON.stringify(['/', ...shell])));
    },
  };
}

export default defineConfig({
  plugins: [arcadePlugin()],
  build: {
    target: 'es2022',
    sourcemap: false,
    assetsInlineLimit: 0, // no data: URLs for scripts/styles; keeps the CSP simple
  },
  server: { port: 5173, strictPort: true },
  preview: { port: 4173, strictPort: true },
  test: {
    include: ['tests/unit/**/*.test.ts'],
    environment: 'node',
  },
} as Parameters<typeof defineConfig>[0]);
