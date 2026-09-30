import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'alumni-engagement');
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

test.describe('Alumni Engagement (C4) responsive QA', () => {
  test.describe('College admin', () => {
    test.use({ storageState: path.join(authDir, 'admin.json') });

    test('engagement overview', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/engagement', /Alumni Engagement/i);
      await expect(page.getByRole('button', { name: /^Overview$/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /^Programs$/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Manual Outreach/i })).toBeVisible();
      await maybeShot(page, ti, 'engagement-overview');
    });

    test('calendar view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/engagement?view=CALENDAR', /Alumni Engagement/i);
      await page.getByRole('button', { name: /^Calendar$/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'engagement-calendar');
    });

    test('programs view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/engagement?view=PROGRAMS', /Alumni Engagement/i);
      await page.getByRole('button', { name: /^Programs$/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'engagement-programs');
    });

    test('campaigns view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/engagement?view=CAMPAIGNS', /Alumni Engagement/i);
      await page.getByRole('button', { name: /^Campaigns$/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'engagement-campaigns');
    });

    test('manual outreach view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/engagement?view=MANUAL_OUTREACH', /Alumni Engagement/i);
      await page.getByRole('button', { name: /Manual Outreach/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'engagement-manual');
    });

    test('responses view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/engagement?view=RESPONSES', /Alumni Engagement/i);
      await page.getByRole('button', { name: /^Responses$/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'engagement-responses');
    });

    test('approvals view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/engagement?view=APPROVALS', /Alumni Engagement/i);
      await page.getByRole('button', { name: /^Approvals$/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'engagement-approvals');
    });

    test('templates view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/engagement?view=TEMPLATES', /Alumni Engagement/i);
      await page.getByRole('button', { name: /^Templates$/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'engagement-templates');
    });

    test('admin alumni 360 has engagement section link', async ({ page }, ti) => {
      await visit(page, '/alumni-admin', /Alumni Administration/i);
      await expect(page.getByRole('link', { name: /Engagement/i })).toBeVisible();
      await maybeShot(page, ti, 'alumni-admin-hub');
    });
  });

  test('login-less engage page loads for invalid token without crash', async ({ page }, ti) => {
    await page.goto('/alumni/engage/not-a-real-token-xxxxxxxxxxxxxxxx', { waitUntil: 'domcontentloaded' });
    await page.waitForTimeout(800);
    await assertNoHorizontalScroll(page);
    await maybeShot(page, ti, 'engage-response-invalid');
  });
});
