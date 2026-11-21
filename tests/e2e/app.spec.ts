import { existsSync } from 'node:fs';
import { expect, test, type Page } from '@playwright/test';

const FIXTURE = 'test-fixtures/local/animated-triangle.exe';

/** Records CSP violations and uncaught errors in every frame of the page. */
async function watch(page: Page) {
  const problems: string[] = [];
  page.on('pageerror', (e) => problems.push(`pageerror: ${e.message}`));
  page.on('console', (m) => {
    if (m.type() === 'error' && /Content Security Policy|Refused to/i.test(m.text())) problems.push(`csp: ${m.text().slice(0, 200)}`);
  });
  return problems;
}

async function waitForServiceWorker(page: Page) {
  // Poll until the worker controls the page and its shell cache exists (an async predicate in waitForFunction
  // is not reliably awaited, so poll with evaluate instead).
  await expect
    .poll(
      () =>
        page.evaluate(async () => {
          const keys = await caches.keys();
          return Boolean(navigator.serviceWorker.controller) && keys.some((k) => k.startsWith('shell-'));
        }),
      { timeout: 30_000 },
    )
    .toBe(true);
}

test('library loads cross-origin isolated with the strict CSP and no violations', async ({ page }) => {
  const problems = await watch(page);
  const res = await page.goto('/');
  const h = res!.headers();
  expect(h['cross-origin-opener-policy']).toBe('same-origin');
  expect(h['cross-origin-embedder-policy']).toBe('require-corp');
  expect(h['content-security-policy']).toContain("script-src 'self';");
  expect(h['content-security-policy']).not.toContain('unsafe');
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Comet Courier' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'PS1 Player' })).toBeVisible();
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
  expect(problems).toEqual([]);
});

test('Comet Courier: start, play, pause, resume, exit, and clean up', async ({ page }) => {
  const problems = await watch(page);
  await page.goto('/#/game/comet-courier');
  await expect(page.getByRole('table')).toContainText('Move left / right'); // controls documented before play
  await page.getByRole('link', { name: 'Play' }).click();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await page.keyboard.press('ArrowLeft');
  await page.keyboard.press('ArrowRight');
  await page.getByRole('button', { name: 'Pause' }).click();
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  await page.getByRole('button', { name: 'Resume' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await page.getByRole('button', { name: '← Exit' }).click();
  await expect(page.getByRole('heading', { name: 'Comet Courier' })).toBeVisible();
  expect(await page.locator('canvas').count()).toBe(0); // canvas removed on destroy
  expect(problems).toEqual([]);
});

test('works offline after the first visit (service worker keeps isolation headers)', async ({ page, context }) => {
  await page.goto('/');
  await waitForServiceWorker(page);
  await context.setOffline(true);
  await page.reload();
  await expect(page.getByRole('heading', { name: 'Library' })).toBeVisible();
  await expect(page.getByRole('status').filter({ hasText: 'Offline' })).toBeVisible();
  expect(await page.evaluate(() => crossOriginIsolated)).toBe(true);
  await page.goto('/#/play/comet-courier');
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible();
  await context.setOffline(false);
});

test('the emulator frame refuses to run outside the app', async ({ page }) => {
  await page.goto('/emulator/frame.html');
  await expect(page.getByText('only runs inside Retro Arcade')).toBeVisible();
});

test.describe('PS1 player (BYOR)', () => {
  test.skip(!existsSync(FIXTURE), 'Run npm run fetch:fixtures and npm run fetch:emulator first');

  test('upload a homebrew disc, install offline package, boot sandboxed, save state, play offline', async ({ page, context }) => {
    test.setTimeout(240_000);
    const problems = await watch(page);
    await page.goto('/#/settings');
    const upload = page.getByLabel('Add discs by upload instead of linking files from disk');
    await upload.check();
    // Preferences are saved to IndexedDB asynchronously and loaded asynchronously after a reload.
    await page.waitForTimeout(500);
    await page.reload();
    await expect(upload).toBeChecked({ timeout: 10_000 });
    await page.goto('/');
    await waitForServiceWorker(page);

    await page.goto('/#/game/ps1-player');
    await page.getByRole('button', { name: 'Make available offline' }).click();
    await expect(page.getByText('The PS1 player is now available offline.')).toBeVisible({ timeout: 60_000 });

    await page.getByLabel('Name').fill('Triangle test');
    await page.getByTestId('disc-upload').setInputFiles(FIXTURE);
    await expect(page.getByText('Copied “Triangle test” into browser storage')).toBeVisible();
    await page.getByRole('button', { name: 'Play' }).click();

    await page.getByRole('button', { name: 'Load disc' }).click();
    const outer = page.frameLocator('iframe.emulator-frame');
    const inner = outer.frameLocator('iframe.inner');
    await inner.locator('.ejs_start_button').click({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 60_000 });

    // Isolation: the emulator runs with an opaque origin and cannot reach the app or its storage.
    const innerFrame = page.frames().find((f) => f.url() === 'about:srcdoc');
    expect(innerFrame).toBeTruthy();
    const isolation = await innerFrame!.evaluate(async () => {
      const r: Record<string, string | boolean> = { origin: self.origin };
      try { void window.parent.document.title; r.parentDom = 'reachable'; } catch { r.parentDom = 'blocked'; }
      try { void window.top!.location.href; r.topLocation = 'reachable'; } catch { r.topLocation = 'blocked'; }
      try { indexedDB.open('retro-arcade'); r.idb = 'opened'; } catch { r.idb = 'blocked'; }
      try { await fetch('https://example.com/'); r.exfil = 'sent'; } catch { r.exfil = 'blocked'; }
      return r;
    });
    expect(isolation).toEqual({ origin: 'null', parentDom: 'blocked', topLocation: 'blocked', idb: 'blocked', exfil: 'blocked' });

    await page.getByRole('button', { name: 'Save 1' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Saved to slot 1.' })).toBeVisible();
    await page.getByRole('button', { name: 'Load 1' }).click();
    await expect(page.getByRole('status').filter({ hasText: 'Loaded slot 1.' })).toBeVisible();
    await page.screenshot({ path: 'test-results/ps1-player-running.png' });
    await page.getByRole('button', { name: '← Exit' }).click();
    await expect(page.locator('iframe.emulator-frame')).toHaveCount(0);

    // Offline: the installed package and the OPFS copy let the disc boot with no network.
    await context.setOffline(true);
    await page.reload();
    await expect(page.getByText('Ready offline').first()).toBeVisible();
    await page.getByRole('button', { name: 'Play' }).click();
    await page.getByRole('button', { name: 'Load disc' }).click();
    await page.frameLocator('iframe.emulator-frame').frameLocator('iframe.inner').locator('.ejs_start_button').click({ timeout: 60_000 });
    await expect(page.getByRole('button', { name: 'Pause' })).toBeVisible({ timeout: 60_000 });
    await context.setOffline(false);

    // The only expected CSP messages come from the deliberate exfiltration probe above.
    expect(problems.filter((p) => !p.includes('https://example.com/'))).toEqual([]);
  });
});
