import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test.local' });
const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL || '';
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY || '';
const supabaseAdmin = createClient(supabaseUrl, serviceRoleKey);
import crypto from 'crypto';
import { generateGatePassToken } from '../src/lib/server/crypto';

test.describe('Phase 7: Gate Pass Generation & Security', () => {
  let approvedRequestRef: string;
  let rejectedRequestRef: string;
  let pendingRequestRef: string;

  test.beforeAll(async () => {
    const ts = Date.now();
    const uid = crypto.randomUUID().split('-')[0];
    approvedRequestRef = `VR-TEST-APP-${ts}-${uid}`;
    rejectedRequestRef = `VR-TEST-REJ-${ts}-${uid}`;
    pendingRequestRef = `VR-TEST-PEN-${ts}-${uid}`;

    // Create Approved Request
    const { error: err1 } = await supabaseAdmin.from('gate_pass_requests').insert({
      visitor_name: 'Test Approved',
      visitor_mobile: '9999999991',
      purpose: 'Testing Pass',
      meeting_target_type: 'department',
      department_target: 'HR',
      status: 'approved',
      request_reference: approvedRequestRef,
      approved_at: new Date().toISOString()
    });
    if (err1) throw err1;

    // Create Rejected Request
    const { error: err2 } = await supabaseAdmin.from('gate_pass_requests').insert({
      visitor_name: 'Test Rejected',
      visitor_mobile: '9999999992',
      purpose: 'Testing Pass',
      meeting_target_type: 'department',
      department_target: 'HR',
      status: 'rejected',
      request_reference: rejectedRequestRef,
      rejected_at: new Date().toISOString()
    });
    if (err2) throw err2;

    // Create Pending Request
    const { error: err3 } = await supabaseAdmin.from('gate_pass_requests').insert({
      visitor_name: 'Test Pending',
      visitor_mobile: '9999999993',
      purpose: 'Testing Pass',
      meeting_target_type: 'department',
      department_target: 'HR',
      status: 'pending',
      request_reference: pendingRequestRef
    });
    if (err3) throw err3;
  });

  test('Pending request cannot generate pass', async ({ page }) => {
    await page.goto(`/visit/pass/${pendingRequestRef}`);
    await expect(page.locator('text=Gate pass is not available yet')).toBeVisible();
  });

  test('Rejected request cannot generate pass', async ({ page }) => {
    await page.goto(`/visit/pass/${rejectedRequestRef}`);
    await expect(page.locator('text=Gate pass unavailable')).toBeVisible();
  });

  test('Approved request can generate pass and it is idempotent', async ({ page }) => {
    // First visit to generate
    await page.goto(`/visit/pass/${approvedRequestRef}`);
    await expect(page.locator('text=Visitor Gate Pass')).toBeVisible();
    await expect(page.getByText('APPROVED', { exact: true })).toBeVisible();
    await expect(page.locator('text=Test Approved')).toBeVisible();

    // Grab the generated pass number
    const passNumberElement = await page.locator('.font-mono.bg-surface-variant').first();
    const passNumber = await passNumberElement.innerText();
    expect(passNumber).toContain('NGP-');

    // Second visit should show the same pass number
    await page.reload();
    await expect(page.locator('text=Visitor Gate Pass')).toBeVisible();
    const newPassNumber = await page.locator('.font-mono.bg-surface-variant').first().innerText();
    expect(newPassNumber).toBe(passNumber);
  });

  test('QR code verification route works securely', async ({ page }) => {
    // Generate pass and grab pass number
    await page.goto(`/visit/pass/${approvedRequestRef}`);
    await page.waitForSelector('text=Visitor Gate Pass');
    const passNumberElement = await page.locator('.font-mono.bg-surface-variant').first();
    const passNumber = await passNumberElement.innerText();

    // Verify valid token
    const validToken = generateGatePassToken(passNumber);
    await page.goto(`/verify/${passNumber}?token=${validToken}`);
    await expect(page.locator('text=Valid Gate Pass')).toBeVisible();
    await expect(page.locator('text=Test Approved')).toBeVisible();

    // Verify invalid token
    await page.goto(`/verify/${passNumber}?token=invalid-fake-token`);
    await expect(page.locator('text=INVALID GATE PASS')).toBeVisible();
    await expect(page.locator('text=Test Approved')).toBeHidden();

    // Verify missing token
    await page.goto(`/verify/${passNumber}`);
    await expect(page.locator('text=No verification token provided')).toBeVisible();
    
    // Verify cross-pass attack
    await page.goto(`/verify/NGP-FAKE-PASS?token=${validToken}`);
    await expect(page.locator('text=INVALID GATE PASS')).toBeVisible();
  });
});
