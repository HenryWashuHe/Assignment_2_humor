import { defineConfig, devices } from '@playwright/test'
import path from 'path'

export const STORAGE_STATE = path.join(__dirname, '__tests__/e2e/.auth/session.json')

export default defineConfig({
  testDir: './__tests__/e2e',
  fullyParallel: false,
  retries: 0,
  globalSetup: './__tests__/e2e/global-setup.ts',
  use: {
    baseURL: 'http://localhost:3000',
    trace: 'on-first-retry',
  },
  projects: [
    // Auth-guard tests run WITHOUT a session (testing unauthenticated behaviour)
    {
      name: 'auth-guard',
      testMatch: '**/auth.spec.ts',
      use: { ...devices['Desktop Chrome'] },
    },
    // Admin page tests run WITH the saved session
    {
      name: 'admin',
      testMatch: '**/admin-pages.spec.ts',
      use: { ...devices['Desktop Chrome'], storageState: STORAGE_STATE },
    },
  ],
  webServer: {
    command: 'npm run dev',
    url: 'http://localhost:3000',
    reuseExistingServer: true,
  },
})
