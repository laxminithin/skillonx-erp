# Instructions

- Following Playwright test failed.
- Explain why, be concise, respect Playwright best practices.
- Provide a snippet of code with the fix, if possible.

# Test info

- Name: hr-performance.responsive.spec.ts >> HR performance responsive QA — employee >> employee my performance
- Location: e2e/hr-performance.responsive.spec.ts:38:3

# Error details

```
Error: expect(received).toBeGreaterThanOrEqual(expected)

Expected: >= 28
Received:    0
```

# Page snapshot

```yaml
- generic [ref=e3]:
  - complementary [ref=e4]:
    - generic [ref=e5]:
      - generic [ref=e7]:
        - generic [ref=e8]: S
        - generic [ref=e9]:
          - paragraph [ref=e10]: SkillonX
          - paragraph [ref=e11]: HR Portal
      - navigation "Primary" [ref=e12]:
        - generic [ref=e13]:
          - paragraph [ref=e14]: Employee Self-Service
          - generic [ref=e15]:
            - link "My HR" [ref=e16] [cursor=pointer]:
              - /url: /hr
            - link "My HR Profile" [ref=e23] [cursor=pointer]:
              - /url: /hr/profile
            - link "My Attendance" [ref=e28] [cursor=pointer]:
              - /url: /hr/attendance
            - link "Apply Leave" [ref=e34] [cursor=pointer]:
              - /url: /hr/leave/apply
            - link "My Payslips" [ref=e38] [cursor=pointer]:
              - /url: /hr/payslips
            - link "My Performance" [ref=e43] [cursor=pointer]:
              - /url: /hr/me/performance
            - link "My Learning" [ref=e47] [cursor=pointer]:
              - /url: /hr/learning
            - link "My Development" [ref=e52] [cursor=pointer]:
              - /url: /hr/succession/me
            - link "My Exit" [ref=e57] [cursor=pointer]:
              - /url: /hr/separation
        - generic [ref=e61]:
          - paragraph [ref=e62]: Account
          - generic [ref=e63]:
            - link "Profile" [ref=e64] [cursor=pointer]:
              - /url: /profile
            - link "Settings" [ref=e69] [cursor=pointer]:
              - /url: /settings
      - button "Collapse sidebar" [ref=e75]: Collapse
      - button "AS Anita Sharma Faculty" [ref=e80]:
        - generic [ref=e81]: AS
        - generic [ref=e82]:
          - paragraph [ref=e83]: Anita Sharma
          - paragraph [ref=e84]: Faculty
  - generic [ref=e88]:
    - banner [ref=e89]:
      - generic [ref=e91]:
        - generic [ref=e92]: Vidya Vikas Institute of Engineering & Technology
        - link "Faculty Workspace" [ref=e93] [cursor=pointer]:
          - /url: /dashboard
    - main [ref=e94]:
      - generic [ref=e96]:
        - generic [ref=e97]:
          - generic [ref=e98]:
            - heading "My Performance" [level=1] [ref=e99]
            - paragraph [ref=e100]: Goals, self-appraisal and development plans
          - link [ref=e102] [cursor=pointer]:
            - /url: /hr
            - button "My HR" [ref=e103]
        - generic [ref=e104]:
          - heading "Current appraisals" [level=2] [ref=e105]
          - table [ref=e107]:
            - rowgroup [ref=e108]:
              - row [ref=e109]:
                - columnheader "Appraisal" [ref=e110]
                - columnheader "Cycle / Employee" [ref=e111]
                - columnheader "Status" [ref=e112]
                - columnheader "Score" [ref=e113]
            - rowgroup [ref=e114]:
              - row [ref=e115]:
                - cell "No active appraisals" [ref=e116]
        - generic [ref=e117]:
          - heading "Past appraisals" [level=2] [ref=e118]
          - table [ref=e120]:
            - rowgroup [ref=e121]:
              - row [ref=e122]:
                - columnheader "Appraisal" [ref=e123]
                - columnheader "Cycle / Employee" [ref=e124]
                - columnheader "Status" [ref=e125]
                - columnheader "Score" [ref=e126]
            - rowgroup [ref=e127]:
              - row [ref=e128]:
                - cell "No past appraisals" [ref=e129]
```

# Test source

