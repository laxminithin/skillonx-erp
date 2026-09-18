import { defineConfig, devices } from '@playwright/test';

const PORT = 5173;
const API_PORT = 4000;

export default defineConfig({
  testDir: './e2e',
  timeout: 90_000,
  expect: { timeout: 15_000 },
  fullyParallel: false,
  workers: 1,
  retries: 1,
  reporter: [['list']],
  use: {
    baseURL: `http://127.0.0.1:${PORT}`,
    trace: 'off',
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
  projects: [
    { name: 'setup', testMatch: /auth\.setup\.ts/ },
    { name: 'platform-setup', testMatch: /platform\.auth\.setup\.ts/ },
    { name: '1920x1080', dependencies: ['setup'], testIgnore: /auth\.setup\.ts|platform\.auth\.setup\.ts|platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
    { name: '1440x900', dependencies: ['setup'], testIgnore: /auth\.setup\.ts|platform\.auth\.setup\.ts|platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: '1366x768', dependencies: ['setup'], testIgnore: /auth\.setup\.ts|platform\.auth\.setup\.ts|platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
    { name: '1024x768', dependencies: ['setup'], testIgnore: /auth\.setup\.ts|platform\.auth\.setup\.ts|platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } } },
    { name: '768x1024', dependencies: ['setup'], testIgnore: /auth\.setup\.ts|platform\.auth\.setup\.ts|platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: '430x932', dependencies: ['setup'], testIgnore: /auth\.setup\.ts|platform\.auth\.setup\.ts|platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 430, height: 932 } } },
    { name: '390x844', dependencies: ['setup'], testIgnore: /auth\.setup\.ts|platform\.auth\.setup\.ts|platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
    { name: '360x800', dependencies: ['setup'], testIgnore: /auth\.setup\.ts|platform\.auth\.setup\.ts|platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 } } },
    // Super Admin portal — dedicated setup + all 8 breakpoints (isolated from faculty auth flakiness).
    { name: 'platform-1920x1080', dependencies: ['platform-setup'], testMatch: /platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1920, height: 1080 } } },
    { name: 'platform-1440x900', dependencies: ['platform-setup'], testMatch: /platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1440, height: 900 } } },
    { name: 'platform-1366x768', dependencies: ['platform-setup'], testMatch: /platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1366, height: 768 } } },
    { name: 'platform-1024x768', dependencies: ['platform-setup'], testMatch: /platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 1024, height: 768 } } },
    { name: 'platform-768x1024', dependencies: ['platform-setup'], testMatch: /platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 768, height: 1024 } } },
    { name: 'platform-430x932', dependencies: ['platform-setup'], testMatch: /platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 430, height: 932 } } },
    { name: 'platform-390x844', dependencies: ['platform-setup'], testMatch: /platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 390, height: 844 } } },
    { name: 'platform-360x800', dependencies: ['platform-setup'], testMatch: /platform\.responsive\.spec\.ts/, use: { ...devices['Desktop Chrome'], viewport: { width: 360, height: 800 } } },
  ],
});
