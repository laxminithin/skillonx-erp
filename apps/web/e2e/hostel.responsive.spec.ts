import { test, expect, type APIRequestContext, type Locator, type Page } from '@playwright/test';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'hostel');
const API = 'http://127.0.0.1:4000';
const STAFF_PASSWORD = 'Password123';
const STUDENT_PASSWORD = process.env.MOBILE_E2E_STUDENT_PASSWORD || 'Password123';
const shotViewports = ['1440x900', '390x844'];

type AuthKind = 'student' | 'staff';

type Experience = {
  title: string;
  route: string;
  auth: AuthKind;
  email: string;
  password: string;
  heading: RegExp;
  expectedText: RegExp;
  primaryControl: RegExp;
  screenshotName?: string;
  forbiddenControls?: RegExp;
};

const experiences: Experience[] = [
  {
    title: 'Student Hostel Overview',
    route: '/lms/hostel',
    auth: 'student',
    email: 'e2e.approved@student.skillonx.test',
    password: STUDENT_PASSWORD,
    heading: /^Hostel$/i,
    expectedText: /Room|Bed|Block|Resident No|Outstanding|My Room/i,
    primaryControl: /My Room|Outpass|Complaints|Clearance/i,
    screenshotName: 'student-hostel-overview',
    forbiddenControls: /^(Approve|Reject|Waitlist)$/i,
  },
  {
    title: 'Student My Accommodation',
    route: '/lms/hostel/room',
    auth: 'student',
    email: 'e2e.approved@student.skillonx.test',
    password: STUDENT_PASSWORD,
    heading: /My Room/i,
    expectedText: /Room|Bed|Type|Admitted|A-101|A-101-A/i,
    primaryControl: /Room|Bed|Type/i,
    forbiddenControls: /^(Approve|Reject|Waitlist)$/i,
  },
  {
    title: 'Student Hostel Request / Transfer',
    route: '/lms/hostel/apply',
    auth: 'student',
    email: 'e2e.pending@student.skillonx.test',
    password: STUDENT_PASSWORD,
    heading: /Hostel Application/i,
    expectedText: /Room preference|Mess required|rules|declaration/i,
    primaryControl: /Save Draft|Submit Application/i,
    forbiddenControls: /^(Approve|Reject|Waitlist)$/i,
  },
  {
    title: 'Warden Dashboard',
    route: '/hostel',
    auth: 'staff',
    email: 'qa.warden@vviet.edu.in',
    password: STAFF_PASSWORD,
    heading: /Warden Portal/i,
    expectedText: /Action Required|Pending allocations|Available beds|Residents|Open complaints/i,
    primaryControl: /Pending allocations|Residents|Rooms & Beds|Entry \/ Exit/i,
    screenshotName: 'warden-dashboard',
  },
  {
    title: 'Warden Applications / Waitlist',
    route: '/hostel/applications',
    auth: 'staff',
    email: 'qa.warden@vviet.edu.in',
    password: STAFF_PASSWORD,
    heading: /New \/ Pending Allocation/i,
    expectedText: /Application|No pending applications|Approve|Waitlist|Reject|4VV24CS002/i,
    primaryControl: /Approve|Waitlist|Reject|New \/ Pending Allocation/i,
  },
  {
    title: 'Room & Bed Management',
    route: '/hostel/rooms',
    auth: 'staff',
    email: 'qa.warden@vviet.edu.in',
    password: STAFF_PASSWORD,
    heading: /Rooms & Beds/i,
    expectedText: /Block A|Floor|A-101|A-101-A|Available/i,
    primaryControl: /A-101|A-102|A-103/i,
    screenshotName: 'room-bed-management',
  },
  {
    title: 'Resident / Allocation Workspace',
    route: '/hostel/residents',
    auth: 'staff',
    email: 'qa.warden@vviet.edu.in',
    password: STAFF_PASSWORD,
    heading: /Resident Directory/i,
    expectedText: /USN|Name|Room|Bed|Status|4VV24CS001/i,
    primaryControl: /4VV24CS001|A-101|ACTIVE/i,
    screenshotName: 'resident-allocation-workspace',
  },
  {
    title: 'Room Transfer Workspace',
    route: '/hostel/transfers',
    auth: 'staff',
    email: 'qa.warden@vviet.edu.in',
    password: STAFF_PASSWORD,
    heading: /Room Transfers/i,
    expectedText: /Select resident|New available bed|Optional transfer reason/i,
    primaryControl: /Confirm transfer/i,
    screenshotName: 'room-transfer-workspace',
  },
  {
    title: 'Hostel Maintenance Workspace',
    route: '/hostel/maintenance',
    auth: 'staff',
    email: 'qa.warden@vviet.edu.in',
    password: STAFF_PASSWORD,
    heading: /^Maintenance$/i,
    expectedText: /Issue title|Building or block|Hostel maintenance tickets/i,
    primaryControl: /Raise ticket/i,
    screenshotName: 'hostel-maintenance-workspace',
  },
  {
    title: 'Hostel Reports Workspace',
    route: '/hostel/reports',
    auth: 'staff',
    email: 'qa.warden@vviet.edu.in',
    password: STAFF_PASSWORD,
    heading: /Hostel Reports/i,
    expectedText: /Active Residents|Occupancy|Available Beds|Pending Allocation/i,
    primaryControl: /Export residents CSV/i,
    screenshotName: 'hostel-reports-workspace',
  },
  {
    title: 'Principal / Management Hostel Oversight',
    route: '/hostel/management',
    auth: 'staff',
    email: 'qa.management@vviet.edu.in',
    password: STAFF_PASSWORD,
    heading: /Management Analytics/i,
    expectedText: /Read-only|Hostels|Occupancy|Applications|Residents/i,
    primaryControl: /Read-only|Management Analytics/i,
    forbiddenControls: /^(Approve|Reject|Allocate|Checkout|Complete|Assign)$/i,
  },
];

