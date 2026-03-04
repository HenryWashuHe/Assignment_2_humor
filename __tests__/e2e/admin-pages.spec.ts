import { test, expect } from '@playwright/test'

// Session is injected via storageState in playwright.config.ts

test.describe('Admin dashboard', () => {
  test('dashboard shows stat cards', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Total Users')).toBeVisible()
    await expect(page.getByText('Total Images')).toBeVisible()
    await expect(page.getByText('Total Captions')).toBeVisible()
    await expect(page.getByText('Study Users')).toBeVisible()
  })

  test('dashboard shows top captions table', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByText('Top 5 Most-Liked Captions')).toBeVisible()
  })
})

test.describe('Admin navigation', () => {
  test('nav links are present', async ({ page }) => {
    await page.goto('/dashboard')
    await expect(page.getByRole('link', { name: 'Dashboard' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Users' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Images' })).toBeVisible()
    await expect(page.getByRole('link', { name: 'Captions' })).toBeVisible()
  })

  test('users page loads table', async ({ page }) => {
    await page.goto('/users')
    await expect(page.getByRole('columnheader', { name: 'Email' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Superadmin' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'In Study' })).toBeVisible()
  })

  test('images page loads table with CRUD controls', async ({ page }) => {
    await page.goto('/images')
    await expect(page.getByRole('link', { name: '+ New Image' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'URL' })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Actions' })).toBeVisible()
  })

  test('captions page loads table sorted by likes', async ({ page }) => {
    await page.goto('/captions')
    await expect(page.getByRole('columnheader', { name: /likes/i })).toBeVisible()
    await expect(page.getByRole('columnheader', { name: 'Featured' })).toBeVisible()
  })
})

test.describe('Images CRUD', () => {
  test('can navigate to new image form', async ({ page }) => {
    await page.goto('/images')
    await page.getByRole('link', { name: '+ New Image' }).click()
    await expect(page).toHaveURL(/\/images\/new/)
    await expect(page.getByRole('heading', { name: 'New Image' })).toBeVisible()
  })

  test('new image form has required fields', async ({ page }) => {
    await page.goto('/images/new')
    await expect(page.getByPlaceholder('https://example.com/image.jpg')).toBeVisible()
    await expect(page.getByText('Additional Context')).toBeVisible()
    await expect(page.getByText('Public')).toBeVisible()
    await expect(page.getByText('Common Use')).toBeVisible()
    await expect(page.getByRole('button', { name: 'Create Image' })).toBeVisible()
  })
})
