import { expect, test } from '@playwright/test';
import path from 'node:path';

const API = 'http://127.0.0.1:4000';
const screenshotsDir = path.join(process.cwd(), 'e2e', 'screenshots', 'admissions');

async function loginToken(request: import('@playwright/test').APIRequestContext, email: string) {
  const res = await request.post(`${API}/api/auth/login`, {
    data: { email, password: 'Password123' },
  });
  expect(res.ok(), `login ${email}`).toBeTruthy();
  const json = await res.json();
  return json.token as string;
}

async function staffPage(page: import('@playwright/test').Page, request: import('@playwright/test').APIRequestContext, email = 'qa.admissions.manager@example.edu') {
  const token = await loginToken(request, email);
  await page.addInitScript((value) => localStorage.setItem('survey_token', value), token);
}

async function firstApplicationId(request: import('@playwright/test').APIRequestContext) {
  const token = await loginToken(request, 'qa.admissions.manager@example.edu');
  const res = await request.get(`${API}/api/admissions/applications`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  expect(res.ok()).toBeTruthy();
  const body = await res.json();
  expect(body.applications.length).toBeGreaterThan(0);
  return body.applications[0].id as number;
}

async function expectUsable(page: import('@playwright/test').Page, title: RegExp) {
  await expect(page.getByRole('heading', { name: title }).first()).toBeVisible();
  const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
  expect(overflow, 'no horizontal page overflow').toBeFalsy();
}

function watchConsole(page: import('@playwright/test').Page) {
  const errors: string[] = [];
  page.on('console', (msg) => {
    if (msg.type() === 'error') errors.push(msg.text());
  });
  page.on('pageerror', (err) => errors.push(err.message));
  return errors;
}

async function maybeShot(page: import('@playwright/test').Page, name: string, projectName: string) {
  if (projectName === '1920x1080' || projectName === '390x844') {
    await page.screenshot({ path: path.join(screenshotsDir, `${name}-${projectName}.png`), fullPage: true });
  }
}

test.describe('Admissions responsive authenticated QA', () => {
  test('Admissions Dashboard', async ({ page, request }, testInfo) => {
    const errors = watchConsole(page);
    await staffPage(page, request);
    await page.goto('/admissions');
    await expectUsable(page, /Admissions Dashboard/i);
    await expect(page.getByText(/Program Intake/i)).toBeVisible();
    await maybeShot(page, 'dashboard', testInfo.project.name);
    expect(errors).toEqual([]);
  });

  test('Applications List', async ({ page, request }) => {
    const errors = watchConsole(page);
    await staffPage(page, request);
    await page.goto('/admissions/applications');
    await expectUsable(page, /Applications/i);
    await page.getByPlaceholder(/Search applications/i).fill('QA/ADM/2026');
    await expect(page.locator('table')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('Application Review', async ({ page, request }, testInfo) => {
    const errors = watchConsole(page);
    const id = await firstApplicationId(request);
    await staffPage(page, request);
    await page.goto(`/admissions/applications/${id}`);
    await expect(page.getByText(/Finance Status/i)).toBeVisible();
    await expect(page.getByRole('heading', { name: 'Documents' })).toBeVisible();
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth + 1);
    expect(overflow).toBeFalsy();
    await maybeShot(page, 'application-review', testInfo.project.name);
    expect(errors).toEqual([]);
  });

  test('Document Verification', async ({ page, request }) => {
    const errors = watchConsole(page);
    await staffPage(page, request);
    await page.goto('/admissions/documents');
    await expectUsable(page, /Applications/i);
    await expect(page.locator('table')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('Eligibility and Selection', async ({ page, request }) => {
    const errors = watchConsole(page);
    await staffPage(page, request);
    await page.goto('/admissions/selection');
    await expectUsable(page, /Applications/i);
    await expect(page.locator('table')).toBeVisible();
    expect(errors).toEqual([]);
  });

  test('Intake and Seat Management', async ({ page, request }, testInfo) => {
    const errors = watchConsole(page);
    await staffPage(page, request);
    await page.goto('/admissions/intake');
    await expectUsable(page, /Intake & Seats/i);
    await expect(page.getByText(/Admitted/i).first()).toBeVisible();
    await maybeShot(page, 'intake', testInfo.project.name);
    expect(errors).toEqual([]);
  });

  test('Applicant Portal', async ({ page }, testInfo) => {
    const errors = watchConsole(page);
    await page.goto('/applicant/login');
    await page.getByPlaceholder(/Application number/i).fill('QA/ADM/2026/001');
    await page.getByPlaceholder(/Email/i).fill('qa.admission.1@example.edu');
    await page.getByPlaceholder(/Password/i).fill('Password123');
    await page.getByRole('button', { name: /Sign in/i }).click();
    await page.waitForURL(/\/applicant/);
    await expectUsable(page, /Applicant A Draft/i);
    await page.getByPlaceholder(/File name/i).fill(`portal-${Date.now()}.pdf`);
    await page.getByPlaceholder(/Secure storage key/i).fill(`secure/admissions/playwright/${Date.now()}.pdf`);
    await page.getByRole('button', { name: /Upload/i }).click();
    await expect(page.getByText(/portal-/i).first()).toBeVisible();
    await maybeShot(page, 'applicant-portal', testInfo.project.name);
    expect(errors).toEqual([]);
  });

  test('Principal Management Overview', async ({ page, request }) => {
    const errors = watchConsole(page);
    await staffPage(page, request, 'qa.admissions.management@example.edu');
    await page.goto('/admissions/reports');
    await expectUsable(page, /Admissions Dashboard/i);
    await expect(page.getByRole('heading', { name: 'Pipeline' })).toBeVisible();
    expect(errors).toEqual([]);
  });
});
