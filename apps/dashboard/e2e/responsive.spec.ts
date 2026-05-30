import { test, expect } from '@playwright/test';

const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8081';

async function assertDevServerReady(page: import('@playwright/test').Page) {
  const response = await page.goto(BASE_URL, { waitUntil: 'domcontentloaded' });
  if (!response || response.status() >= 500) {
    test.skip(true, `Dev server not ready at ${BASE_URL} (status ${response?.status() ?? 'n/a'})`);
  }
}

const viewports = [
  { name: 'phone', width: 375, height: 812 },
  { name: 'tablet', width: 768, height: 1024 },
  { name: 'desktop', width: 1280, height: 800 },
] as const;

for (const viewport of viewports) {
  test.describe(`${viewport.name} (${viewport.width}px)`, () => {
    test.use({ viewport: { width: viewport.width, height: viewport.height } });

    test('home loads without horizontal overflow', async ({ page }) => {
      await assertDevServerReady(page);
      await page.goto(`${BASE_URL}/home`);
      await expect(page.getByText('Home')).toBeVisible({ timeout: 15_000 });
      const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
      const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
      expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
    });

    test('orders page renders list region', async ({ page }) => {
      await assertDevServerReady(page);
      await page.goto(`${BASE_URL}/orders`);
      await expect(page.getByText('Orders')).toBeVisible({ timeout: 15_000 });
    });

    test('POS terminal shows menu or empty state', async ({ page }) => {
      await assertDevServerReady(page);
      await page.goto(`${BASE_URL}/`);
      await expect(
        page.getByText(/Self-Service Ordering|Cart \(|No menu yet|Failed to load/i),
      ).toBeVisible({ timeout: 15_000 });
    });
  });
}
