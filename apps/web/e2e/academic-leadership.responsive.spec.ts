import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'academic-leadership');
const authDir = path.join(__dirname, '.auth');
const widthsForShot = ['1920x1080', '1024x768', '390x844'];

async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  expect(overflow, 'body should not horizontally scroll').toBe(false);
}

async function assertPrimaryActionsVisible(page: Page) {
  const buttons = page.locator('button:visible, a[role="button"]:visible, a:visible');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);
  const first = buttons.first();
  const box = await first.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(24);
}

async function visitAndCheck(page: Page, route: string) {
  // Avoid networkidle — leadership dashboards can keep polling / long-running fetches busy.
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      break;
    } catch (err) {
      const msg = String(err);
      if (!/ERR_CONNECTION_REFUSED|ERR_EMPTY_RESPONSE/.test(msg) || attempt === 4) throw err;
      await page.waitForTimeout(1500 * attempt);
    }
  }
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('h1').filter({ hasNotText: 'Your academic teaching workspace' }).first()).toBeVisible({
    timeout: 20_000,
  });
  await expect(page.getByText('You do not have permission for this academic leadership action')).toHaveCount(0);
  await page.locator('.animate-pulse').first().waitFor({ state: 'detached', timeout: 15_000 }).catch(() => undefined);
  await assertNoHorizontalScroll(page);
  await assertPrimaryActionsVisible(page);
}

async function maybeShot(page: Page, testInfo: { project: { name: string } }, name: string) {
  if (!widthsForShot.includes(testInfo.project.name)) return;
  await page.screenshot({
    path: path.join(screenshotDir, `${name}-${testInfo.project.name}.png`),
    fullPage: true,
  });
}

test.describe('Academic leadership responsive QA', () => {
  test.describe('HOD', () => {
    test.use({ storageState: path.join(authDir, 'hod.json') });

    test('HOD leadership surfaces render without overflow', async ({ page }, testInfo) => {
      await visitAndCheck(page, '/hod');
      await maybeShot(page, testInfo, 'hod-dashboard');

      await visitAndCheck(page, '/hod/faculty');
      await maybeShot(page, testInfo, 'hod-department-overview');

      await visitAndCheck(page, '/hod/leave');
      await maybeShot(page, testInfo, 'hod-faculty-leave');

      for (const route of [
        '/hod/attendance',
        '/hod/workload',
        '/hod/progress',
        '/hod/continuity',
        '/dashboard',
        '/hr/leave/apply',
      ]) {
        await visitAndCheck(page, route);
      }
    });
  });

  test.describe('Principal', () => {
    test.use({ storageState: path.join(authDir, 'principal.json') });

    test('Principal leadership surfaces render without overflow', async ({ page }, testInfo) => {
      await visitAndCheck(page, '/principal');
      await maybeShot(page, testInfo, 'principal-dashboard');

      await visitAndCheck(page, '/principal/approvals');
      await maybeShot(page, testInfo, 'principal-approvals');

      await visitAndCheck(page, '/principal/departments');
      await maybeShot(page, testInfo, 'principal-department-overview');

      for (const route of ['/principal/continuity', '/principal/faculty', '/dashboard']) {
        await visitAndCheck(page, route);
      }
    });
  });
});
