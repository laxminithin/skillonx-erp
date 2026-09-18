import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'hr-succession');
const authDir = path.join(__dirname, '.auth');

async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(overflow, 'page should not horizontally overflow').toBe(false);
}
async function assertPrimaryActionsVisible(page: Page) {
  const buttons = page.locator('button:visible, a[role="button"]:visible, a.btn:visible');
  expect(await buttons.count()).toBeGreaterThan(0);
  const box = await buttons.first().boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(28);
}
const shotViewports = ['1920x1080', '1024x768', '390x844'] as const;

async function visitAndShoot(page: Page, ti: { project: { name: string } }, route: string, heading: RegExp, shot: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(500);
  await assertNoHorizontalScroll(page);
  await assertPrimaryActionsVisible(page);
  if (shotViewports.includes(ti.project.name as (typeof shotViewports)[number])) {
    await page.screenshot({ path: path.join(screenshotDir, `${shot}-${ti.project.name}.png`), fullPage: true });
  }
}

test.describe('Succession responsive QA — HR admin', () => {
  test.use({ storageState: path.join(authDir, 'admin.json') });
  test('dashboard', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/succession', /Succession Planning/i, 'dashboard'));
  test('critical roles', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/succession/roles', /Critical Roles/i, 'critical-roles'));
  test('talent matrix', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/succession/matrix', /Talent Matrix/i, 'talent-matrix'));
  test('talent pools', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/succession/pools', /Talent Pools/i, 'talent-pools'));
  test('development actions', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/succession/actions', /Development Actions/i, 'development-actions'));
  test('reports', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/succession/reports', /Reports/i, 'reports'));

  test('succession slate (role detail)', async ({ page }, ti) => {
    await page.goto('/hr/succession/roles', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Critical Roles/i })).toBeVisible({ timeout: 20_000 });
    const link = page.locator('a[href*="/hr/succession/roles/"]').first();
    if (await link.count()) {
      await link.click();
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 20_000 });
      await page.waitForTimeout(400);
      await assertNoHorizontalScroll(page);
      if (shotViewports.includes(ti.project.name as (typeof shotViewports)[number])) {
        await page.screenshot({ path: path.join(screenshotDir, `succession-slate-${ti.project.name}.png`), fullPage: true });
      }
    } else {
      await assertNoHorizontalScroll(page);
    }
  });
});

test.describe('Succession responsive QA — HOD', () => {
  test.use({ storageState: path.join(authDir, 'hod.json') });
  test('team talent', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/succession/team', /Team Talent/i, 'hod-team-talent'));
});

test.describe('Succession responsive QA — employee', () => {
  test.use({ storageState: path.join(authDir, 'lecturer.json') });
  test('my development', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/succession/me', /My Development/i, 'my-development'));
});
