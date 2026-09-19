import crypto from 'crypto';

const GATE_PASS_SECRET = process.env.GATE_PASS_HMAC_SECRET || process.env.SUPABASE_SERVICE_ROLE_KEY || 'default-secret-for-dev';

if (!process.env.GATE_PASS_HMAC_SECRET && process.env.NODE_ENV === 'production') {
  console.warn('[crypto] GATE_PASS_HMAC_SECRET not set — falling back to service_role key. Set a dedicated secret for QR HMAC.');
}

export function generateGatePassToken(passNumber: string): string {
  return crypto.createHmac('sha256', GATE_PASS_SECRET).update(passNumber).digest('hex');
}
