import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'platform');
const authDir = path.join(__dirname, '.auth');

async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  expect(overflow, 'page should not horizontally overflow').toBe(false);
}

async function assertPrimaryActionsVisible(page: Page) {
  const buttons = page.locator('button:visible, a[role="button"]:visible, a.btn:visible, a[href*="/platform"]:visible');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);
}

const shotViewports = ['platform-1920x1080', 'platform-1024x768', 'platform-390x844'] as const;

async function visitAndShoot(
  page: Page,
  testInfo: { project: { name: string } },
  route: string,
  heading: RegExp,
  shot: string,
) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 25_000 });
  await page.waitForTimeout(500);
  await assertNoHorizontalScroll(page);
  await assertPrimaryActionsVisible(page);
  if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
    await page.screenshot({ path: path.join(screenshotDir, `${shot}-${testInfo.project.name}.png`), fullPage: true });
  }
}

test.describe('Super Admin Platform Governance responsive QA', () => {
  test.use({ storageState: path.join(authDir, 'superadmin.json') });

  test('platform dashboard', async ({ page }, ti) =>
    visitAndShoot(page, ti, '/platform', /Platform Dashboard/i, 'dashboard'));
  test('tenant list', async ({ page }, ti) =>
    visitAndShoot(page, ti, '/platform/tenants', /Tenants/i, 'tenants'));
  test('tenant create', async ({ page }, ti) =>
    visitAndShoot(page, ti, '/platform/tenants/new', /Create tenant/i, 'tenant-create'));
  test('modules', async ({ page }, ti) =>
    visitAndShoot(page, ti, '/platform/modules', /Module registry/i, 'modules'));
  test('feature flags', async ({ page }, ti) =>
    visitAndShoot(page, ti, '/platform/flags', /Feature Flags/i, 'flags'));
  test('identity', async ({ page }, ti) =>
    visitAndShoot(page, ti, '/platform/users', /Identity/i, 'identity'));
  test('roles & capabilities', async ({ page }, ti) =>
    visitAndShoot(page, ti, '/platform/roles', /Roles & Capabilities/i, 'roles'));
  test('master data', async ({ page }, ti) =>
    visitAndShoot(page, ti, '/platform/masters', /Master Data/i, 'masters'));
  test('integrations', async ({ page }, ti) =>
    visitAndShoot(page, ti, '/platform/integrations', /Integrations/i, 'integrations'));
  test('platform health', async ({ page }, ti) =>
    visitAndShoot(page, ti, '/platform/health', /Platform Health/i, 'health'));
  test('audit', async ({ page }, ti) =>
    visitAndShoot(page, ti, '/platform/audit', /audit history/i, 'audit'));
  test('announcements', async ({ page }, ti) =>
    visitAndShoot(page, ti, '/platform/announcements', /Announcements/i, 'announcements'));

  test('tenant detail workspace', async ({ page }, ti) => {
    await page.goto('/platform/tenants', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Tenants/i }).first()).toBeVisible({ timeout: 25_000 });
    const tenantId = await page.evaluate(async () => {
      const token = localStorage.getItem('survey_token');
      const res = await fetch('/api/platform/tenants', {
        headers: token ? { Authorization: `Bearer ${token}` } : {},
      });
      if (!res.ok) return null;
      const data = (await res.json()) as { tenants?: Array<{ id: number }> };
      return data.tenants?.[0]?.id ?? null;
    });
    expect(tenantId, 'expected platform tenants list to return at least one college').toBeTruthy();
    await page.goto(`/platform/tenants/${tenantId}`, { waitUntil: 'domcontentloaded' });
    await expect(page).toHaveURL(/\/platform\/tenants\/\d+/);
    await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 25_000 });
    // Tab buttons live in main content (sidebar also has "Modules" — use role=button).
    await expect(page.getByRole('button', { name: 'Overview', exact: true })).toBeVisible({ timeout: 15_000 });
    await assertNoHorizontalScroll(page);
    for (const tab of ['Onboarding', 'Modules', 'Settings', 'Branding', 'Diagnostics']) {
      const btn = page.getByRole('button', { name: tab, exact: true });
      if (await btn.count()) {
        await btn.click();
        await page.waitForTimeout(250);
        await assertNoHorizontalScroll(page);
      }
    }
    if (shotViewports.includes(ti.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({ path: path.join(screenshotDir, `tenant-detail-${ti.project.name}.png`), fullPage: true });
      await page.getByRole('button', { name: 'Diagnostics', exact: true }).click().catch(() => undefined);
      await page.waitForTimeout(200);
      await page.screenshot({ path: path.join(screenshotDir, `diagnostics-${ti.project.name}.png`), fullPage: true });
    }
  });
});