```ts
  1   | import { test, expect, type Page } from '@playwright/test';
  2   | import path from 'node:path';
  3   | import { fileURLToPath } from 'node:url';
  4   | 
  5   | const __dirname = path.dirname(fileURLToPath(import.meta.url));
  6   | const screenshotDir = path.join(__dirname, 'screenshots', 'hr-performance');
  7   | const authDir = path.join(__dirname, '.auth');
  8   | 
  9   | async function assertNoHorizontalScroll(page: Page) {
  10  |   const overflow = await page.evaluate(() => {
  11  |     const doc = document.documentElement;
  12  |     return doc.scrollWidth > doc.clientWidth + 2;
  13  |   });
  14  |   expect(overflow, 'page should not horizontally overflow').toBe(false);
  15  | }
  16  | 
  17  | async function assertPrimaryActionsVisible(page: Page) {
  18  |   const buttons = page.locator('button:visible, a[role="button"]:visible, a.btn:visible');
  19  |   const count = await buttons.count();
  20  |   expect(count).toBeGreaterThan(0);
  21  |   const first = buttons.first();
  22  |   const box = await first.boundingBox();
> 23  |   expect(box?.height ?? 0).toBeGreaterThanOrEqual(28);
      |                            ^ Error: expect(received).toBeGreaterThanOrEqual(expected)
  24  | }
  25  | 
  26  | async function visitAndAssert(page: Page, route: string, heading: RegExp | string) {
  27  |   await page.goto(route, { waitUntil: 'domcontentloaded' });
  28  |   await expect(page.getByRole('heading', { name: heading })).toBeVisible({ timeout: 20_000 });
  29  |   await assertNoHorizontalScroll(page);
  30  |   await assertPrimaryActionsVisible(page);
  31  | }
  32  | 
  33  | const shotViewports = ['1920x1080', '1024x768', '390x844'] as const;
  34  | 
  35  | test.describe('HR performance responsive QA — employee', () => {
  36  |   test.use({ storageState: path.join(authDir, 'lecturer.json') });
  37  | 
  38  |   test('employee my performance', async ({ page }, testInfo) => {
  39  |     await visitAndAssert(page, '/hr/me/performance', /My Performance/i);
  40  |     if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
  41  |       await page.screenshot({
  42  |         path: path.join(screenshotDir, `employee-my-performance-${testInfo.project.name}.png`),
  43  |         fullPage: true,
  44  |       });
  45  |     }
  46  |   });
  47  | 
  48  |   test('employee self appraisal detail (if link)', async ({ page }, testInfo) => {
  49  |     await page.goto('/hr/me/performance', { waitUntil: 'domcontentloaded' });
  50  |     await expect(page.getByRole('heading', { name: /My Performance/i })).toBeVisible({ timeout: 20_000 });
  51  |     const link = page.locator('a[href*="/hr/me/performance/"]:visible').first();
  52  |     if (await link.count()) {
  53  |       await link.click();
  54  |       await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 20_000 });
  55  |       await assertNoHorizontalScroll(page);
  56  |       const selfTab = page.getByRole('button', { name: /Self Appraisal/i });
  57  |       if (await selfTab.count()) {
  58  |         await selfTab.click();
  59  |         await assertNoHorizontalScroll(page);
  60  |         await assertPrimaryActionsVisible(page);
  61  |       }
  62  |       if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
  63  |         await page.screenshot({
  64  |           path: path.join(screenshotDir, `employee-self-appraisal-${testInfo.project.name}.png`),
  65  |           fullPage: true,
  66  |         });
  67  |       }
  68  |     }
  69  |   });
  70  | });
  71  | 
  72  | test.describe('HR performance responsive QA — HOD', () => {
  73  |   test.use({ storageState: path.join(authDir, 'hod.json') });
  74  | 
  75  |   test('hod team dashboard', async ({ page }, testInfo) => {
  76  |     await visitAndAssert(page, '/hr/performance/team', /Team Performance/i);
  77  |     if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
  78  |       await page.screenshot({
  79  |         path: path.join(screenshotDir, `hod-team-dashboard-${testInfo.project.name}.png`),
  80  |         fullPage: true,
  81  |       });
  82  |     }
  83  |   });
  84  | 
  85  |   test('hod employee review (if available)', async ({ page }, testInfo) => {
  86  |     await page.goto('/hr/performance/team/reviews', { waitUntil: 'domcontentloaded' });
  87  |     await expect(page.getByRole('heading', { name: /Pending Reviews/i })).toBeVisible({ timeout: 20_000 });
  88  |     await assertNoHorizontalScroll(page);
  89  |     const link = page.locator('a[href*="/hr/performance/team/appraisals/"]:visible').first();
  90  |     if (await link.count()) {
  91  |       await link.click();
  92  |       await expect(page.getByRole('heading').first()).toBeVisible({ timeout: 20_000 });
  93  |       await assertNoHorizontalScroll(page);
  94  |       await assertPrimaryActionsVisible(page);
  95  |       if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
  96  |         await page.screenshot({
  97  |           path: path.join(screenshotDir, `hod-employee-review-${testInfo.project.name}.png`),
  98  |           fullPage: true,
  99  |         });
  100 |       }
  101 |     }
  102 |   });
  103 | });
  104 | 
  105 | test.describe('HR performance responsive QA — admin', () => {
  106 |   test.use({ storageState: path.join(authDir, 'admin.json') });
  107 | 
  108 |   test('hr performance dashboard', async ({ page }, testInfo) => {
  109 |     await visitAndAssert(page, '/hr/performance', /Performance & Appraisal/i);
  110 |     if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
  111 |       await page.screenshot({
  112 |         path: path.join(screenshotDir, `hr-dashboard-${testInfo.project.name}.png`),
  113 |         fullPage: true,
  114 |       });
  115 |     }
  116 |   });
  117 | 
  118 |   test('hr calibration', async ({ page }, testInfo) => {
  119 |     await visitAndAssert(page, '/hr/performance/calibration', /Calibration/i);
  120 |     if (shotViewports.includes(testInfo.project.name as (typeof shotViewports)[number])) {
  121 |       await page.screenshot({
  122 |         path: path.join(screenshotDir, `hr-calibration-${testInfo.project.name}.png`),
  123 |         fullPage: true,
```