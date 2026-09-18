import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots');
const authDir = path.join(__dirname, '.auth');

async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  expect(overflow, 'body should not horizontally scroll').toBe(false);
}

async function assertPrimaryActionsVisible(page: Page) {
  const buttons = page.locator('button:visible, a[role="button"]:visible');
  const count = await buttons.count();
  expect(count).toBeGreaterThan(0);
  const first = buttons.first();
  const box = await first.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(28);
}

async function visitRoutes(page: Page, routes: string[]) {
  for (const route of routes) {
    await page.goto(route);
    await page.waitForLoadState('networkidle');
    await assertNoHorizontalScroll(page);
    await assertPrimaryActionsVisible(page);
  }
}

test.describe('HR academic continuity responsive QA', () => {
  test.describe('lecturer', () => {
    test.use({ storageState: path.join(authDir, 'lecturer.json') });

    test('HR surfaces render without overflow', async ({ page }, testInfo) => {
      await visitRoutes(page, ['/dashboard', '/hr/leave/apply', '/hr']);

      const widthsForShot = ['1920x1080', '1024x768', '390x844'];
      if (widthsForShot.includes(testInfo.project.name)) {
        await page.goto('/hr/leave/apply');
        await page.waitForLoadState('networkidle');
        await page.screenshot({
          path: path.join(screenshotDir, `lecturer-${testInfo.project.name}.png`),
          fullPage: true,
        });
      }
    });
  });

  test.describe('substitute lecturer', () => {
    test.use({ storageState: path.join(authDir, 'substitute.json') });

    test('surfaces render without overflow', async ({ page }) => {
      await visitRoutes(page, ['/dashboard', '/timetable', '/hr']);
    });
  });

  test.describe('HOD / manager', () => {
    test.use({ storageState: path.join(authDir, 'admin.json') });

    test('coverage management surfaces render without overflow', async ({ page }, testInfo) => {
      await visitRoutes(page, ['/hr/manager']);

      const widthsForShot = ['1920x1080', '1024x768', '390x844'];
      if (widthsForShot.includes(testInfo.project.name)) {
        await page.screenshot({
          path: path.join(screenshotDir, `hod-${testInfo.project.name}.png`),
          fullPage: true,
        });
      }
    });
  });
});
