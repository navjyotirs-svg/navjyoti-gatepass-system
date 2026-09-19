import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

test.describe('Gate Pass Screenshots Generation', () => {
  let testRequestId: string;
  let testRequestRef: string;
  let validToken: string;
  let validEmployeeId: string;
  let passNumber: string;

  test.beforeAll(async () => {
    const { data, error } = await supabaseAdmin.from('employees').select('id').eq('name', 'Jaykishor Singh').single();
    if (error || !data) throw new Error('Employee not found');
    validEmployeeId = data.id!;
  });

  test.beforeEach(async ({ request }) => {
    const { data, error } = await supabaseAdmin
    .from('gate_pass_requests')
    .insert({
      visitor_name: 'RAJ KUMAR',
      visitor_mobile: '98XXXXXX12',
      visitor_company: 'XYZ Solutions Pvt. Ltd.',
      purpose: 'Project Discussion',
      meeting_target_type: 'employee',
      employee_id: validEmployeeId,
      status: 'pending',
      request_reference: `VR-SCREENSHOT-${Date.now()}`
    })
    .select('request_reference, id')
    .single();

    if (error) {
      console.error('Failed to seed screenshot request:', error);
      throw error;
    }
  
    testRequestId = data.id;
    testRequestRef = data.request_reference;

    const res = await request.get(`/api/whatsapp/${testRequestId}`, { maxRedirects: 0 });
    expect(res.status()).toBe(200);
    const responseData = await res.json();
    const match = decodeURIComponent(responseData.url).match(/token=([a-f0-9]+)/);
    expect(match).not.toBeNull();
    validToken = match![1];
  });

  test.afterEach(async () => {
    if (testRequestId) {
      await supabaseAdmin.from('gate_pass_requests').delete().eq('id', testRequestId);
    }
  });

  test('Generate screenshots', async ({ page }) => {
    // 1. Approve the pass
    await page.goto(`/approve/${testRequestRef}?token=${validToken}`);
    await page.click('button:has-text("Approve")');
    await expect(page.locator('text=has been approved successfully')).toBeVisible();

    // 2. Open the gate pass (desktop)
    await page.setViewportSize({ width: 1366, height: 768 });
    await page.goto(`/visit/pass/${testRequestRef}`);
    await expect(page.locator('text=VISITOR GATE PASS')).toBeVisible();
    await page.waitForTimeout(2000); // wait for images
    await page.screenshot({ path: 'test-artifacts/screenshots/01-approved-gate-pass-desktop.png', fullPage: true });

    // 3. Open the gate pass (mobile)
    await page.setViewportSize({ width: 390, height: 844 });
    await page.screenshot({ path: 'test-artifacts/screenshots/02-approved-gate-pass-mobile.png', fullPage: true });

    // Get Pass Number
    const { data } = await supabaseAdmin.from('gate_pass_requests').select('pass_number').eq('id', testRequestId).single();
    passNumber = data!.pass_number;

    // 4. Verify QR (desktop)
    await page.setViewportSize({ width: 1366, height: 768 });
    
    // We get the token from the URL in the QR code or directly from db
    const { data: requestData } = await supabaseAdmin.from('gate_pass_requests').select('verification_token_hash').eq('id', testRequestId).single();
    
    await page.goto(`/verify/${passNumber}?token=${requestData!.verification_token_hash}`);
    await expect(page.locator('text=VALID GATE PASS')).toBeVisible();
    await page.screenshot({ path: 'test-artifacts/screenshots/06-valid-qr-verification.png', fullPage: true });
  });
});
