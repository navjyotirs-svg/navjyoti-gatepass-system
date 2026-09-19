import { test, expect } from '@playwright/test';

// Use a specific context with granted notification permissions
test.use({ permissions: ['notifications'] });

test.describe('End-to-End Push Notification Test across Two Tabs', () => {
  test('Employee receives push notification when visitor submits request', async ({ browser }) => {
    // We create a persistent context or just a standard context with permissions
    const context = await browser.newContext({ permissions: ['notifications'] });
    
    // TAB 1: Employee Notifications Page
    const employeeTab = await context.newPage();
    
    // We will capture console logs in Tab 1 to verify the push arrived
    let notificationReceived = false;
    let pushPayload: any = null;
    
    employeeTab.on('console', msg => {
      if (msg.text().includes('Message received in foreground:')) {
        notificationReceived = true;
      }
    });

    await employeeTab.goto('/employee/notifications');
    
    // Select an employee (Assuming EmployeeSelector or a simple select is used here)
    // Wait, let's look at how employee is selected in notifications page
    // There is a select dropdown
    await employeeTab.waitForSelector('select');
    // Get the first available employee option value that isn't empty
    const options = await employeeTab.locator('select option').allInnerTexts();
    // We'll select 'Jaykishor Singh' or similar
    await employeeTab.selectOption('select', { label: 'Jaykishor Singh' });
    
    // Click "Enable Notifications"
    await employeeTab.click('button:has-text("Enable Notifications")');
    
    // Wait for the status to clear or indicate success
    // Wait for 'Token received. Saving to database...' and then it clears.
    // Instead of exact text, wait for the button to change or some indicator.
    // Actually, when it succeeds, the button "Disable Notifications" appears or "Test Notification".
    await expect(employeeTab.locator('button:has-text("Disable Notifications")')).toBeVisible({ timeout: 15000 });
    
    // TAB 2: Visitor Page
    const visitorTab = await context.newPage();
    await visitorTab.goto('/visit');
    
    // Fill visitor form
    await visitorTab.fill('input[name="visitorName"]', 'Test Visitor');
    await visitorTab.fill('input[name="visitorMobile"]', '9999999999');
    await visitorTab.fill('textarea[name="purpose"]', 'Testing push notification');
    
    // Open employee dropdown and select Jaykishor Singh
    await visitorTab.click('text=Select Employee or Department...');
    await visitorTab.fill('input[placeholder="Search..."]', 'Jaykishor');
    await visitorTab.click('text=Jaykishor Singh');
    
    // Submit form
    await visitorTab.click('button:has-text("Continue to Photo")');
    
    // Wait for the request to be submitted
    // The visitor form pushes to '/visit/photo'. Just wait for navigation.
    await visitorTab.waitForURL('**/visit/photo');
    
    // NOW, check Tab 1 to see if the notification arrived!
    // Firebase Cloud Messaging can take a couple of seconds to deliver.
    await employeeTab.bringToFront();
    
    // Wait up to 10 seconds for the console flag to flip
    const start = Date.now();
    while (!notificationReceived && (Date.now() - start) < 15000) {
      await employeeTab.waitForTimeout(500);
    }
    
    // Assert that the notification was received
    expect(notificationReceived).toBe(true);
  });
});
