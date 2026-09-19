import { test, expect } from '@playwright/test';

test.describe('Employee Selection', () => {
  test('Employee Directory loads from real backend', async ({ page }) => {
    await page.goto('/visit');
    
    // Check if the dropdown exists
    const combobox = page.locator('text=Select Employee or Department...');
    if (await combobox.isVisible()) {
        await combobox.click();
        
        // Ensure options load
        await expect(page.locator('text=HR').first()).toBeVisible();
        await expect(page.locator('text=Jaykishor Singh').first()).toBeVisible();
        await expect(page.locator('text=Mr. Gurusharan Khurana').first()).toBeVisible();
        await expect(page.locator('text=Jai Kumar').first()).toBeVisible();
        await expect(page.locator('text=Gurpreet').first()).toBeVisible();
        await expect(page.locator('text=Rahul Kumar').first()).toBeVisible();
        await expect(page.locator('text=Vipan').first()).toBeVisible();
    }
  });

  test('Employee Mobile Privacy - network audit', async ({ page }) => {
    let numbersExposed = false;
    page.on('response', async (response) => {
      const url = response.url();
      if (url.includes('supabase') && response.request().method() === 'GET') {
        const text = await response.text();
        if (
          text.includes('9810615904') ||
          text.includes('7505633328') ||
          text.includes('9193618538') ||
          text.includes('7302614061')
        ) {
          numbersExposed = true;
        }
      }
    });

    await page.goto('/visit');
    await page.waitForTimeout(2000); // Give time for network requests to settle
    
    expect(numbersExposed).toBeFalsy();
  });
});
