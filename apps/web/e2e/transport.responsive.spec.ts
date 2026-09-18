import { test, expect, type APIRequestContext, type Page } from '@playwright/test';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'transport');
const API = 'http://127.0.0.1:4000';
const STUDENT_PASSWORD = process.env.MOBILE_E2E_STUDENT_PASSWORD || 'Password123';
const STAFF_PASSWORD = process.env.OFFICE_QA_PASSWORD || 'OfficeQA@123';
const shotViewports = ['1920x1080', '390x844'];
const tokenCache = new Map<string, string>();

type Experience = {
  title: string;
  route: string;
  auth: 'student' | 'staff';
  email: string;
  password: string;
  heading: RegExp;
  expectedText: RegExp;
  primaryControl: RegExp;
  screenshotName?: string;
  forbiddenControls?: RegExp;
};

const experiences: Experience[] = [
  { title: 'Student Transport Overview', route: '/lms/transport', auth: 'student', email: 'e2e.approved@student.skillonx.test', password: STUDENT_PASSWORD, heading: /^Transport$/i, expectedText: /Route|Pickup|Vehicle|Transport Pass/i, primaryControl: /Transport Pass|My Route|Change Request/i, screenshotName: 'student-overview', forbiddenControls: /^(Approve|Reject|Waitlist)$/i },
  { title: 'Student My Route / Pass', route: '/lms/transport/route', auth: 'student', email: 'e2e.approved@student.skillonx.test', password: STUDENT_PASSWORD, heading: /My Route/i, expectedText: /Vijayanagar|Stop|Route/i, primaryControl: /Vijayanagar|Stop|Transport/i, screenshotName: 'student-route-pass' },
  { title: 'Student Transport Request / Change', route: '/lms/transport/changes', auth: 'student', email: 'e2e.approved@student.skillonx.test', password: STUDENT_PASSWORD, heading: /Change Request/i, expectedText: /Change Type|Reason|Submit Request/i, primaryControl: /Submit Request/i, screenshotName: 'student-request-change' },
  { title: 'Transport Officer Dashboard', route: '/transport', auth: 'staff', email: 'qa.transport.office@vviet.edu.in', password: STAFF_PASSWORD, heading: /Transport Management/i, expectedText: /Active Students|Pending Applications|Active Routes|Vehicles/i, primaryControl: /Applications|Routes|Vehicles/i, screenshotName: 'officer-dashboard' },
  { title: 'Requests / Allocations', route: '/transport/applications', auth: 'staff', email: 'qa.transport.office@vviet.edu.in', password: STAFF_PASSWORD, heading: /Transport Applications/i, expectedText: /Application|Approve|Waitlist|Reject|No pending/i, primaryControl: /Approve|Waitlist|Reject|No pending/i },
  { title: 'Routes / Stops Management', route: '/transport/routes', auth: 'staff', email: 'qa.transport.office@vviet.edu.in', password: STAFF_PASSWORD, heading: /Routes/i, expectedText: /R01|Vijayanagar|VVIET|ACTIVE/i, primaryControl: /R01|Vijayanagar|Routes/i, screenshotName: 'routes-stops' },
  { title: 'Vehicles / Capacity Workspace', route: '/transport/vehicles', auth: 'staff', email: 'qa.transport.office@vviet.edu.in', password: STAFF_PASSWORD, heading: /Vehicles/i, expectedText: /KA-XX-AB-1234|Capacity|ACTIVE/i, primaryControl: /KA-XX-AB-1234|Capacity|Vehicles/i, screenshotName: 'vehicles-capacity' },
  { title: 'Principal / Management Transport Oversight', route: '/transport/management', auth: 'staff', email: 'qa.management@vviet.edu.in', password: 'Password123', heading: /Transport Analytics/i, expectedText: /Executive dashboard|Active Students|Routes|read-only/i, primaryControl: /Analytics|read-only/i, forbiddenControls: /^(Approve|Reject|Allocate|Assign|Generate)$/i },
];

async function login(request: APIRequestContext, experience: Experience) {
  const cacheKey = `${experience.auth}:${experience.email}`;
  const cached = tokenCache.get(cacheKey);
  if (cached) return cached;
  const endpoint = experience.auth === 'student' ? '/api/student-auth/login' : '/api/auth/login';
  const response = await request.post(`${API}${endpoint}`, { data: { email: experience.email, password: experience.password } });
  expect(response.ok(), `${experience.email} should authenticate`).toBeTruthy();
  const token = (await response.json()).token as string;
  tokenCache.set(cacheKey, token);
  return token;
}

async function applyToken(page: Page, token: string) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((value) => localStorage.setItem('survey_token', value), token);
}

async function assertResponsiveSurface(page: Page, experience: Experience) {
  const consoleErrors: string[] = [];
  const pageErrors: string[] = [];
  const apiErrors: string[] = [];
  page.on('console', (message) => { if (message.type() === 'error' && !/favicon|Failed to load resource.*404/.test(message.text())) consoleErrors.push(message.text()); });
  page.on('pageerror', (error) => pageErrors.push(error.message));
  page.on('response', (response) => { if (response.status() >= 500 && response.url().includes('/api/')) apiErrors.push(`${response.status()} ${response.url()}`); });

  for (const load of ['initial load', 'reload']) {
    if (load === 'initial load') await page.goto(experience.route, { waitUntil: 'domcontentloaded' });
    else await page.reload({ waitUntil: 'domcontentloaded' });
    await expect(page).not.toHaveURL(/\/login/);
    await expect(page.getByRole('heading', { name: experience.heading }).first()).toBeVisible({ timeout: 20_000 });
    const main = page.locator('main');
    await expect(main.getByText(experience.expectedText).first()).toBeVisible({ timeout: 15_000 });
    await expect(main.getByText(experience.primaryControl).first()).toBeVisible({ timeout: 15_000 });
    const viewport = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth) }));
    expect(viewport.scrollWidth, 'Transport surface should not horizontally overflow').toBeLessThanOrEqual(viewport.width + 2);
    const outOfBounds = await page.locator('button:visible, a:visible, input:visible, select:visible, textarea:visible').evaluateAll((nodes) => {
      const width = document.documentElement.clientWidth;
      return nodes.map((node) => { const box = node.getBoundingClientRect(); return { left: box.left, right: box.right, text: node.textContent?.trim() }; }).filter((box) => box.left < -2 || box.right > width + 2);
    });
    expect(outOfBounds, 'visible Transport controls should remain usable').toEqual([]);
    if (experience.forbiddenControls) {
      await expect(page.getByRole('button', { name: experience.forbiddenControls })).toHaveCount(0);
      await expect(page.getByRole('link', { name: experience.forbiddenControls })).toHaveCount(0);
    }
  }
  expect(consoleErrors, 'fatal console errors').toEqual([]);
  expect(pageErrors, 'unhandled browser exceptions').toEqual([]);
  expect(apiErrors, 'Transport API responses should not 5xx').toEqual([]);
}

test.describe('Transport Management responsive freeze QA', () => {
  for (const experience of experiences) {
    test(experience.title, async ({ page, request }, testInfo) => {
      const token = await login(request, experience);
      await applyToken(page, token);
      await assertResponsiveSurface(page, experience);
      if (experience.screenshotName && shotViewports.includes(testInfo.project.name)) {
        await mkdir(screenshotDir, { recursive: true });
        await page.screenshot({ path: path.join(screenshotDir, `${experience.screenshotName}-${testInfo.project.name}.png`), fullPage: true });
      }
    });
  }
});
