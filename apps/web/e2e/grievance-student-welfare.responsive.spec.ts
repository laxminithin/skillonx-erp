import { test, expect, type Page, type APIRequestContext } from '@playwright/test';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'grievance-student-welfare');
const API = 'http://127.0.0.1:4000';
const PASSWORD = 'Password123';
const widthsForShot = ['1920x1080', '390x844'];

async function login(request: APIRequestContext, email: string) {
  const res = await request.post(`${API}/api/auth/login`, { data: { email, password: PASSWORD } });
  expect(res.ok(), `${email} should authenticate`).toBeTruthy();
  return (await res.json()).token as string;
}

async function asStaff(page: Page, token: string) {
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((t) => localStorage.setItem('survey_token', t), token);
}

async function assertNoHorizontalScroll(page: Page) {
  await page.waitForTimeout(300);
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 2);
  expect(overflow, 'body should not horizontally scroll').toBe(false);
}

async function visit(page: Page, route: string, heading: RegExp) {
  const errors: string[] = [];
  page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
  await page.goto(route, { waitUntil: 'networkidle' });
  await expect(page).not.toHaveURL(/\/login/);
  await expect(page.locator('h1').filter({ hasText: heading }).first()).toBeVisible();
  await assertNoHorizontalScroll(page);
  expect(errors.filter((e) => !e.includes('favicon'))).toEqual([]);
}

async function maybeShot(page: Page, projectName: string, name: string) {
  if (!widthsForShot.includes(projectName)) return;
  await mkdir(screenshotDir, { recursive: true });
  await page.screenshot({ path: path.join(screenshotDir, `${name}-${projectName}.png`), fullPage: true });
}

async function findCase(request: APIRequestContext, token: string, category?: string) {
  const list = await request.get(`${API}/api/student-services/grievances`, { headers: { Authorization: `Bearer ${token}` } });
  expect(list.ok()).toBeTruthy();
  const body = await list.json();
  const match = category ? body.grievances?.find((g: { category: string }) => g.category === category) : body.grievances?.[0];
  expect(match?.id, 'seeded grievance case should exist').toBeTruthy();
  return match.id as number;
}

test.describe('Grievance & Student Welfare responsive QA', () => {
  test('1. officer queue dashboard', async ({ page, request }, ti) => {
    const token = await login(request, 'grievance.officer@grv.test');
    await asStaff(page, token);
    await visit(page, '/student-services/grievances', /Grievance & Welfare Workspace/i);
    await expect(page.locator('p').filter({ hasText: /^Restricted$/ }).first()).toBeVisible();
    await maybeShot(page, ti.project.name, 'officer-queue');
  });

  test('2. status filter remains usable', async ({ page, request }, ti) => {
    const token = await login(request, 'grievance.officer@grv.test');
    await asStaff(page, token);
    await visit(page, '/student-services/grievances', /Grievance & Welfare Workspace/i);
    await page.locator('select').nth(0).selectOption('SUBMITTED');
    await assertNoHorizontalScroll(page);
    await maybeShot(page, ti.project.name, 'status-filter');
  });

  test('3. category filter remains usable', async ({ page, request }, ti) => {
    const token = await login(request, 'grievance.officer@grv.test');
    await asStaff(page, token);
    await visit(page, '/student-services/grievances', /Grievance & Welfare Workspace/i);
    await page.locator('select').nth(1).selectOption('HARASSMENT');
    await assertNoHorizontalScroll(page);
    await maybeShot(page, ti.project.name, 'category-filter');
  });

  test('4. search field handles case numbers', async ({ page, request }, ti) => {
    const token = await login(request, 'grievance.officer@grv.test');
    await asStaff(page, token);
    await visit(page, '/student-services/grievances', /Grievance & Welfare Workspace/i);
    await page.getByPlaceholder('Search case number').fill('GRV');
    await assertNoHorizontalScroll(page);
    await maybeShot(page, ti.project.name, 'search');
  });

  test('5. normal case detail workspace', async ({ page, request }, ti) => {
    const token = await login(request, 'grievance.officer@grv.test');
    const caseId = await findCase(request, token, 'GENERAL_GRIEVANCE');
    await asStaff(page, token);
    await visit(page, `/student-services/grievances/${caseId}`, /Responsive|case|GENERAL/i);
    await expect(page.getByText('Requester Communication')).toBeVisible();
    await maybeShot(page, ti.project.name, 'normal-detail');
  });

  test('6. attachment panel stays responsive', async ({ page, request }, ti) => {
    const token = await login(request, 'grievance.officer@grv.test');
    const caseId = await findCase(request, token);
    await asStaff(page, token);
    await visit(page, `/student-services/grievances/${caseId}`, /Responsive|case|GENERAL/i);
    await expect(page.getByRole('heading', { name: 'Attachments' })).toBeVisible();
    await assertNoHorizontalScroll(page);
    await maybeShot(page, ti.project.name, 'attachments');
  });

  test('7. restricted case detail is redaction-safe', async ({ page, request }, ti) => {
    const token = await login(request, 'grievance.officer@grv.test');
    const caseId = await findCase(request, token, 'HARASSMENT');
    await asStaff(page, token);
    await visit(page, `/student-services/grievances/${caseId}`, /Responsive|Restricted|HARASSMENT/i);
    await expect(page.getByText(/RESTRICTED|Restricted/i).first()).toBeVisible();
    await maybeShot(page, ti.project.name, 'restricted-detail');
  });

  test('8. unauthorized operational roles are denied raw grievance APIs', async ({ request }) => {
    const accountant = await login(request, 'qa.accountant@vviet.edu.in');
    const res = await request.get(`${API}/api/student-services/grievances`, { headers: { Authorization: `Bearer ${accountant}` } });
    expect(res.status()).toBe(403);
  });
});
