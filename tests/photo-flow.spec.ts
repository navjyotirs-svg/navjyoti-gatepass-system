import { test, expect } from '@playwright/test';

test.describe('Photo Flow', () => {
  test('Camera access and photo capture', async ({ page, browserName }) => {
    // For Chromium, we can grant permissions and use fake device
    test.skip(browserName !== 'chromium', 'Fake device testing mainly on Chromium');
    
    // We would need to set permissions in context for camera
    // This is a basic check to see if the page doesn't crash on camera step
    await page.goto('/visit');
    
    // Fill required details to proceed to next step
    await page.fill('input[name="visitorName"]', 'TEST Visitor 001');
    await page.fill('input[name="visitorMobile"]', '9876543210');
    await page.fill('textarea[name="purpose"]', 'Gate Pass Application Testing');
    
    // Select an employee
    const combobox = page.locator('text=Select Employee or Department...');
    await combobox.click();
    await page.locator('text=Jaykishor Singh').first().click();
    
    const continueBtn = page.locator('button:has-text("Continue to Photo")');
    if (await continueBtn.isVisible()) {
      await continueBtn.click();
    }
    
    // Verify we reached photo step or at least no crash occurred
    await expect(page).not.toHaveURL(/\/visit$/); // Should have navigated if single page
  });
});