async function login(request: APIRequestContext, experience: Experience) {
  const endpoint = experience.auth === 'student' ? '/api/student-auth/login' : '/api/auth/login';
  const res = await request.post(`${API}${endpoint}`, {
    data: { email: experience.email, password: experience.password },
  });
  expect(res.ok(), `${experience.email} should authenticate via ${endpoint}`).toBeTruthy();
  return (await res.json()).token as string;
}

async function applyToken(page: Page, token: string) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => localStorage.setItem('survey_token', t), token);
}

async function assertNoHorizontalScroll(page: Page) {
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => {
    const doc = document.documentElement;
    const body = document.body;
    return doc.scrollWidth > doc.clientWidth + 2 || body.scrollWidth > body.clientWidth + 2;
  });
  expect(overflow, 'page should not horizontally overflow').toBe(false);
}

async function assertVisibleBoxesStayInViewport(page: Page) {
  const offenders = await page.locator('button:visible, a:visible, input:visible, select:visible, textarea:visible').evaluateAll((nodes) => {
    const width = document.documentElement.clientWidth;
    return nodes
      .map((node) => {
        const rect = node.getBoundingClientRect();
        return { text: (node.textContent || node.getAttribute('placeholder') || node.tagName).trim(), left: rect.left, right: rect.right, width: rect.width };
      })
      .filter((rect) => rect.width > 0 && (rect.left < -2 || rect.right > width + 2));
  });
  expect(offenders, 'visible controls should stay inside viewport').toEqual([]);
}

async function assertContainedTables(page: Page) {
  const escaped = await page.locator('table:visible').evaluateAll((tables) => {
    const width = document.documentElement.clientWidth;
    return tables
      .map((table) => {
        const rect = table.getBoundingClientRect();
        const parent = table.parentElement?.getBoundingClientRect();
        const parentScrollable = table.parentElement
          ? getComputedStyle(table.parentElement).overflowX !== 'visible'
          : false;
        return { right: rect.right, parentRight: parent?.right ?? 0, parentScrollable };
      })
      .filter((t) => t.right > width + 2 && !t.parentScrollable);
  });
  expect(escaped, 'wide tables should be intentionally horizontally contained').toEqual([]);
}

async function expectAnyVisible(locator: Locator) {
  await expect.poll(async () => {
    const matches = await locator.all();
    const visibility = await Promise.all(matches.map((match) => match.isVisible()));
    return visibility.some(Boolean);
  }).toBe(true);
}

