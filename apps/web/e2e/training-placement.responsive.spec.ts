import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'training-placement');
const authDir = path.join(__dirname, '.auth');
const widthsForShot = ['1920x1080', '1024x768', '390x844'];

async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  expect(overflow, 'body should not horizontally scroll').toBe(false);
}

async function visitAndCheck(page: Page, route: string) {
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
  await page.locator('.animate-pulse').first().waitFor({ state: 'detached', timeout: 15_000 }).catch(() => undefined);
  await assertNoHorizontalScroll(page);
}

async function maybeShot(page: Page, testInfo: { project: { name: string } }, name: string) {
  if (!widthsForShot.includes(testInfo.project.name)) return;
  await page.screenshot({
    path: path.join(screenshotDir, `${name}-${testInfo.project.name}.png`),
    fullPage: true,
  });
}

test.describe('Training & Placement responsive QA', () => {
  test.describe('T&P Officer / Admin', () => {
    test.use({ storageState: path.join(authDir, 'admin.json') });

    test('Officer T&P surfaces render without overflow', async ({ page }, testInfo) => {
      await visitAndCheck(page, '/placements');
      await maybeShot(page, testInfo, 'officer-dashboard');

      await visitAndCheck(page, '/placements/opportunities');
      await maybeShot(page, testInfo, 'placement-drive');

      await visitAndCheck(page, '/placements/applications');
      await maybeShot(page, testInfo, 'applications');

      await visitAndCheck(page, '/placements/training');
      await maybeShot(page, testInfo, 'training-dashboard');

      for (const route of ['/placements/companies', '/placements/coordinators', '/placements/management']) {
        await visitAndCheck(page, route);
      }
    });
  });

  test.describe('HOD department coordinator oversight', () => {
    test.use({ storageState: path.join(authDir, 'hod.json') });

    test('Department coordinator T&P surfaces render', async ({ page }, testInfo) => {
      await visitAndCheck(page, '/hod/placement');
      await maybeShot(page, testInfo, 'dept-coordinator-dashboard');
      await visitAndCheck(page, '/hod');
    });
  });

  test.describe('Principal oversight', () => {
    test.use({ storageState: path.join(authDir, 'principal.json') });

    test('Principal T&P overview renders', async ({ page }, testInfo) => {
      await visitAndCheck(page, '/principal/placement');
      await maybeShot(page, testInfo, 'principal-tp-overview');
    });
  });
});
