import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'management');
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
}

const shotViewports = ['1920x1080', '1024x768', '390x844'] as const;

async function visitAndShoot(
  page: Page,
  testInfo: { project: { name: string } },
  route: string,
  heading: RegExp,
  shot: string,
) {
  await page.goto(route, { waitUntil: 'domcontentloaded' });
  await expect(page.getByRole('heading', { name: heading }).first()).toBeVisible({ timeout: 20_000 });
  await page.waitForTimeout(600); // let charts / async KPIs settle
  await assertNoHorizontalScroll(page);
  await assertPrimaryActionsVisible(page);
  if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
    await page.screenshot({ path: path.join(screenshotDir, `${shot}-${testInfo.project.name}.png`), fullPage: true });
  }
}

// The Management & Executive Portal lives in the faculty AppLayout shell.
// Platform admins (COLLEGE_ADMIN / SUPER_ADMIN) render the separate AdminLayout,
// so responsive QA runs as the Principal — a genuine executive user that holds
// the full management view surface plus approvals.act and reaches every page.
test.describe('Management & Executive Portal responsive QA — Principal (executive)', () => {
  test.use({ storageState: path.join(authDir, 'principal.json') });

  test('command center', async ({ page }, ti) => visitAndShoot(page, ti, '/management', /Institution Command Center/i, 'overview'));
  test('academics', async ({ page }, ti) => visitAndShoot(page, ti, '/management/academics', /Academic Overview/i, 'academics'));
  test('workforce', async ({ page }, ti) => visitAndShoot(page, ti, '/management/workforce', /Workforce/i, 'workforce'));
  test('recruitment', async ({ page }, ti) => visitAndShoot(page, ti, '/management/recruitment', /Recruitment/i, 'recruitment'));
  test('performance', async ({ page }, ti) => visitAndShoot(page, ti, '/management/performance', /Performance/i, 'performance'));
  test('learning & development', async ({ page }, ti) => visitAndShoot(page, ti, '/management/ld', /Learning & Development/i, 'ld'));
  test('succession', async ({ page }, ti) => visitAndShoot(page, ti, '/management/succession', /Succession/i, 'succession'));
  test('placement', async ({ page }, ti) => visitAndShoot(page, ti, '/management/placement', /Training & Placement/i, 'placement'));
  test('finance', async ({ page }, ti) => visitAndShoot(page, ti, '/management/finance', /Institutional Finance/i, 'finance'));
  test('payroll summary', async ({ page }, ti) => visitAndShoot(page, ti, '/management/payroll', /Payroll Executive Summary/i, 'payroll'));
  test('campus', async ({ page }, ti) => visitAndShoot(page, ti, '/management/campus', /Campus Services/i, 'campus'));
  test('approvals', async ({ page }, ti) => visitAndShoot(page, ti, '/management/approvals', /Executive Approval Inbox/i, 'approvals'));
  test('risks & exceptions', async ({ page }, ti) => visitAndShoot(page, ti, '/management/exceptions', /Risks & Exceptions/i, 'exceptions'));
  test('department scorecards', async ({ page }, ti) => visitAndShoot(page, ti, '/management/departments', /Department Scorecards/i, 'departments'));
  test('reports', async ({ page }, ti) => visitAndShoot(page, ti, '/management/reports', /Executive Reports/i, 'reports'));
});
