import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.join(__dirname, '.auth');
const screenshotDir = path.join(__dirname, 'screenshots', 'accountant-finance');
const shotViewports = ['1920x1080', '1024x768', '390x844'] as const;

async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(overflow, 'accountant workspace should not horizontally overflow').toBe(false);
}

async function assertPrimaryActionsVisible(page: Page) {
  const controls = page.locator('button:visible, a:visible');
  expect(await controls.count()).toBeGreaterThan(0);
}

async function visitAndShoot(
  page: Page,
  testInfo: { project: { name: string } },
  route: string,
  heading: RegExp,
  shot: string,
) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(600);
  await assertNoHorizontalScroll(page);
  await assertPrimaryActionsVisible(page);
  if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
    await page.screenshot({ path: path.join(screenshotDir, `${shot}-${testInfo.project.name}.png`), fullPage: true });
  }
}

test.describe('Accountant / Finance Officer workspace responsive QA', () => {
  test.use({ storageState: path.join(authDir, 'accountant.json') });

  test('dashboard', async ({ page }, ti) => visitAndShoot(page, ti, '/accountant', /Finance Dashboard/i, 'dashboard'));
  test('student accounts', async ({ page }, ti) => visitAndShoot(page, ti, '/accountant/students', /Student Search/i, 'students'));
  test('payments', async ({ page }, ti) => visitAndShoot(page, ti, '/accountant/payments', /Payments/i, 'payments'));
  test('receipts', async ({ page }, ti) => visitAndShoot(page, ti, '/accountant/receipts', /Receipts/i, 'receipts'));
  test('fee setup', async ({ page }, ti) => visitAndShoot(page, ti, '/accountant/fee-structures', /Fee Structures/i, 'fee-structures'));
  test('scholarships', async ({ page }, ti) => visitAndShoot(page, ti, '/accountant/scholarships', /Scholarships/i, 'scholarships'));
  test('refunds', async ({ page }, ti) => visitAndShoot(page, ti, '/accountant/refunds', /Refunds/i, 'refunds'));
  test('reconciliation', async ({ page }, ti) => visitAndShoot(page, ti, '/accountant/reconciliation', /Reconciliation/i, 'reconciliation'));
  test('reports', async ({ page }, ti) => visitAndShoot(page, ti, '/accountant/reports', /Reports/i, 'reports'));
});

test.describe('Accountant workspace RBAC boundary', () => {
  test.use({ storageState: path.join(authDir, 'principal.json') });

  test('principal is redirected away from accountant operations', async ({ page }) => {
    await page.goto('/accountant', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/accountant/);
    await expect(page.getByRole('heading', { name: /Finance Dashboard/i })).toHaveCount(0);
  });
});
