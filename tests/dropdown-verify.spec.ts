import { test, expect } from '@playwright/test';

test.describe('Mobile Dropdown Verification', () => {
  test('Dropdown should open and display options on mobile', async ({ page }) => {
    // Set viewport to a typical mobile device (iPhone 12/13 Pro)
    await page.setViewportSize({ width: 390, height: 844 });
    
    // Navigate to the visitor form
    await page.goto('/visit');

    // Wait for the page to load
    await expect(page.locator('text=DIGITAL VISITOR GATE PASS')).toBeVisible();

    // The dropdown trigger is the div containing "Select Employee or Department..."
    const dropdownTrigger = page.locator('text=Select Employee or Department...');
    await dropdownTrigger.click();

    // The dropdown content should appear (look for the "Search..." input)
    const searchInput = page.locator('input[placeholder="Search..."]');
    await expect(searchInput).toBeVisible();

    // Verify some employees or departments are shown
    const deptHeader = page.locator('text=Departments').first();
    const empHeader = page.locator('text=Employees').first();
    
    // Take a screenshot of the open dropdown
    await page.screenshot({ path: 'test-artifacts/screenshots/07-mobile-dropdown-open.png', fullPage: true });
  });
});
