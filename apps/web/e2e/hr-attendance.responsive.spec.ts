import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'hr-attendance');
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
  const first = buttons.first();
  const box = await first.boundingBox();
  expect(box?.height ?? 0).toBeGreaterThanOrEqual(28);
}

async function assertNoTinyControls(page: Page) {
  const tiny = await page.evaluate(() => {
    const controls = Array.from(document.querySelectorAll('button, a, input, select, textarea'));
    return controls.some((el) => {
      const rect = el.getBoundingClientRect();
      return rect.width > 0 && rect.height > 0 && rect.height < 24 && rect.width < 24;
    });
  });
  expect(tiny, 'controls should not be unusably tiny').toBe(false);
}

async function visitAndAssert(page: Page, route: string, heading: RegExp | string) {
  // Avoid networkidle — admin register recalculation can keep the network busy for minutes.
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 20_000 });
  await assertNoHorizontalScroll(page);
  await assertPrimaryActionsVisible(page);
  await assertNoTinyControls(page);
}

const shotViewports = ['1920x1080', '1024x768', '390x844'] as const;

test.describe('HR attendance responsive QA — employee', () => {
  test.use({ storageState: path.join(authDir, 'lecturer.json') });

  test('employee attendance calendar and summary', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/attendance', /My Attendance/i);
    await expect(page.getByRole('link', { name: /Regularization/i })).toBeVisible();
    // Summary cards may load async; accept either populated cards or month controls.
    await expect(page.locator('input[type="number"]').first()).toBeVisible();

    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `employee-attendance-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('employee regularization form', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/attendance/regularization', /Regularization/i);
    await expect(page.getByPlaceholder(/Explain the reason/i)).toBeVisible();
    await expect(page.getByRole('button', { name: /Submit request/i })).toBeVisible();

    if (testInfo.project.name === '390x844') {
      await page.screenshot({
        path: path.join(screenshotDir, `employee-regularization-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });
});

test.describe('HR attendance responsive QA — manager', () => {
  test.use({ storageState: path.join(authDir, 'admin.json') });

  test('manager team attendance and regularizations', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/manager/attendance', /Team Attendance/i);
    await expect(page.getByText(/Pending regularizations/i)).toBeVisible();

    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `manager-attendance-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });
});

test.describe('HR attendance responsive QA — HR admin', () => {
  test.use({ storageState: path.join(authDir, 'admin.json') });

  test('HR attendance register and closure controls', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/admin/attendance', /Attendance Register/i);
    await expect(page.getByRole('main').getByRole('link', { name: 'Settings' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Process' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Finalize' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Lock' })).toBeVisible();

    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `hr-register-closure-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('HR attendance settings', async ({ page }) => {
    await visitAndAssert(page, '/hr/admin/attendance/settings', /Attendance Settings/i);
    await expect(page.getByText(/Sandwich leave policy/i)).toBeVisible({ timeout: 20_000 });
    await expect(page.getByText(/Default work schedule|Default shift|Late marks/i).first()).toBeVisible();
  });

  test('HR holiday management', async ({ page }) => {
    await visitAndAssert(page, '/hr/admin/attendance/holidays', /Holiday/i);
    await expect(page.getByRole('button', { name: /Add holiday/i })).toBeVisible();
  });
});
