import { expect, test, type Page } from '@playwright/test';

async function openGame(page: Page, id: string) {
  await page.goto(`/#/play/${id}`);
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.getByRole('grid')).toBeVisible();
}

test('library search and genre filter', async ({ page }) => {
  await page.goto('/');
  await expect(page.getByRole('status').filter({ hasText: '5 games' })).toBeVisible();
  await page.getByRole('button', { name: 'Board' }).click();
  await expect(page.getByRole('link', { name: 'Chess' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Comet Courier' })).toHaveCount(0);
  await page.getByRole('button', { name: 'All' }).click();
  await page.getByRole('searchbox').fill('flip');
  await expect(page.getByRole('link', { name: 'Reversi' })).toBeVisible();
  await expect(page.getByRole('link', { name: 'Chess' })).toHaveCount(0);
});

test('chess: a move by mouse, a computer reply, keyboard play, undo, and resume after reload', async ({ page }) => {
  const errors: string[] = [];
  page.on('pageerror', (e) => errors.push(e.message));
  await openGame(page, 'chess');
  await page.getByRole('combobox', { name: 'Level' }).selectOption('1');
  await page.getByRole('gridcell', { name: 'e2, white pawn' }).click();
  await page.getByRole('gridcell', { name: 'e4, empty, can move here' }).click();
  await expect(page.locator('.move-list li')).toHaveCount(2, { timeout: 15_000 }); // 1. e4 and the computer's reply
  await expect(page.locator('.move-list li').first()).toHaveText('1. e4');
  await expect(page.locator('.board-game__status')).toContainText('Your move (White)');

  // Keyboard: focus g1 knight via arrows, select with Enter, move to f3.
  await page.getByRole('gridcell', { name: 'g1, white knight' }).focus();
  await page.keyboard.press('Enter');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowUp');
  await page.keyboard.press('ArrowLeft');
  await expect(page.getByRole('gridcell', { name: 'f3, empty, can move here' })).toBeFocused();
  await page.keyboard.press('Enter');
  await expect(page.locator('.move-list li')).toHaveCount(4, { timeout: 15_000 });
  await expect(page.locator('.move-list li').nth(2)).toHaveText('2. Nf3');

  await page.getByRole('button', { name: 'Undo' }).click();
  await expect(page.locator('.move-list li')).toHaveCount(2);

  // Toolbar buttons work from the keyboard (host input no longer swallows Enter).
  await page.getByRole('button', { name: 'Pause' }).focus();
  await page.keyboard.press('Enter');
  await expect(page.getByRole('button', { name: 'Resume' })).toBeVisible();
  await expect(page.locator('.board-game__status')).toContainText('Paused');

  await page.reload();
  await page.getByRole('button', { name: 'Start' }).click();
  await expect(page.locator('.move-list li')).toHaveCount(2); // game restored from the save
  expect(errors).toEqual([]);
});

test('checkers and reversi: human move then computer reply', async ({ page }) => {
  await openGame(page, 'checkers');
  await page.getByRole('gridcell', { name: /^c3, dark piece, can move$/ }).click();
  await page.getByRole('gridcell', { name: /can move here$/ }).first().click();
  await expect(page.locator('.move-list li')).toHaveCount(2, { timeout: 15_000 });

  await openGame(page, 'reversi');
  await page.getByRole('gridcell', { name: /can play here$/ }).first().click();
  await expect(page.locator('.move-list li')).toHaveCount(2, { timeout: 15_000 });
  await expect(page.locator('.board-game__status')).toContainText('Your move (Black)');
});

test('two-player mode lets both sides move on one device', async ({ page }) => {
  await openGame(page, 'chess');
  await page.getByRole('combobox', { name: 'Opponent' }).selectOption('two-player');
  await page.getByRole('button', { name: 'New game' }).click();
  await page.getByRole('gridcell', { name: 'd2, white pawn' }).click();
  await page.getByRole('gridcell', { name: 'd4, empty, can move here' }).click();
  await expect(page.locator('.board-game__status')).toContainText('Black to move');
  await page.getByRole('gridcell', { name: 'd7, black pawn' }).click();
  await page.getByRole('gridcell', { name: 'd5, empty, can move here' }).click();
  await expect(page.locator('.move-list li')).toHaveText(['1. d4', '1… d5']);
});
