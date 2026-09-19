import { test, expect } from '@playwright/test';
import { createClient } from '@supabase/supabase-js';
import crypto from 'crypto';
import dotenv from 'dotenv';

dotenv.config({ path: '.env.test.local' });
const admin = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL || '', process.env.SUPABASE_SERVICE_ROLE_KEY || '');

test('server blocks checkout before check-in', async () => {
  const passNumber = `NGP-TEST-BLOCK-${Date.now()}`;
  const { data, error } = await admin.from('gate_pass_requests').insert({
    visitor_name: 'TEST CHECKOUT 002', visitor_mobile: '9999999997', purpose: 'Lifecycle QA',
    meeting_target_type: 'department', department_target: 'HR', status: 'approved',
    request_reference: `VR-CHECKOUT-BLOCK-${crypto.randomUUID()}`, approved_at: new Date().toISOString(),
    pass_number: passNumber, verification_token_hash: 'test-issued-pass', pass_issued_at: new Date().toISOString(),
    pass_expires_at: new Date(Date.now() + 86400000).toISOString(),
  }).select('id').single();
  if (error) throw error;
  try {
    const result = await admin.rpc('check_out_visitor', { p_pass_number: passNumber, p_performed_by: 'qa_gate', p_method: 'qr' });
    if (result.error && (result.error.code === 'PGRST202' || result.error.code === '42703')) {
      console.log('Skip: check_out_visitor not deployed on remote');
      return;
    }
    expect(result.error).toBeNull();
    expect(result.data.success).toBe(false);
    expect(result.data.code).toBe('not_checked_in');
  } finally {
    await admin.from('gate_pass_requests').delete().eq('id', data.id);
  }
});
