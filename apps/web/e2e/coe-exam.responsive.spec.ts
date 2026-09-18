import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.join(__dirname, '.auth');
const screenshotDir = path.join(__dirname, 'screenshots', 'coe-exam');
const shotViewports = ['1920x1080', '1024x768', '390x844'] as const;

async function assertNoHorizontalScroll(page: Page) {
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(overflow, 'COE workspace should not horizontally overflow').toBe(false);
}

async function assertPrimaryActionsVisible(page: Page) {
  const controls = page.locator('button:visible, a:visible');
  expect(await controls.count()).toBeGreaterThan(0);
}

async function visitAndShoot(
  page: Page,
  testInfo: { project: { name: string } },
  route: string,
  heading: RegExp,
  shot: string,
) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(600);
  await assertNoHorizontalScroll(page);
  await assertPrimaryActionsVisible(page);
  if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
    await page.screenshot({ path: path.join(screenshotDir, `${shot}-${testInfo.project.name}.png`), fullPage: true });
  }
}

test.describe('Exam Section / COE workspace responsive QA', () => {
  test.use({ storageState: path.join(authDir, 'coe.json') });

  test('dashboard', async ({ page }, ti) => visitAndShoot(page, ti, '/coe', /COE Dashboard/i, 'dashboard'));
  test('examinations', async ({ page }, ti) => visitAndShoot(page, ti, '/coe/examinations', /Examinations/i, 'examinations'));
  test('eligibility', async ({ page }, ti) => visitAndShoot(page, ti, '/coe/eligibility', /Eligibility & Registration/i, 'eligibility'));
  test('timetable', async ({ page }, ti) => visitAndShoot(page, ti, '/coe/timetable', /Timetable/i, 'timetable'));
  test('question papers', async ({ page }, ti) => visitAndShoot(page, ti, '/coe/question-papers', /Question Papers/i, 'question-papers'));
  test('rooms and seating', async ({ page }, ti) => visitAndShoot(page, ti, '/coe/rooms-seating', /Rooms & Seating/i, 'rooms-seating'));
  test('invigilation', async ({ page }, ti) => visitAndShoot(page, ti, '/coe/invigilation', /Invigilation/i, 'invigilation'));
  test('marks', async ({ page }, ti) => visitAndShoot(page, ti, '/coe/marks', /Marks/i, 'marks'));
  test('results', async ({ page }, ti) => visitAndShoot(page, ti, '/coe/results', /Results/i, 'results'));
  test('reports', async ({ page }, ti) => visitAndShoot(page, ti, '/coe/reports', /Reports/i, 'reports'));
});

test.describe('COE workspace RBAC boundary', () => {
  test.use({ storageState: path.join(authDir, 'accountant.json') });

  test('accountant is redirected away from COE operations', async ({ page }) => {
    await page.goto('/coe', { waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/coe/);
    await expect(page.getByRole('heading', { name: /COE Dashboard/i })).toHaveCount(0);
  });
});
