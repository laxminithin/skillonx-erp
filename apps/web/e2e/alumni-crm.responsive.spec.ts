import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'alumni-crm');
const authDir = path.join(__dirname, '.auth');
const widthsForShot = ['1920x1080', '390x844'];
const API = 'http://127.0.0.1:4000';

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

async function firstAlumni360Href(page: Page): Promise<string | null> {
  await page.goto('/alumni-admin', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('h1').filter({ hasText: /Alumni Administration/i }).first()).toBeVisible({ timeout: 20_000 });
  const link = page.locator('a[href*="/alumni-admin/profiles/"][href$="/360"]').first();
  if (!(await link.count())) {
    // Fallback: API list (no contact fields needed)
    const token = await page.evaluate(() => localStorage.getItem('survey_token'));
    if (!token) return null;
    const res = await page.request.get(`${API}/api/alumni-admin/profiles?limit=5`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    if (!res.ok()) return null;
    const body = await res.json();
    const id = body.profiles?.[0]?.id;
    return id ? `/alumni-admin/profiles/${id}/360` : null;
  }
  return (await link.getAttribute('href')) || null;
}

test.describe('Alumni 360 + CRM responsive QA', () => {
  test.describe('College admin', () => {
    test.use({ storageState: path.join(authDir, 'admin.json') });

    test('alumni admin shell', async ({ page }, ti) => {
      await visit(page, '/alumni-admin', /Alumni Administration/i);
      await expect(page.getByRole('link', { name: /CRM workspace/i })).toBeVisible();
      await maybeShot(page, ti, 'alumni-admin');
    });

    test('CRM workspace views', async ({ page }, ti) => {
      await visit(page, '/alumni-admin/crm', /Alumni Relationship CRM/i);
      await expect(page.getByRole('button', { name: /My Follow-ups/i })).toBeVisible();
      await expect(page.getByRole('button', { name: /Overdue/i })).toBeVisible();
      await page.getByRole('button', { name: /Active Opportunities/i }).click();
      await page.waitForTimeout(400);
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'crm-workspace');
    });

    test('Alumni 360 admin with CRM sections', async ({ page }, ti) => {
      const href = await firstAlumni360Href(page);
      test.skip(!href, 'no alumni profiles in this environment');
      await visit(page, href!, /Alumni 360/i);
      await expect(
        page.getByText(/Institutional Alumni 360|Relationship status|Institutional relationship|My institutional engagement/i).first(),
      ).toBeVisible({ timeout: 20_000 });
      const timeline = page.getByText('Timeline', { exact: true }).first();
      if (await timeline.isVisible().catch(() => false)) {
        await timeline.click();
        await page.waitForTimeout(200);
      }
      await assertNoHorizontalScroll(page);
      await maybeShot(page, ti, 'alumni-360-admin');
    });
  });

  test.describe('RBAC isolation', () => {
    test.use({ storageState: path.join(authDir, 'accountant.json') });

    test('accountant denied CRM workspace API', async ({ page }) => {
      const login = await page.request.post(`${API}/api/auth/login`, {
        data: { email: 'qa.accountant@vviet.edu.in', password: 'Password123' },
      });
      expect(login.ok(), 'accountant must authenticate for negative CRM check').toBeTruthy();
      const token = (await login.json()).token as string;
      expect(token).toBeTruthy();
      const ws = await page.request.get(`${API}/api/alumni-admin/crm/workspace`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      // Must not succeed; 403 preferred, 401 acceptable if middleware rejects role early
      expect(ws.ok()).toBeFalsy();
      expect([401, 403]).toContain(ws.status());
    });
  });
});
