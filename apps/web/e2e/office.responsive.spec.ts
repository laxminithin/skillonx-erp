import { test, expect } from '@playwright/test';

const experiences = [
  ['Office Dashboard', '/office'],
  ['Request Inbox', '/office/requests'],
  ['Request Workspace', '/office/requests'],
  ['Student Services', '/student-services'],
  ['Issued Documents', '/office/documents'],
  ['Inward Register', '/office/inward'],
  ['Outward Register', '/office/outward'],
  ['Principal / Management Office View', '/office'],
] as const;

test.use({ storageState: 'e2e/.auth/officeadmin.json' });

for (const [name, path] of experiences) {
  test(name, async ({ page }, testInfo) => {
    const errors: string[] = [];
    page.on('console', (msg) => { if (msg.type() === 'error') errors.push(msg.text()); });
    await page.goto(path, { waitUntil: 'networkidle' });
    if (name === 'Request Workspace') {
      const first = page.locator('a[href^="/office/requests/"]').first();
      if (await first.count()) await first.click();
    }
    await expect(page.locator('body')).toBeVisible();
    const nav = page.locator('nav:visible').first();
    if (!(await nav.isVisible().catch(() => false))) {
      await page.getByRole('button', { name: 'Open menu' }).click();
    }
    await expect(page.locator('nav:visible').first()).toBeVisible();
    const width = testInfo.project.use.viewport?.width ?? 0;
    expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(width);
    expect(errors.filter((e) => !e.includes('favicon'))).toEqual([]);
    await page.reload({ waitUntil: 'networkidle' });
    await expect(page.locator('body')).toBeVisible();
    if ((testInfo.project.name === '1920x1080' || testInfo.project.name === '390x844') && (name === 'Office Dashboard' || name === 'Request Workspace' || name === 'Student Services' || name === 'Inward Register')) {
      await page.screenshot({ path: `test-results/office-${name.toLowerCase().replace(/[^a-z0-9]+/g, '-')}-${testInfo.project.name}.png`, fullPage: true });
    }
  });
}
