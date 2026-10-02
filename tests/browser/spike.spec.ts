import { expect, test } from '@playwright/test';

for (const viewport of [{ width: 1280, height: 800 }, { width: 844, height: 390 }, { width: 390, height: 844 }]) {
  test(`canvas and empty/error setup at ${viewport.width}x${viewport.height}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, hasTouch: viewport.width < 1000 });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/');
    await expect(page.locator('canvas')).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Connect the free project' })).toBeVisible();
    await page.getByLabel('Project URL').fill('https://test.supabase.co');
    await page.getByLabel('Public key').fill('sb_secret_must-never-be-used');
    await page.getByRole('button', { name: 'Save project' }).click();
    await expect(page.getByRole('alert')).toContainText('public anon or publishable');
    expect(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth)).toBe(true);
    expect(errors).toEqual([]);
    await context.close();
  });
}

test('two separate sessions have isolated public setup and usable disconnect/error states', async ({ browser }) => {
  const first = await browser.newContext();
  const second = await browser.newContext();
  const a = await first.newPage();
  const b = await second.newPage();
  await Promise.all([a.goto('/'), b.goto('/')]);
  await a.getByLabel('Project URL').fill('https://phase0-test.supabase.co');
  await a.getByLabel('Public key').fill('sb_publishable_public-test-value');
  await a.getByRole('button', { name: 'Save project' }).click();
  await expect(a.getByRole('heading', { name: 'Private Realtime ping' })).toBeVisible();
  await expect(a.getByRole('button', { name: 'Send ping' })).toBeDisabled();
  await expect(b.getByRole('heading', { name: 'Connect the free project' })).toBeVisible();
  await a.getByRole('button', { name: 'Reconnect' }).click();
  await expect(a.getByText('Sign in before connecting.', { exact: true })).toBeVisible();
  await a.getByRole('button', { name: 'Disconnect', exact: true }).click();
  await expect(a.getByText('Disconnected. Reconnect to send again.', { exact: true })).toBeVisible();
  await Promise.all([first.close(), second.close()]);
});
