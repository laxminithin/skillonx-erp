import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'hr-final-settlement');
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

test.describe('HR final settlement responsive QA — HOD', () => {
  test.use({ storageState: path.join(authDir, 'hod.json') });

  test('department clearance inbox', async ({ page }) => {
    await visitAndAssert(page, '/hod/clearance', /Department Clearance/i);
  });

  test('department clearance detail', async ({ page }) => {
    await page.goto('/hod/clearance', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Department Clearance/i })).toBeVisible({ timeout: 20_000 });
    await assertNoHorizontalScroll(page);
    const link = page.locator('a[href*="/hod/clearance/"]').first();
    if (await link.count()) {
      await link.click();
      await expect(page.getByRole('heading', { name: /Department clearance/i })).toBeVisible({ timeout: 20_000 });
      await assertNoHorizontalScroll(page);
      const confirm = page.getByRole('button', { name: /Confirm department clearance/i });
      if (await confirm.count()) {
        await confirm.scrollIntoViewIfNeeded();
        const box = await confirm.boundingBox();
        expect(box?.height ?? 0).toBeGreaterThanOrEqual(28);
      }
    }
  });
});

test.describe('HR final settlement responsive QA — employee', () => {
  test.use({ storageState: path.join(authDir, 'lecturer.json') });

  test('employee my separation', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/separation', /My Exit|Separation/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `employee-my-separation-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });
});

test.describe('HR final settlement responsive QA — admin', () => {
  test.use({ storageState: path.join(authDir, 'admin.json') });

  test('fnf dashboard', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/fnf', /Final Settlement/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `fnf-dashboard-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('fnf cases', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/fnf/cases', /Settlement Cases/i);
    if (testInfo.project.name === '390x844') {
      await page.screenshot({
        path: path.join(screenshotDir, `fnf-cases-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('fnf case detail / clearance / calculation / approval / finance', async ({ page }, testInfo) => {
    await page.goto('/hr/fnf/cases', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Settlement Cases/i })).toBeVisible({ timeout: 20_000 });
    const link = page.locator('a[href*="/hr/fnf/cases/"]:visible').first();
    await expect(link.or(page.getByText(/No cases in this view/i))).toBeVisible({ timeout: 20_000 });
    if (await link.count()) {
      await link.click();
      await expect(page.getByRole('button', { name: /All cases/i })).toBeVisible({ timeout: 20_000 });
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 20_000 });
      await assertNoHorizontalScroll(page);
      if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
        await page.screenshot({
          path: path.join(screenshotDir, `fnf-case-detail-${testInfo.project.name}.png`),
          fullPage: true,
        });
      }
      await page.getByRole('button', { name: /^clearance$/i }).click();
      await assertNoHorizontalScroll(page);
      if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
        await page.screenshot({
          path: path.join(screenshotDir, `fnf-clearance-${testInfo.project.name}.png`),
          fullPage: true,
        });
      }
      await page.getByRole('button', { name: /^calculation$/i }).click();
      await assertNoHorizontalScroll(page);
      if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
        await page.screenshot({
          path: path.join(screenshotDir, `fnf-calculation-${testInfo.project.name}.png`),
          fullPage: true,
        });
      }
      await page.getByRole('button', { name: /^approvals$/i }).click();
      await assertNoHorizontalScroll(page);
      if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
        await page.screenshot({
          path: path.join(screenshotDir, `fnf-approval-${testInfo.project.name}.png`),
          fullPage: true,
        });
      }
      await page.getByRole('button', { name: /^finance$/i }).click();
      await assertNoHorizontalScroll(page);
      if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
        await page.screenshot({
          path: path.join(screenshotDir, `fnf-finance-posting-${testInfo.project.name}.png`),
          fullPage: true,
        });
      }
    }
  });

  test('fnf clearance inbox', async ({ page }) => {
    await visitAndAssert(page, '/hr/fnf/clearance', /Clearance/i);
  });

  test('fnf approvals', async ({ page }) => {
    await visitAndAssert(page, '/hr/fnf/approvals', /Approvals/i);
  });

  test('fnf finance posting', async ({ page }) => {
    await visitAndAssert(page, '/hr/fnf/finance', /Finance Posting/i);
  });

  test('fnf documents / settlement statement', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/fnf/documents', /Documents/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `settlement-statement-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('fnf reports', async ({ page }) => {
    await visitAndAssert(page, '/hr/fnf/reports', /Final Settlement Reports/i);
  });
});
