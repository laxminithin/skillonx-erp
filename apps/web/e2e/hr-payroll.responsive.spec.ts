import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'hr-payroll');
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

async function visitAndAssert(page: Page, route: string, heading: RegExp | string) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 20_000 });
  await assertNoHorizontalScroll(page);
  await assertPrimaryActionsVisible(page);
}

const shotViewports = ['1920x1080', '1024x768', '390x844'] as const;

test.describe('HR payroll responsive QA — employee', () => {
  test.use({ storageState: path.join(authDir, 'lecturer.json') });

  test('employee my payroll / payslips', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/payslips', /My Payroll|Payslips/i);

    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `employee-my-payroll-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });
});

test.describe('HR payroll responsive QA — admin', () => {
  test.use({ storageState: path.join(authDir, 'admin.json') });

  test('payroll dashboard', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/payroll', /Payroll/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `payroll-dashboard-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('payroll runs', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/payroll/runs', /Payroll Runs/i);
    if (testInfo.project.name === '390x844') {
      await page.screenshot({
        path: path.join(screenshotDir, `payroll-runs-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('salary structures', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/payroll/structures', /Salary Structures/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `salary-structure-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('payroll run detail / finance handoff', async ({ page }, testInfo) => {
    await page.goto('/hr/payroll/runs', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Payroll Runs/i })).toBeVisible({ timeout: 20_000 });
    const link = page.locator('a[href*="/hr/payroll/runs/"]').first();
    if (await link.count()) {
      await link.click();
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 20_000 });
      await assertNoHorizontalScroll(page);
      if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
        await page.screenshot({
          path: path.join(screenshotDir, `payroll-run-detail-${testInfo.project.name}.png`),
          fullPage: true,
        });
        const finance = page.getByTestId('finance-handoff');
        if (await finance.count()) {
          await page.screenshot({
            path: path.join(screenshotDir, `finance-handoff-${testInfo.project.name}.png`),
            fullPage: true,
          });
        }
      }
      const empLink = page.locator('a[href*="/employees/"]').first();
      if (await empLink.count()) {
        await empLink.click();
        await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 20_000 });
        await assertNoHorizontalScroll(page);
        if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
          await page.screenshot({
            path: path.join(screenshotDir, `employee-payroll-calc-${testInfo.project.name}.png`),
            fullPage: true,
          });
        }
      }
    } else {
      // No runs yet — dashboard still proves route shell
      await visitAndAssert(page, '/hr/payroll', /Payroll/i);
    }
  });

  test('payslip admin path via employee portal still loads', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/payslips', /My Payroll|Payslips/i);
    if (testInfo.project.name === '1920x1080') {
      await page.screenshot({
        path: path.join(screenshotDir, `payslip-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });
});
