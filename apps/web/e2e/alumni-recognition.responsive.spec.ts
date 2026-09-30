import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import fs from 'node:fs';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'alumni-recognition');
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

test.describe('Alumni Recognition (C6) responsive QA', () => {
  test.describe('College admin', () => {
    test.use({ storageState: path.join(authDir, 'admin.json') });

    test('recognition overview', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/recognition', /Alumni Recognition/i);
      await expect(page.getByRole('button', { name: /Overview/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Review Queue/i })).toBeVisible();
      await maybeShot(page, ti, 'recognition-overview');
    });

    test('programs view + create form', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/recognition?view=PROGRAMS', /Alumni Recognition/i);
      await page.getByRole('button', { name: /^Programs$/i }).click();
      await page.waitForTimeout(400);
      await page.getByRole('button', { name: /Create Program/i }).first().click();
      await expect(page.getByTestId('create-program-form')).toBeVisible();
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'recognition-programs');
    });

    test('nominations view + create form', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/recognition?view=NOMINATIONS', /Alumni Recognition/i);
      await page.getByRole('button', { name: /^Nominations$/i }).click();
      await page.waitForTimeout(400);
      await page.getByRole('button', { name: /Create Nomination/i }).first().click();
      await expect(page.getByTestId('create-nomination-form')).toBeVisible();
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'recognition-nominations');
    });

    test('review queue view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/recognition?view=REVIEW_QUEUE', /Alumni Recognition/i);
      await page.getByRole('button', { name: /Review Queue/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'recognition-review-queue');
    });

    test('recognitions view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/recognition?view=RECOGNITIONS', /Alumni Recognition/i);
      await page.getByRole('button', { name: /^Recognitions$/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'recognition-recognitions');
    });

    test('spotlights view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/recognition?view=SPOTLIGHTS', /Alumni Recognition/i);
      await page.getByRole('button', { name: /^Spotlights$/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'recognition-spotlights');
    });

    test('value offerings view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/recognition?view=VALUE_OFFERINGS', /Alumni Recognition/i);
      await page.getByRole('button', { name: /Value Offerings/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'recognition-value');
    });

    test('communities view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/recognition?view=COMMUNITIES', /Alumni Recognition/i);
      await page.getByRole('button', { name: /^Communities$/i }).click();
      await page.waitForTimeout(500);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'recognition-communities');
    });

    test('reciprocity view', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/recognition?view=RECIPROCITY', /Alumni Recognition/i);
      await page.getByRole('button', { name: /^Reciprocity$/i }).click();
      await page.waitForTimeout(500);
      await expect(page.getByText(/factual lists|no score|Look up alumni reciprocity/i).first()).toBeVisible();
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'recognition-reciprocity');
    });

    test('alumni admin hub links recognition', async ({ page }, ti) => {
      await visit(page, '/alumni-admin', /Alumni/i);
      await expect(page.getByRole('link', { name: /Recognition/i })).toBeVisible();
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'alumni-admin-hub');
    });
  });

  test.describe('Alumni self (optional)', () => {
    const alumniAuth = path.join(authDir, 'alumni.json');
    const hasAlumniAuth = fs.existsSync(alumniAuth);

    test.skip(!hasAlumniAuth, 'alumni.json auth state not present');

    if (hasAlumniAuth) {
      test.use({ storageState: alumniAuth });
    }

    test('alumni recognition self page', async ({ page }, ti) => {
      await visit(page, '/alumni/recognition', /Recognition/i);
      await expect(page.getByTestId('self-recognition')).toBeVisible();
      await expect(page.getByTestId('self-opportunities')).toBeVisible();
      await expect(page.getByTestId('self-community')).toBeVisible();
      await expect(page.getByTestId('self-contributions')).toBeVisible();
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'alumni-self-recognition');
    });
  });
});
