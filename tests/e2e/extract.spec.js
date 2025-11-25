import { test, expect } from '@playwright/test'

test.describe('Commercial Invoice Extractor E2E', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('http://localhost:3000')
  })

  test('should display the main page', async ({ page }) => {
    await expect(page.getByText('Commercial Invoice Line Item Extractor')).toBeVisible()
  })

  test('should open settings panel', async ({ page }) => {
    await page.click('button[aria-label="Settings"]')
    await expect(page.getByText('A79 API Configuration')).toBeVisible()
  })

  test('should configure API endpoint', async ({ page }) => {
    await page.click('button[aria-label="Settings"]')
    await page.fill('input[type="text"]', 'http://test-api.com/extract')
    await page.click('button:has-text("Save")')
    
    // Settings should close
    await expect(page.getByText('A79 API Configuration')).not.toBeVisible()
  })

  test('should show error for invalid file type', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('test content')
    })
    
    await expect(page.getByText(/Please select a valid PDF file/)).toBeVisible()
  })

  test('should handle file upload', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content')
    })
    
    await expect(page.getByText(/Selected: test.pdf/)).toBeVisible()
  })

  test('should show error when extracting without API configuration', async ({ page }) => {
    const fileInput = page.locator('input[type="file"]')
    await fileInput.setInputFiles({
      name: 'test.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('fake pdf content')
    })
    
    await page.click('button:has-text("Extract Line Items via A79")')
    
    await expect(page.getByText(/Please configure the A79 API endpoint/)).toBeVisible()
  })
})

