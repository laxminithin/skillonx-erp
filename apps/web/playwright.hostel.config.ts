import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;
const API_PORT = 4000;
const viewports = [
  ['360x800', 360, 800],
  ['390x844', 390, 844],
  ['412x915', 412, 915],
  ['768x1024', 768, 1024],
  ['1024x768', 1024, 768],
  ['1280x800', 1280, 800],
  ['1440x900', 1440, 900],
  ['1920x1080', 1920, 1080],
] as const;

export default defineConfig({
  testDir: './e2e',
  testMatch: /hostel\.(responsive|closure)\.spec\.ts/,
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'retain-on-failure',
    screenshot: 'only-on-failure',
  },
  webServer: [
    {
      command: 'npm run dev -w @skillonx/survey-api',
      url: `http://127.0.0.1:${API_PORT}/api/health`,
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: '../..',
    },
    {
      command: `npm run dev -w @skillonx/survey-web -- --host 127.0.0.1 --port ${PORT}`,
      url: `http://127.0.0.1:${PORT}`,
      reuseExistingServer: true,
      timeout: 120_000,
      cwd: '../..',
    },
  ],
  projects: viewports.map(([name, width, height]) => ({
    name,
    use: { ...devices['Desktop Chrome'], viewport: { width, height } },
  })),
});
