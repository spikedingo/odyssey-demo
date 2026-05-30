# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: responsive.spec.ts >> tablet (768px) >> orders page renders list region
- Location: e2e/responsive.spec.ts:23:9

# Error details

```
Error: expect(locator).toBeVisible() failed

Locator: getByText('Orders')
Expected: visible
Timeout: 15000ms
Error: element(s) not found

Call log:
  - Expect "toBeVisible" with timeout 15000ms
  - waiting for getByText('Orders')

```

# Test source

```ts
  1  | import { test, expect } from '@playwright/test';
  2  | 
  3  | const BASE_URL = process.env.PLAYWRIGHT_BASE_URL ?? 'http://localhost:8081';
  4  | 
  5  | const viewports = [
  6  |   { name: 'phone', width: 375, height: 812 },
  7  |   { name: 'tablet', width: 768, height: 1024 },
  8  |   { name: 'desktop', width: 1280, height: 800 },
  9  | ] as const;
  10 | 
  11 | for (const viewport of viewports) {
  12 |   test.describe(`${viewport.name} (${viewport.width}px)`, () => {
  13 |     test.use({ viewport: { width: viewport.width, height: viewport.height } });
  14 | 
  15 |     test('home loads without horizontal overflow', async ({ page }) => {
  16 |       await page.goto(`${BASE_URL}/home`);
  17 |       await expect(page.getByText('Home')).toBeVisible({ timeout: 15_000 });
  18 |       const scrollWidth = await page.evaluate(() => document.documentElement.scrollWidth);
  19 |       const clientWidth = await page.evaluate(() => document.documentElement.clientWidth);
  20 |       expect(scrollWidth).toBeLessThanOrEqual(clientWidth + 2);
  21 |     });
  22 | 
  23 |     test('orders page renders list region', async ({ page }) => {
  24 |       await page.goto(`${BASE_URL}/orders`);
> 25 |       await expect(page.getByText('Orders')).toBeVisible({ timeout: 15_000 });
     |                                              ^ Error: expect(locator).toBeVisible() failed
  26 |     });
  27 | 
  28 |     test('POS terminal shows menu or empty state', async ({ page }) => {
  29 |       await page.goto(`${BASE_URL}/`);
  30 |       await expect(
  31 |         page.getByText(/Self-Service Ordering|Cart \(|No menu yet|Failed to load/i),
  32 |       ).toBeVisible({ timeout: 15_000 });
  33 |     });
  34 |   });
  35 | }
  36 | 
```