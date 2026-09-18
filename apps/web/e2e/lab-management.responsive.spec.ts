import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'lab');
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
    try { await page.goto(route, { waitUntil: 'domcontentloaded' }); break; }
    catch (err) { if (attempt === 4) throw err; await page.waitForTimeout(1500 * attempt); }
  }
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('h1').filter({ hasText: heading }).first()).toBeVisible({ timeout: 20_000 });
  await page.locator('.skeleton').first().waitFor({ state: 'detached', timeout: 10_000 }).catch(() => undefined);
  await page.waitForTimeout(400);
  await assertNoHorizontalScroll(page);
}

async function maybeShot(page: Page, ti: { project: { name: string } }, name: string) {
  if (!widthsForShot.includes(ti.project.name)) return;
  await page.screenshot({ path: path.join(screenshotDir, `${name}-${ti.project.name}.png`), fullPage: true });
}

test.describe('Lab Assistant / Laboratory Management responsive QA', () => {
  test.describe('Lab Assistant', () => {
    test.use({ storageState: path.join(authDir, 'labassistant.json') });

    test('dashboard', async ({ page }, ti) => {
      await visit(page, '/lab', /Lab Dashboard/i);
      await expect(page.getByText('Action required')).toBeVisible();
      await expect(page.getByText('Lab health')).toBeVisible();
      await maybeShot(page, ti, 'dashboard');
    });

    test('labs', async ({ page }, ti) => {
      await visit(page, '/lab/labs', /^Labs$/i);
      await expect(page.getByText('SX-E2E-LAB-CSE').first()).toBeVisible();
      await maybeShot(page, ti, 'labs');
    });

    test('asset register + detail', async ({ page }, ti) => {
      await visit(page, '/lab/assets', /^Assets$/i);
      await expect(page.getByText('SX-LAB-PC-01').first()).toBeVisible();
      await maybeShot(page, ti, 'assets');
      await page.getByText('SX-LAB-PC-01').first().click();
      await expect(page.getByText('History').first()).toBeVisible({ timeout: 10_000 });
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'asset-detail');
    });

    test('stock', async ({ page }, ti) => {
      await visit(page, '/lab/stock', /Inventory \/ Stock/i);
      await expect(page.getByText('Low stock only')).toBeVisible();
      await maybeShot(page, ti, 'stock');
    });

    test('issue & return', async ({ page }, ti) => {
      await visit(page, '/lab/issues', /Issue & Return/i);
      await expect(page.getByText('Overdue only')).toBeVisible();
      await maybeShot(page, ti, 'issues');
    });

    test('sessions', async ({ page }, ti) => {
      await visit(page, '/lab/sessions', /Practical Sessions/i);
      await maybeShot(page, ti, 'sessions');
    });

    test('faults & repairs', async ({ page }, ti) => {
      await visit(page, '/lab/faults', /Faults & Repairs/i);
      await maybeShot(page, ti, 'faults');
    });

    test('software', async ({ page }, ti) => {
      await visit(page, '/lab/software', /^Software$/i);
      await maybeShot(page, ti, 'software');
    });

    test('requirements', async ({ page }, ti) => {
      await visit(page, '/lab/requirements', /^Requirements$/i);
      await maybeShot(page, ti, 'requirements');
    });

    test('reports', async ({ page }, ti) => {
      await visit(page, '/lab/reports', /^Reports$/i);
      await maybeShot(page, ti, 'reports');
    });

    test('direct reload keeps the workspace', async ({ page }) => {
      await visit(page, '/lab/assets', /^Assets$/i);
      await page.reload({ waitUntil: 'domcontentloaded' });
      await expect(page).not.toHaveURL(/\/login/);
      await expect(page.locator('h1').filter({ hasText: /Assets/i }).first()).toBeVisible({ timeout: 20_000 });
    });
  });

  test.describe('HOD oversight', () => {
    test.use({ storageState: path.join(authDir, 'hod.json') });
    test('lab oversight', async ({ page }, ti) => {
      await visit(page, '/lab/oversight', /Lab Oversight/i);
      await expect(page.getByText('Department comparison')).toBeVisible();
      await maybeShot(page, ti, 'hod-oversight');
    });
  });

  test.describe('Principal oversight', () => {
    test.use({ storageState: path.join(authDir, 'principal.json') });
    test('institution oversight', async ({ page }, ti) => {
      await visit(page, '/lab/oversight', /Lab Oversight/i);
      await expect(page.getByText('Lab health')).toBeVisible();
      await maybeShot(page, ti, 'principal-oversight');
    });
  });

  test.describe('Access control', () => {
    test.use({ storageState: path.join(authDir, 'accountant.json') });
    test('accountant cannot operate the lab dashboard', async ({ page }) => {
      await page.goto('/lab', { waitUntil: 'domcontentloaded' });
      // Accountant is redirected away from /lab OR sees an empty/denied state — never the operational dashboard data.
      await page.waitForTimeout(800);
      const onAccountant = /\/accountant/.test(page.url());
      const deniedOrEmpty = await page.getByText(/Unable to load dashboard|do not have permission/i).count();
      expect(onAccountant || deniedOrEmpty > 0).toBeTruthy();
    });
  });
});
