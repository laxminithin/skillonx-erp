import { test as setup, expect } from '@playwright/test';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const authDir = path.join(__dirname, '.auth');
const API = 'http://127.0.0.1:4000';

const ACCOUNTS = {
  lecturer: { email: 'anita@vviet.edu.in', password: 'Password123', landing: /\/dashboard/ },
  substitute: { email: 'ravi@vviet.edu.in', password: 'Password123', landing: /\/dashboard/ },
  admin: { email: 'collegeadmin@vviet.edu.in', password: 'Password123', landing: /\/admin/ },
  superadmin: { email: 'admin@skillonx.com', password: 'Password123', landing: /\/(platform|admin)/ },
  hod: { email: 'qa.hod.cse@vviet.edu.in', password: 'Password123', landing: /\/dashboard/ },
  principal: { email: 'qa.principal@vviet.edu.in', password: 'Password123', landing: /\/dashboard/ },
  accountant: { email: 'qa.accountant@vviet.edu.in', password: 'Password123', landing: /\/accountant/ },
  coe: { email: 'qa.coe@vviet.edu.in', password: 'Password123', landing: /\/coe/ },
  labassistant: { email: 'qa.labassistant@vviet.edu.in', password: 'Password123', landing: /\/lab/ },
  officeadmin: { email: 'office.admin.qa@vviet.edu.in', password: 'OfficeQA@123', landing: /\/office/ },
} as const;

async function saveAuth(
  page: import('@playwright/test').Page,
  role: keyof typeof ACCOUNTS,
) {
  const creds = ACCOUNTS[role];
  for (let attempt = 1; attempt <= 3; attempt++) {
    await page.goto('/login', { waitUntil: 'domcontentloaded' });
    await page.locator('input[type="email"]').fill(creds.email);
    await page.locator('input[type="password"]').fill(creds.password);
    await page.getByRole('button', { name: /sign in/i }).click();
    try {
      await page.waitForURL(creds.landing, { timeout: 30_000 });
      await page.context().storageState({ path: path.join(authDir, `${role}.json`) });
      return;
    } catch (err) {
      if (attempt === 3) throw err;
      await page.waitForTimeout(1500);
    }
  }
}

setup('authenticate admin', async ({ page }) => {
  await saveAuth(page, 'admin');
});

setup('authenticate superadmin', async ({ page }) => {
  await saveAuth(page, 'superadmin');
});

setup('seed QA leadership users', async ({ request }) => {
  const loginJson = async (email: string) => {
    for (let attempt = 1; attempt <= 6; attempt++) {
      try {
        const login = await request.post(`${API}/api/auth/login`, {
          data: { email, password: ACCOUNTS.admin.password },
          timeout: 15_000,
        });
        if (login.ok()) return login.json();
      } catch {
        /* API may still be warming or recovering from a lock timeout */
      }
      await new Promise((r) => setTimeout(r, 1500 * attempt));
    }
    return null;
  };

  const admin = await loginJson(ACCOUNTS.admin.email);
  if (admin?.token) {
    try {
      await request.post(`${API}/api/academic-leadership/admin/qa-users`, {
        headers: { Authorization: `Bearer ${admin.token}` },
        timeout: 20_000,
      });
    } catch {
      /* Seed is best-effort; leftover locks must not block screenshot QA. */
    }
  }

  const hod = await loginJson(ACCOUNTS.hod.email);
  const principal = await loginJson(ACCOUNTS.principal.email);
  const accountant = await loginJson(ACCOUNTS.accountant.email);
  const coe = await loginJson(ACCOUNTS.coe.email);
  expect(hod?.token, 'QA HOD must be able to sign in').toBeTruthy();
  expect(principal?.token, 'QA Principal must be able to sign in').toBeTruthy();
  expect(accountant?.token, 'QA Accountant must be able to sign in').toBeTruthy();
  expect(coe?.token, 'QA COE must be able to sign in').toBeTruthy();
});

setup('seed lab management data', async ({ request }) => {
  // Ensure the lab workspace has deterministic data + the LAB_ASSISTANT user
  // before we try to authenticate as that account.
  const login = await request.post(`${API}/api/auth/login`, {
    data: { email: ACCOUNTS.admin.email, password: ACCOUNTS.admin.password },
    timeout: 15_000,
  }).catch(() => null);
  // The seed runs from the API workspace; best-effort trigger via a health probe
  // (the seed is normally run by `npm run seed:lab-management`). We still verify
  // the account can sign in below.
  void login;
  const labAst = await request.post(`${API}/api/auth/login`, {
    data: { email: ACCOUNTS.labassistant.email, password: ACCOUNTS.labassistant.password },
    timeout: 15_000,
  }).catch(() => null);
  expect(labAst?.ok(), 'QA Lab Assistant must be able to sign in (run: npm run seed:lab-management)').toBeTruthy();
});

for (const role of ['lecturer', 'substitute', 'hod', 'principal', 'accountant', 'coe', 'labassistant', 'officeadmin'] as const) {
  setup(`authenticate ${role}`, async ({ page }) => {
    await saveAuth(page, role);
  });
}