async function waitForStablePage(page: Page, experience: Experience) {
  await expect(page).not.toHaveURL(/\/login|\/lms\/login/);
  await expect(page.getByRole('heading', { name: experience.heading }).first()).toBeVisible({ timeout: 20_000 });
  await page.locator('.animate-pulse').first().waitFor({ state: 'detached', timeout: 15_000 }).catch(() => undefined);
  await expectAnyVisible(page.getByText(experience.expectedText));
  await expectAnyVisible(page.getByText(experience.primaryControl));
  if (experience.forbiddenControls) {
    await expect(page.getByRole('button', { name: experience.forbiddenControls })).toHaveCount(0);
    await expect(page.getByRole('link', { name: experience.forbiddenControls })).toHaveCount(0);
  }
}

async function visitAndAssert(page: Page, experience: Experience) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const serverErrors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error' && !/favicon|Failed to load resource: the server responded with a status of 404/.test(msg.text())) {
      consoleErrors.push(msg.text());
    }
  });
  page.on('pageerror', (err) => pageErrors.push(err.message));
  page.on('response', (res) => {
    const url = res.url();
    if (res.status() >= 500 && /\/api\//.test(url)) {
      serverErrors.push(`${res.status()} ${url}`);
    }
  });

  await page.goto(experience.route, { waitUntil: 'domcontentloaded' });
  await waitForStablePage(page, experience);
  await assertNoHorizontalScroll(page);
  await assertVisibleBoxesStayInViewport(page);
  await assertContainedTables(page);

  await page.reload({ waitUntil: 'domcontentloaded' });
  await waitForStablePage(page, experience);
  await assertNoHorizontalScroll(page);
  await assertVisibleBoxesStayInViewport(page);
  await assertContainedTables(page);

  expect(consoleErrors, 'fatal console errors').toEqual([]);
  expect(pageErrors, 'unhandled browser exceptions').toEqual([]);
  expect(serverErrors, 'critical Hostel APIs should not 5xx').toEqual([]);
}

async function maybeScreenshot(page: Page, projectName: string, experience: Experience) {
  if (!experience.screenshotName || !shotViewports.includes(projectName)) return;
  await mkdir(screenshotDir, { recursive: true });
  await page.screenshot({
    path: path.join(screenshotDir, `${experience.screenshotName}-${projectName}.png`),
    fullPage: true,
  });
}

test.describe('Hostel Management responsive freeze QA', () => {
  for (const experience of experiences) {
    test(experience.title, async ({ page, request }, testInfo) => {
      const token = await login(request, experience);
      await applyToken(page, token);
      await visitAndAssert(page, experience);
      await maybeScreenshot(page, testInfo.project.name, experience);
    });
  }

  test('Faculty + Warden identity keeps portal contexts isolated', async ({ page, request }) => {
    const experience: Experience = {
      title: 'Faculty Warden', route: '/hostel', auth: 'staff',
      email: 'qa.faculty.warden@vviet.edu.in', password: STAFF_PASSWORD,
      heading: /Warden Portal/i, expectedText: /Action Required/i, primaryControl: /Pending allocations/i,
    };
    const token = await login(request, experience);

    const denied = await request.get(`${API}/api/hostel/dashboard`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    expect(denied.status()).toBe(403);
    const allowed = await request.get(`${API}/api/hostel/dashboard`, {
      headers: { Authorization: `Bearer ${token}`, 'X-Portal-Context': 'WARDEN' },
    });
    expect(allowed.ok()).toBeTruthy();

    await applyToken(page, token);
    await page.evaluate(() => localStorage.setItem('portal_context', 'WARDEN'));
    await page.goto('/hostel');
    await expect(page.getByRole('heading', { name: /Warden Portal/i })).toBeVisible();
    await expect(page.getByRole('link', { name: /Courses|Assignments|Quizzes|Lesson Plans|Question Bank/i })).toHaveCount(0);

    await page.evaluate(() => localStorage.setItem('portal_context', 'FACULTY'));
    await page.goto('/dashboard');
    await expect(page).toHaveURL(/\/dashboard/);
    await expect(page.getByRole('link', { name: /Warden Portal/i })).toHaveCount(1);
  });

  test('Warden-only identity cannot enter direct Faculty routes', async ({ page, request }) => {
    const experience = experiences.find((item) => item.title === 'Warden Dashboard')!;
    const token = await login(request, experience);
    await applyToken(page, token);
    await page.goto('/courses');
    await expect(page).toHaveURL(/\/hostel$/);
    await expect(page.getByRole('heading', { name: /Warden Portal/i })).toBeVisible();
  });
});
