import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'mentoring');
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
  await page.waitForTimeout(400); // allow layout/animation to settle before measuring overflow
  await assertNoHorizontalScroll(page);
}

async function maybeShot(page: Page, ti: { project: { name: string } }, name: string) {
  if (!widthsForShot.includes(ti.project.name)) return;
  await page.screenshot({ path: path.join(screenshotDir, `${name}-${ti.project.name}.png`), fullPage: true });
}

async function firstMenteeId(page: Page): Promise<number | null> {
  // Must be on the app origin before localStorage is readable.
  if (!/^http/.test(page.url())) await page.goto('/mentoring', { waitUntil: 'domcontentloaded' });
  const token = await page.evaluate(() => localStorage.getItem('survey_token'));
  if (!token) return null;
  const res = await page.request.get('http://127.0.0.1:4000/api/mentoring/mentees', {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!res.ok()) return null;
  const body = await res.json();
  return body.mentees?.[0]?.studentId ?? null;
}

test.describe('Mentoring & Student Advisory responsive QA', () => {
  test.describe('Mentor', () => {
    test.use({ storageState: path.join(authDir, 'lecturer.json') });

    test('mentor dashboard', async ({ page }, ti) => {
      await visit(page, '/mentoring', /Mentoring & Student Advisory/i);
      await expect(page.getByText('Who needs my attention today?')).toBeVisible();
      await expect(page.getByRole('heading', { name: 'My mentees' })).toBeVisible();
      await maybeShot(page, ti, 'mentor-dashboard');
    });

    test('student 360 with explainable risk', async ({ page }, ti) => {
      const id = await firstMenteeId(page);
      test.skip(!id, 'no mentee assigned in this environment');
      await visit(page, `/mentoring/students/${id}`, /.+/);
      // Risk must be explainable — the "why" panel and dimension grid are present.
      await expect(page.getByText('Why this attention level?')).toBeVisible();
      await expect(page.getByRole('button', { name: /Record session/i })).toBeVisible();
      await maybeShot(page, ti, 'student-360');
    });
  });

  test.describe('HOD', () => {
    test.use({ storageState: path.join(authDir, 'hod.json') });
    test('department mentoring', async ({ page }, ti) => {
      await visit(page, '/hod/mentoring', /Department Mentoring/i);
      await expect(page.getByText('Mentor workload')).toBeVisible();
      await maybeShot(page, ti, 'hod-mentoring');
    });
  });

  test.describe('Principal', () => {
    test.use({ storageState: path.join(authDir, 'principal.json') });
    test('institution mentoring oversight', async ({ page }, ti) => {
      await visit(page, '/principal/mentoring', /Institution Mentoring Oversight/i);
      await expect(page.getByText('Department comparison')).toBeVisible();
      await maybeShot(page, ti, 'principal-mentoring');
    });
  });

  test.describe('Management (executive)', () => {
    test.use({ storageState: path.join(authDir, 'principal.json') });
    test('mentoring analytics (de-identified)', async ({ page }, ti) => {
      await visit(page, '/management/mentoring', /Mentoring & Student Advisory Analytics/i);
      await expect(page.getByText('Attention distribution')).toBeVisible();
      await maybeShot(page, ti, 'management-mentoring');
    });
  });

  test.describe('RBAC isolation', () => {
    test.use({ storageState: path.join(authDir, 'accountant.json') });
    test('accountant is denied mentoring oversight', async ({ page }) => {
      const token = await page.request
        .post('http://127.0.0.1:4000/api/auth/login', { data: { email: 'qa.accountant@vviet.edu.in', password: 'Password123' } })
        .then((r) => r.json())
        .then((j) => j.token as string);
      const hod = await page.request.get('http://127.0.0.1:4000/api/mentoring/hod', { headers: { Authorization: `Bearer ${token}` } });
      expect(hod.status(), 'accountant must not read HOD mentoring').toBe(403);
      // student 360 for any student must also be denied
      const s360 = await page.request.get('http://127.0.0.1:4000/api/mentoring/students/76', { headers: { Authorization: `Bearer ${token}` } });
      expect([403, 404]).toContain(s360.status());
    });
  });
});
