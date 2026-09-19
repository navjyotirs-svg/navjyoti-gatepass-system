import { test, expect } from '@playwright/test';

test.describe('Security Tests', () => {
  test('Service Role not exposed to client', async ({ page }) => {
    await page.goto('/visit');
    
    // Try to find the service role key in global objects
    const keyExposed = await page.evaluate(() => {
      // Check if it's attached to window or process (if available in browser)
      let exposed = false;
      try {
        if (typeof window !== 'undefined') {
          const w = window as unknown as Record<string, unknown>;
          if (w.env && (w.env as Record<string, unknown>).SUPABASE_SERVICE_ROLE_KEY) exposed = true;
          if (w.__NEXT_DATA__ && JSON.stringify(w.__NEXT_DATA__).includes('service_role')) exposed = true;
        }
      } catch {
        // Ignore parsing errors
      }
      return exposed;
    });

    expect(keyExposed).toBeFalsy();
  });
});
