import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'hr-recruitment');
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

test.describe('HR recruitment responsive QA — admin', () => {
  test.use({ storageState: path.join(authDir, 'admin.json') });

  test('recruitment dashboard', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/recruitment', /Recruitment/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `hr-dashboard-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('requisitions', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/recruitment/requisitions', /Requisitions/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `requisitions-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('openings', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/recruitment/openings', /Job Openings|Openings/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `openings-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('pipeline', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/recruitment/pipeline', /Pipeline/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `pipeline-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('interviews and offers', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/hr/recruitment/interviews', /Interviews/i);
    await visitAndAssert(page, '/hr/recruitment/offers', /Offers/i);
    await visitAndAssert(page, '/hr/recruitment/reports', /Reports/i);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.goto('/hr/recruitment/offers', { waitUntil: 'domcontentloaded' });
      await expect(page.getByRole('heading', { name: /Offers/i })).toBeVisible({ timeout: 20_000 });
      await page.screenshot({
        path: path.join(screenshotDir, `offers-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });

  test('hod and my interviews', async ({ page }) => {
    await visitAndAssert(page, '/hr/recruitment/hod', /Department Recruitment|Recruitment/i);
    await visitAndAssert(page, '/hr/recruitment/my-interviews', /My Interviews/i);
  });
});

test.describe('HR recruitment responsive QA — public careers', () => {
  test('careers listing and portal', async ({ page }, testInfo) => {
    await visitAndAssert(page, '/careers', /Careers/i);
    await assertNoHorizontalScroll(page);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `careers-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }

    await visitAndAssert(page, '/careers/portal', /Candidate Portal/i);
    await assertNoHorizontalScroll(page);
    if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
      await page.screenshot({
        path: path.join(screenshotDir, `portal-${testInfo.project.name}.png`),
        fullPage: true,
      });
    }
  });
});
