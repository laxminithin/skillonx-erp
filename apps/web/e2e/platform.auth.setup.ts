import { test as setup } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.join(__dirname, '.auth');

setup('authenticate platform superadmin', async ({ page }) => {
  await page.goto('/login', { waitUntil: 'domcontentloaded' });
  await page.locator('input[type="email"]').fill('admin@skillonx.com');
  await page.locator('input[type="password"]').fill('Password123');
  await page.getByRole('button', { name: /sign in/i }).click();
  await page.waitForURL(/\/(platform|admin)/, { timeout: 45_000 });
  await page.context().storageState({ path: path.join(authDir, 'superadmin.json') });
});
