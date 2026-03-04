import { chromium, FullConfig } from '@playwright/test'
import path from 'path'
import fs from 'fs'

export const STORAGE_STATE = path.join(__dirname, '.auth/session.json')


export default async function globalSetup(_config: FullConfig) {
  // If a saved session already exists, reuse it
  if (fs.existsSync(STORAGE_STATE)) return

  fs.mkdirSync(path.dirname(STORAGE_STATE), { recursive: true })

  const browser = await chromium.launch({ headless: false })
  const page = await browser.newPage()

  console.log('\n🔐 No saved session found.')
  console.log('   A browser window will open — sign in with Google, then wait.')
  console.log('   The window will close automatically once you reach /dashboard.\n')

  await page.goto('http://localhost:3000/login')

  // Wait for the user to complete Google OAuth and land on /dashboard
  await page.waitForURL('**/dashboard', { timeout: 120_000 })

  await page.context().storageState({ path: STORAGE_STATE })
  await browser.close()

  console.log('   Session saved. Tests will reuse it.\n')
}
