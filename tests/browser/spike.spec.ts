import { expect, test } from '@playwright/test';

test('landscape phone can swipe over the canvas to reach setup controls', async ({ browser }) => {
  const context = await browser.newContext({ viewport: { width: 844, height: 390 }, hasTouch: true, isMobile: true });
  const page = await context.newPage();
  await page.goto('/?probe=1');
  await expect(page.locator('canvas')).toBeVisible();
  const input = await context.newCDPSession(page);
  // A real touch gesture, before any locator action that would auto-scroll.
  const swipeCanvas = async () => {
    const bounds = await page.locator('canvas').boundingBox();
    expect(bounds).not.toBeNull();
    expect(bounds!.height).toBeLessThanOrEqual(390 * .55 + 1);
    const x = bounds!.x + bounds!.width / 2;
    const y = bounds!.y + bounds!.height * .8;
    await input.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
    for (let step = 1; step <= 10; step++) {
      await input.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x, y: y - step * 24 }] });
    }
    await input.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
  };
  await swipeCanvas();
  await expect.poll(() => page.evaluate(() => scrollY)).toBeGreaterThan(100);
  await expect(page.getByLabel('Project URL')).toBeInViewport();
  await page.getByLabel('Project URL').fill('https://phase0-test.supabase.co');
  await page.getByLabel('Public key').fill('sb_publishable_public-test-value');
  await page.getByRole('button', { name: 'Save project' }).click();
  await page.evaluate(() => window.scrollTo(0, 0));
  await swipeCanvas();
  await expect(page.getByLabel('Test account email')).toBeInViewport();
  await context.close();
});

test('a recovered private channel replaces the initial join error', async ({ page }) => {
  const userId = '11111111-1111-4111-8111-111111111111';
  const coupleId = '22222222-2222-4222-8222-222222222222';
  const user = { id: userId, aud: 'authenticated', role: 'authenticated', email: 'player@example.test' };
  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const token = `${encode({ alg: 'HS256', typ: 'JWT' })}.${encode({ sub: userId, role: 'authenticated', exp: Math.floor(Date.now() / 1000) + 3600 })}.test-signature`;
  await page.route('https://phase0-test.supabase.co/**', async route => {
    const path = new URL(route.request().url()).pathname;
    if (path === '/auth/v1/token') await route.fulfill({ json: { access_token: token, refresh_token: 'test-refresh-token', expires_in: 3600, token_type: 'bearer', user } });
    else if (path === '/auth/v1/user') await route.fulfill({ json: user });
    else if (path === '/rest/v1/couple_members') await route.fulfill({ json: { couple_id: coupleId } });
    else await route.abort();
  });
  let joins = 0;
  let recover: (() => void) | undefined;
  await page.routeWebSocket('wss://phase0-test.supabase.co/**', socket => {
    socket.onMessage(message => {
      if (typeof message !== 'string') return;
      const [joinRef, ref, topic, event] = JSON.parse(message) as [string | null, string | null, string, string, unknown];
      const reply = (status: string, response: unknown) => socket.send(JSON.stringify([joinRef, ref, topic, 'phx_reply', { status, response }]));
      if (event === 'phx_join') {
        expect(topic).toBe(`realtime:house:${coupleId}`);
        if (++joins === 1) reply('error', { message: 'Temporary test interruption' });
        else recover = () => reply('ok', {});
      } else if (event === 'heartbeat' || event === 'phx_leave') reply('ok', {});
    });
  });
  await page.goto('/?probe=1');
  await page.getByLabel('Project URL').fill('https://phase0-test.supabase.co');
  await page.getByLabel('Public key').fill('sb_publishable_public-test-value');
  await page.getByRole('button', { name: 'Save project' }).click();
  await page.getByLabel('Test account email').fill(user.email);
  await page.getByLabel('Password', { exact: true }).fill('test-only-fixture');
  await page.getByRole('button', { name: 'Sign in and connect' }).click();
  await expect(page.getByText('Could not join. Check membership and Realtime authorization.', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Send ping' })).toBeDisabled();
  await expect.poll(() => Boolean(recover)).toBe(true);
  recover!();
  await expect(page.getByText('Connection: connected', { exact: true })).toBeVisible();
  await expect(page.getByText('Connected to your private couple channel. Open this build on the other device and send a ping.', { exact: true })).toBeVisible();
  await expect(page.getByText('Could not join. Check membership and Realtime authorization.', { exact: true })).toHaveCount(0);
  await expect(page.getByRole('button', { name: 'Send ping' })).toBeEnabled();
});

for (const viewport of [{ width: 1280, height: 800 }, { width: 844, height: 390 }, { width: 390, height: 844 }]) {
  test(`canvas and empty/error setup at ${viewport.width}x${viewport.height}`, async ({ browser }) => {
    const context = await browser.newContext({ viewport, hasTouch: viewport.width < 1000 });
    const page = await context.newPage();
    const errors: string[] = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto('/?probe=1');
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
  await Promise.all([a.goto('/?probe=1'), b.goto('/?probe=1')]);
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
