import { test, expect, type Page } from '@playwright/test';
import path from 'node:path';
import { mkdir } from 'node:fs/promises';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const screenshotDir = path.join(__dirname, 'screenshots', 'parent');
const API = 'http://127.0.0.1:4000';

const viewports = [
  { name: '360x740', width: 360, height: 740 },
  { name: '390x844', width: 390, height: 844 },
  { name: '430x932', width: 430, height: 932 },
  { name: '768x1024', width: 768, height: 1024 },
  { name: '1024x768', width: 1024, height: 768 },
  { name: '1366x768', width: 1366, height: 768 },
  { name: '1440x900', width: 1440, height: 900 },
  { name: '1920x1080', width: 1920, height: 1080 },
];

const experiences = [
  { title: 'Dashboard', route: '/parent', text: /Action \/ Attention Required|Overall attendance/i, shot: true },
  { title: 'Multi-child switcher', route: '/parent', text: /Multi Child|Parent|Guardian|Overall attendance/i, switchChild: true, shot: true },
  { title: 'Attendance', route: '/parent/attendance', text: /Overall attendance|Held|Present/i, shot: true },
  { title: 'Academics / CIE', route: '/parent/academics', text: /Academic Snapshot|No parent-visible academic/i, shot: true },
  { title: 'Results', route: '/parent/results', text: /Published Results|No released results/i, shot: true },
  { title: 'Fees', route: '/parent/fees', text: /Outstanding|Recent Receipts|No receipts/i, shot: true },
  { title: 'Campus Services', route: '/parent/campus', text: /Hostel|Transport/i, shot: true },
  { title: 'Notices', route: '/parent/notices', text: /Notices|No notices/i },
  { title: 'Profile', route: '/parent/profile', text: /Profile|Linked Students/i },
];

async function login(page: Page) {
  const res = await page.request.post(`${API}/api/parent-auth/login`, {
    data: { email: 'parent.multi@skillonx.test', password: 'Password123' },
  });
  expect(res.ok(), 'Parent QA login should succeed; run parent backend suite first if missing').toBeTruthy();
  const { token } = await res.json();
  await page.goto('/', { waitUntil: 'domcontentloaded' });
  await page.evaluate((value) => localStorage.setItem('survey_token', value), token);
}

async function assertNoOverflow(page: Page) {
  const viewport = await page.evaluate(() => ({
    width: document.documentElement.clientWidth,
    scrollWidth: Math.max(document.documentElement.scrollWidth, document.body.scrollWidth),
  }));
  expect(viewport.scrollWidth, 'Parent portal should not horizontally overflow').toBeLessThanOrEqual(viewport.width + 2);
  const outOfBounds = await page.locator('button:visible, a:visible, input:visible, select:visible').evaluateAll((nodes) => {
    const width = document.documentElement.clientWidth;
    return nodes
      .map((node) => {
        const box = node.getBoundingClientRect();
        return { left: box.left, right: box.right, text: node.textContent?.trim() || node.getAttribute('aria-label') };
      })
      .filter((box) => box.left < -2 || box.right > width + 2);
  });
  expect(outOfBounds).toEqual([]);
}

test.describe('Parent / Guardian Portal responsive QA', () => {
  test('all major parent experiences across required breakpoints', async ({ page }) => {
    await login(page);
    await mkdir(screenshotDir, { recursive: true });
    let checks = 0;
    const consoleErrors: string[] = [];
    const pageErrors: string[] = [];
    const apiErrors: string[] = [];
    page.on('console', (message) => {
      if (message.type() === 'error' && !/favicon|Failed to load resource.*404/.test(message.text())) consoleErrors.push(message.text());
    });
    page.on('pageerror', (error) => pageErrors.push(error.message));
    page.on('response', (response) => {
      if (response.status() >= 500 && response.url().includes('/api/')) apiErrors.push(`${response.status()} ${response.url()}`);
    });

    for (const viewport of viewports) {
      await page.setViewportSize({ width: viewport.width, height: viewport.height });
      for (const experience of experiences) {
        await page.goto(experience.route, { waitUntil: 'domcontentloaded' });
        await expect(page).not.toHaveURL(/\/login/);
        await expect(page.locator('header').getByText(/Parent Portal/i)).toBeVisible({ timeout: 20_000 });
        await expect(page.locator('main').getByText(experience.text).first()).toBeVisible({ timeout: 20_000 });
        if (experience.switchChild) {
          const before = await page.locator('header h1').textContent();
          const selectedIndex = await page.locator('select[aria-label="Select child"]').evaluate((node) => (node as HTMLSelectElement).selectedIndex);
          await page.locator('select[aria-label="Select child"]').selectOption({ index: selectedIndex === 0 ? 1 : 0 });
          await expect(page.locator('header h1')).not.toHaveText(before || '');
        }
        await assertNoOverflow(page);
        await expect(page.getByRole('button', { name: /Approve|Reject|Allocate|Assign|Generate|Void/i })).toHaveCount(0);
        checks += 1;
        if (experience.shot && ['1920x1080', '1024x768', '390x844'].includes(viewport.name)) {
          await page.screenshot({
            path: path.join(screenshotDir, `${experience.title.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${viewport.name}.png`),
            fullPage: true,
          });
        }
      }
    }

    expect(checks).toBe(viewports.length * experiences.length);
    expect(consoleErrors).toEqual([]);
    expect(pageErrors).toEqual([]);
    expect(apiErrors).toEqual([]);
  });
});
