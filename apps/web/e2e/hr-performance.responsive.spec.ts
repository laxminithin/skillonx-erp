import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'hr-performance');
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

test.describe('HR performance responsive QA — employee', () => {
  test.use({ storageState: path.join(authDir, 'lecturer.json') });

  test('employee my performance', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/me/performance', /My Performance/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `employee-my-performance-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('employee self appraisal detail (if link)', async ({ page }, testInfo) => {
    await page.goto('/hr/me/performance', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /My Performance/i })).toBeVisible({ timeout: 20_000 });
    const link = page.locator('a[href*="/hr/me/performance/"]:visible').first();
    if (await link.count()) {
      await link.click();
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 20_000 });
      await assertNoHorizontalScroll(page);
      const selfTab = page.getByRole('button', { name: /Self Appraisal/i });
      if (await selfTab.count()) {
        await selfTab.click();
        await assertNoHorizontalScroll(page);
        await assertPrimaryActionsVisible(page);
      }
      if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
        await page.screenshot({
          path: path.join(screenshotDir, `employee-self-appraisal-${testInfo.project.name}.png`),
          fullPage: true,
        });
      }
    }
  });
});

test.describe('HR performance responsive QA — HOD', () => {
  test.use({ storageState: path.join(authDir, 'hod.json') });

  test('hod team dashboard', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/performance/team', /Team Performance/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `hod-team-dashboard-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('hod employee review (if available)', async ({ page }, testInfo) => {
    await page.goto('/hr/performance/team/reviews', { waitUntil: 'domcontentloaded' });
    await expect(page.getByRole('heading', { name: /Pending Reviews/i })).toBeVisible({ timeout: 20_000 });
    await assertNoHorizontalScroll(page);
    const link = page.locator('a[href*="/hr/performance/team/appraisals/"]:visible').first();
    if (await link.count()) {
      await link.click();
      await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 20_000 });
      await assertNoHorizontalScroll(page);
      await assertPrimaryActionsVisible(page);
      if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
        await page.screenshot({
          path: path.join(screenshotDir, `hod-employee-review-${testInfo.project.name}.png`),
          fullPage: true,
        });
      }
    }
  });
});

test.describe('HR performance responsive QA — admin', () => {
  test.use({ storageState: path.join(authDir, 'admin.json') });

  test('hr performance dashboard', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/performance', /Performance & Appraisal/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `hr-dashboard-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('hr calibration', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/performance/calibration', /Calibration/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `hr-calibration-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });
});

test.describe('HR performance responsive QA — principal', () => {
  test.use({ storageState: path.join(authDir, 'principal.json') });

  test('principal overview', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/performance/principal', /Institution Performance/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `principal-overview-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });
});
