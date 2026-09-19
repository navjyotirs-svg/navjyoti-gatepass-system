import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);

test.describe('Phase 6: Approval Workflow', () => {

  test('Missing token is rejected', async ({ page }) => {
    await page.goto(`/approve/REQ-TEST-MISSING`);
    await expect(page.locator('text=Invalid approval link')).toBeVisible();
  });

  test('Invalid token is rejected', async ({ page }) => {
    await page.goto(`/approve/REQ-TEST-INVALID?token=bad_token`);
    await expect(page.locator('text=Request not found').or(page.locator('text=Invalid approval link'))).toBeVisible();
  });

  test('Admin manual approval page is protected', async ({ page }) => {
    await page.goto('/admin');
    await expect(page.getByRole('heading', { name: 'Sign In' })).toBeVisible();
  });

  test('Anonymous direct update attempt is blocked (RLS)', async ({ request }) => {
    const anonKey = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY!;
    const response = await request.patch(`${supabaseUrl}/rest/v1/gate_pass_requests?status=eq.pending`, {
      headers: {
        'apikey': anonKey,
        'Authorization': `Bearer ${anonKey}`,
        'Content-Type': 'application/json',
        'Prefer': 'return=representation'
      },
      data: { status: 'approved' }
    });
    
    expect(response.ok()).toBeFalsy();
    if (response.ok()) {
      const data = await response.json();
      expect(data.length).toBe(0);
    }
  });

  // Comprehensive Approval Tests using Admin client to seed data
  test.describe('Approval flows with seeded data', () => {
    let testRequestId: string;
    let testRequestRef: string;
    let validToken: string;
    let validEmployeeId: string;

    test.beforeAll(async () => {
      // Find an existing seeded employee
      const { data, error } = await supabaseAdmin.from('employees').select('id').eq('name', 'Jaykishor Singh').single();
      if (error || !data) throw new Error('Employee not found');
      validEmployeeId = data.id!;
    });

    // test.afterAll is not needed anymore since we are not creating anything

    test.beforeEach(async ({ request }) => {
      // 1. Create a dummy request directly
      const { data, error } = await supabaseAdmin
      .from('gate_pass_requests')
      .insert({
        visitor_name: 'E2E Approver',
        visitor_mobile: '+919999999999',
        purpose: 'E2E Test',
        meeting_target_type: 'employee',
        employee_id: validEmployeeId,
        status: 'pending',
        request_reference: `VR-TEST-${Date.now()}-${Math.floor(Math.random() * 10000)}`
      })
      .select('request_reference, id')
      .single();

    if (error) {
      console.error('Failed to seed first test request:', error);
      throw error;
    }
    
    testRequestId = data.id;
    testRequestRef = data.request_reference;

      // 2. Trigger Whatsapp endpoint to generate the token
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

    test('Valid approval works and prevents reuse', async ({ page }) => {
      await page.goto(`/approve/${testRequestRef}?token=${validToken}`);
      await expect(page.locator('text=E2E Approver')).toBeVisible();
      
      // Click Approve
      await page.click('button:has-text("Approve")');
      await expect(page.locator('text=has been approved successfully')).toBeVisible();

      // Check DB
      const { data } = await supabaseAdmin.from('gate_pass_requests').select('*').eq('id', testRequestId).single();
      expect(data.status).toBe('approved');
      expect(data.approved_at).not.toBeNull();
      expect(data.decision_at).not.toBeNull();

      // Token reuse blocked
      await page.goto(`/approve/${testRequestRef}?token=${validToken}`);
      await expect(page.locator('text=This request has already been')).toBeVisible();
    });

    test('Reject works and prevents reuse', async ({ page }) => {
      await page.goto(`/approve/${testRequestRef}?token=${validToken}`);
      // Click Reject to open the confirmation UI
      await page.click('button:has-text("Reject")');
      // Click the actual confirmation button
      await page.click('button:has-text("Yes, Reject")');
      await expect(page.locator('text=Visitor Request Rejected')).toBeVisible();

      // Check DB
      const { data } = await supabaseAdmin.from('gate_pass_requests').select('*').eq('id', testRequestId).single();
      expect(data.status).toBe('rejected');
      expect(data.rejected_at).not.toBeNull();
    });
    
    test('Cross-request token attack is blocked', async ({ page }) => {
      // Create a second request
      const { data } = await supabaseAdmin.from('gate_pass_requests').insert({
        visitor_name: 'E2E Victim',
        visitor_mobile: '9999999992',
        purpose: 'E2E Victim',
        meeting_target_type: 'employee',
        employee_id: validEmployeeId,
        status: 'pending',
        request_reference: `VR-VICTIM-${Date.now()}`
      }).select().single();
      
      const victimRef = data.request_reference;

      // Try to use the first request's token for the victim request
      await page.goto(`/approve/${victimRef}?token=${validToken}`);
      await expect(page.locator('text=Invalid approval link')).toBeVisible();
      
      await supabaseAdmin.from('gate_pass_requests').delete().eq('id', data.id);
    });

  });
});
