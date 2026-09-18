import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'hr-learning-development');
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

test.describe('L&D responsive QA — employee', () => {
  test.use({ storageState: path.join(authDir, 'lecturer.json') });
  test('my learning', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/learning', /My Learning/i, 'employee-my-learning'));
  test('development plan', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/learning/plan', /Development Plan/i, 'development-plan'));
  test('catalogue', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/learning/catalogue', /Training Catalogue/i, 'catalogue'));
  test('my programs', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/learning/programs', /My Programs/i, 'my-programs'));
  test('certificates', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/learning/certificates', /Certificates/i, 'certificates'));
  test('history', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/learning/history', /Learning History/i, 'history'));
});

test.describe('L&D responsive QA — HR admin', () => {
  test.use({ storageState: path.join(authDir, 'admin.json') });
  test('dashboard', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/ld', /Learning & Development/i, 'hr-dashboard'));
  test('programs', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/ld/programs', /^Programs$/i, 'hr-programs'));
  test('mandatory compliance', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/ld/compliance', /Mandatory Training Compliance/i, 'hr-compliance'));
});

test.describe('L&D responsive QA — HOD', () => {
  test.use({ storageState: path.join(authDir, 'hod.json') });
  test('team development', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/learning/team', /Team Development/i, 'hod-team-development'));
});
