'use server';

import { supabaseServer } from '@/lib/supabase/server';
import crypto from 'crypto';
import { generateGatePassToken } from '@/lib/server/crypto';

export async function issueGatePass(requestReference: string) {
  try {
    const now = new Date();
    const istOffset = 5.5 * 60 * 60 * 1000;
    const istTime = new Date(now.getTime() + istOffset);
    istTime.setUTCHours(23, 59, 59, 999);
    const expiresAt = new Date(istTime.getTime() - istOffset).toISOString();

    const passNumber = `NGP-${istTime.getUTCFullYear()}${String(istTime.getUTCMonth() + 1).padStart(2, '0')}${String(istTime.getUTCDate()).padStart(2, '0')}-${crypto.randomBytes(2).toString('hex').toUpperCase()}`;
    
    // Using HMAC for stateless verification. We still generate a hash for DB compatibility if needed,
    // though the HMAC itself is secure.
    const token = generateGatePassToken(passNumber);
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    const { data, error } = await supabaseServer.rpc('issue_gate_pass', {
      p_request_reference: requestReference,
      p_pass_number: passNumber,
      p_token_hash: tokenHash,
      p_expires_at: expiresAt
    });

    if (error) {
      console.error("RPC Error:", error);
      throw new Error("Database error while issuing pass.");
    }

    if (!data.success) {
      throw new Error(data.message || "Failed to issue pass.");
    }

    // Always return the HMAC token so it can be rendered in the QR code
    return {
      success: true,
      passNumber: data.pass_number,
      token: generateGatePassToken(data.pass_number),
      alreadyIssued: data.already_issued
    };

  } catch (err: unknown) {
    console.error("Issue Gate Pass Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred."
    };
  }
}
