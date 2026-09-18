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

async function visitRoutes(page: Page, routes: string[]) {
  for (const route of routes) {
    await page.goto(route, { waitUntil: 'domcontentloaded', timeout: 60_000 });
    try {
      await page.waitForLoadState('networkidle', { timeout: 15_000 });
    } catch {
      await page.waitForLoadState('load');
    }
    await assertNoHorizontalScroll(page);
  }
}

test.describe('HR employee lifecycle responsive QA', () => {
  test.describe('admin', () => {
    test.use({ storageState: path.join(authDir, 'admin.json') });

    test('lifecycle admin surfaces render without overflow', async ({ page }, testInfo) => {
      await visitRoutes(page, [
        '/hr/admin',
        '/hr/admin/employees',
        '/hr/admin/onboarding',
      ]);

      const employeeLink = page.locator('a[href*="/hr/admin/employees/"]').first();
      if (await employeeLink.count()) {
        await employeeLink.click();
        try {
          await page.waitForLoadState('networkidle', { timeout: 15_000 });
        } catch {
          await page.waitForLoadState('load');
        }
        await assertNoHorizontalScroll(page);
      }

      const widthsForShot = ['1920x1080', '1024x768', '390x844'];
      if (widthsForShot.includes(testInfo.project.name)) {
        await page.goto('/hr/admin/employees', { waitUntil: 'domcontentloaded', timeout: 60_000 });
        try {
          await page.waitForLoadState('networkidle', { timeout: 15_000 });
        } catch {
          await page.waitForLoadState('load');
        }
        await page.screenshot({
          path: path.join(screenshotDir, `hr-lifecycle-admin-${testInfo.project.name}.png`),
          fullPage: true,
        });
      }
    });
  });

  test.describe('employee self-service', () => {
    test.use({ storageState: path.join(authDir, 'lecturer.json') });

    test('self-service lifecycle pages render without overflow', async ({ page }) => {
      await visitRoutes(page, ['/hr', '/hr/profile', '/hr/service-history', '/hr/resignation']);
    });
  });

  test.describe('manager', () => {
    test.use({ storageState: path.join(authDir, 'admin.json') });

    test('manager lifecycle pages render without overflow', async ({ page }) => {
      await visitRoutes(page, ['/hr/manager']);
    });
  });
});
