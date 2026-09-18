import { expect, test, type Page } from '@playwright/test';
import { mkdir } from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'procurement');
const API = 'http://127.0.0.1:4000';
const viewports = [
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
];
const tabs = [
  'Dashboard',
  'Indents',
  'Approvals',
  'Vendors',
  'RFQ / Quotations',
  'Purchase Orders',
  'Goods Receipts',
  'Inventory',
  'Issues / Returns / Transfers',
  'Reports',
];
const screenshotViewports = new Set(['1920x1080', '1024x768', '390x844']);

async function login(page: Page, request: import('@playwright/test').APIRequestContext) {
  const response = await request.post(`${API}/api/auth/login`, {
    data: { email: 'collegeadmin@vviet.edu.in', password: 'Password123' },
  });
  expect(response.ok(), 'college admin should authenticate').toBeTruthy();
  const json = await response.json();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((token) => localStorage.setItem('survey_token', token), json.token);
}

async function assertNoOverflow(page: Page) {
  const width = await page.evaluate(() => document.documentElement.clientWidth);
  const scrollWidth = await page.evaluate(() => Math.max(document.documentElement.scrollWidth, document.body.scrollWidth));
  expect(scrollWidth, 'Procurement page should not horizontally overflow').toBeLessThanOrEqual(width + 2);
  const offscreenControls = await page.locator('button:visible, a:visible, input:visible, select:visible, textarea:visible').evaluateAll((nodes) => {
    const viewportWidth = document.documentElement.clientWidth;
    const insideHorizontalScroller = (node: Element) => {
      let el: Element | null = node;
      while (el && el !== document.body) {
        const style = window.getComputedStyle(el);
        if (['auto', 'scroll'].includes(style.overflowX) && el.scrollWidth > el.clientWidth + 2) return true;
        el = el.parentElement;
      }
      return false;
    };
    return nodes
      .filter((node) => !insideHorizontalScroller(node))
      .map((node) => {
        const box = node.getBoundingClientRect();
        return { text: node.textContent?.trim(), left: box.left, right: box.right };
      })
      .filter((box) => box.left < -2 || box.right > viewportWidth + 2);
  });
  expect(offscreenControls).toEqual([]);
}

test.describe('Stores & Purchase / Procurement responsive QA', () => {
  test('authenticated workspace covers required viewports and workflows', async ({ page, request }) => {
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const apiErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !/favicon|Failed to load resource.*404/.test(message.text())) consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 500 && response.url().includes('/api/')) apiErrors.push(`${response.status()} ${response.url()}`);
    });

    await login(page, request);
    await mkdir(screenshotDir, { recursive: true });

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      await page.goto('/procurement', { waitUntil: 'domcontentloaded' });
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.getByRole('heading', { name: /Institutional Procurement Workspace/i })).toBeVisible({ timeout: 20_000 });

      for (const tab of tabs) {
        await page.getByRole('button', { name: new RegExp(tab.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'i') }).click();
        await expect(page.getByText(/Stores & Purchase \/ Procurement/i)).toBeVisible();
        await assertNoOverflow(page);
        if (screenshotViewports.has(viewport.name)) {
          const slug = tab.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
          await page.screenshot({ path: path.join(screenshotDir, `${slug}-${viewport.name}.png`), fullPage: true });
        }
      }
    }

    expect(consoleErrors, 'fatal console errors').toEqual([]);
    expect(pageErrors, 'unhandled browser exceptions').toEqual([]);
    expect(apiErrors, 'Procurement API responses should not 5xx').toEqual([]);
  });
});
