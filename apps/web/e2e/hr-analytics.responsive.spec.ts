import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'hr-analytics');
const authDir = path.join(__dirname, '.auth');

async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  expect(overflow, 'page should not horizontally overflow').toBe(false);
}

async function assertPrimaryActionsVisible(page: Page) {
  const buttons = page.locator('button:visible, a[role="button"]:visible, a.btn:visible');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);
  const box = await buttons.first().boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(28);
}

const shotViewports = ['1920x1080', '1024x768', '390x844'] as const;

async function visitAndShoot(page: Page, testInfo: { project: { name: string } }, route: string, heading: RegExp, shot: string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 20_000 });
  // Allow charts / async data to settle.
  await page.waitForTimeout(600);
  await assertNoHorizontalScroll(page);
  await assertPrimaryActionsVisible(page);
  if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
    await page.screenshot({ path: path.join(screenshotDir, `${shot}-${testInfo.project.name}.png`), fullPage: true });
  }
}

test.describe('HR Analytics responsive QA — HR admin', () => {
  test.use({ storageState: path.join(authDir, 'admin.json') });

  test('overview', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/analytics', /HR Analytics/i, 'hr-overview'));
  test('workforce', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/analytics/workforce', /Workforce Analytics/i, 'hr-workforce'));
  test('attendance & leave', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/analytics/attendance', /Attendance & Leave Analytics/i, 'hr-attendance'));
  test('payroll', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/analytics/payroll', /Payroll Analytics/i, 'hr-payroll'));
  test('recruitment', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/analytics/recruitment', /Recruitment Analytics/i, 'hr-recruitment'));
  test('performance', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/analytics/performance', /Performance Analytics/i, 'hr-performance'));
  test('separation & f&f', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/analytics/separation', /Separation & Final Settlement Analytics/i, 'hr-separation'));
  test('data quality', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/analytics/data-quality', /Data Quality/i, 'hr-data-quality'));
});

test.describe('HR Analytics responsive QA — HOD', () => {
  test.use({ storageState: path.join(authDir, 'hod.json') });

  test('hod overview (department-scoped)', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/analytics', /HR Analytics/i, 'hod-overview'));
  test('hod workforce', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/analytics/workforce', /Workforce Analytics/i, 'hod-workforce'));
  test('hod recruitment', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/analytics/recruitment', /Recruitment Analytics/i, 'hod-recruitment'));
});

test.describe('HR Analytics responsive QA — Principal', () => {
  test.use({ storageState: path.join(authDir, 'principal.json') });

  test('principal overview', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/analytics', /HR Analytics/i, 'principal-overview'));
  test('principal workforce', async ({ page }, ti) => visitAndShoot(page, ti, '/hr/analytics/workforce', /Workforce Analytics/i, 'principal-workforce'));
});
