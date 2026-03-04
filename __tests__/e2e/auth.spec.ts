import { test, expect } from '@playwright/test'

test.describe('Auth guard', () => {
  test('unauthenticated visit to / redirects to /login', async ({ page }) => {
    await page.goto('/')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated visit to /dashboard redirects to /login', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated visit to /users redirects to /login', async ({ page }) => {
    await page.goto('/users')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated visit to /images redirects to /login', async ({ page }) => {
    await page.goto('/images')
    await expect(page).toHaveURL(/\/login/)
  })

  test('unauthenticated visit to /captions redirects to /login', async ({ page }) => {
    await page.goto('/captions')
    await expect(page).toHaveURL(/\/login/)
  })

  test('login page shows Google sign-in button', async ({ page }) => {
    await page.goto('/login')
    await expect(page.getByRole('button', { name: /sign in with google/i })).toBeVisible()
  })

  test('login page shows error message for unauthorized param', async ({ page }) => {
    await page.goto('/login?error=unauthorized')
    await expect(page.getByText(/does not have admin access/i)).toBeVisible()
  })

  test('login page shows error message for oauth failure', async ({ page }) => {
    await page.goto('/login?error=oauth')
    await expect(page.getByText(/sign-in failed/i)).toBeVisible()
  })
})
