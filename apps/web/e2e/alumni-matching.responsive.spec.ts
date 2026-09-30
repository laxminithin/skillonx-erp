import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'alumni-matching');
const authDir = path.join(__dirname, '.auth');
const widthsForShot = ['1920x1080', '390x844'];

async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    return doc.scrollWidth > doc.clientWidth + 2;
  });
  expect(overflow, 'body should not horizontally scroll').toBe(false);
}

async function visit(page: Page, route: string, heading: RegExp) {
  for (let attempt = 1; attempt <= 4; attempt++) {
    try {
      await page.goto(route, { waitUntil: 'domcontentloaded' });
      break;
    } catch (err) {
      if (attempt === 4) throw err;
      await page.waitForTimeout(1500 * attempt);
    }
  }
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('h1').filter({ hasText: heading }).first()).toBeVisible({ timeout: 20_000 });
  await page.locator('.animate-pulse').first().waitFor({ state: 'detached', timeout: 10_000 }).catch(() => undefined);
  await page.waitForTimeout(400);
  await assertNoHorizontalScroll(page);
}

async function maybeShot(page: Page, ti: { project: { name: string } }, name: string) {
  if (!widthsForShot.includes(ti.project.name)) return;
  await page.screenshot({ path: path.join(screenshotDir, `${name}-${ti.project.name}.png`), fullPage: true });
}

test.describe('Alumni Matching (C5) responsive QA', () => {
  test.describe('College admin', () => {
    test.use({ storageState: path.join(authDir, 'admin.json') });

    test('matching overview / open needs', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/matching', /Alumni Matching/i);
      await expect(page.getByRole('button', { name: /Open Needs/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Needs Attention/i })).toBeVisible();
      await maybeShot(page, ti, 'matching-overview');
    });

    test('create need form', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/matching', /Alumni Matching/i);
      await page.getByRole('button', { name: /Create Need/i }).click();
      await expect(page.getByTestId('create-need-form')).toBeVisible();
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'matching-create-need');
    });

    test('matching view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/matching?view=MATCHING', /Alumni Matching/i);
      await page.getByRole('button', { name: /^Matching$/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'matching-view');
    });

    test('shortlisted view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/matching?view=SHORTLISTED', /Alumni Matching/i);
      await page.getByRole('button', { name: /^Shortlisted$/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'matching-shortlisted');
    });

    test('engagement in progress view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/matching?view=ENGAGEMENT_IN_PROGRESS', /Alumni Matching/i);
      await page.getByRole('button', { name: /Engagement in Progress/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'matching-engagement');
    });

    test('partially fulfilled / fulfilled views', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/matching?view=PARTIALLY_FULFILLED', /Alumni Matching/i);
      await page.getByRole('button', { name: /Partially Fulfilled/i }).click();
      await page.waitForTimeout(400);
      await assertNoHorizontalScroll(page);
      await page.getByRole('button', { name: /^Fulfilled$/i }).click();
      await page.waitForTimeout(400);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'matching-fulfilment');
    });

    test('needs attention view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/matching?view=NEEDS_ATTENTION', /Alumni Matching/i);
      await page.getByRole('button', { name: /Needs Attention/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'matching-attention');
    });

    test('open need detail when available', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/matching', /Alumni Matching/i);
      const openBtn = page.getByRole('button', { name: /^Open$/i }).first();
      if (await openBtn.isVisible().catch(() => false)) {
        await openBtn.click();
        await expect(page.getByTestId('need-detail')).toBeVisible({ timeout: 15_000 });
        await assertNoHorizontalScroll(page);
        const evaluate = page.getByRole('button', { name: /Evaluate candidates/i });
        if (await evaluate.isVisible()) {
          await evaluate.click();
          await page.waitForTimeout(2000);
          await assertNoHorizontalScroll(page);
          if (await page.getByTestId('candidate-results').isVisible().catch(() => false)) {
            await expect(page.getByTestId('explain-why').first()).toBeVisible();
          }
        }
        await maybeShot(page, ti, 'matching-need-detail');
      } else {
        // No needs yet — at least verify create form opens (create requires live C5 API)
        await page.getByRole('button', { name: /Create Need/i }).click();
        await expect(page.getByTestId('create-need-form')).toBeVisible();
        await expect(page.getByText(/structured matching/i)).toBeVisible();
        await assertNoHorizontalScroll(page);
        await maybeShot(page, ti, 'matching-need-detail');
      }
    });

    test('alumni admin hub still links matching', async ({ page }, ti) => {
      await visit(page, '/alumni-admin', /Alumni/i);
      await expect(page.getByRole('link', { name: /Matching/i })).toBeVisible();
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'alumni-admin-hub');
    });
  });
});
