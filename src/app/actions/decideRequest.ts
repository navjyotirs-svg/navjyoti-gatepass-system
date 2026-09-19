'use server';

import { supabaseServer } from '@/lib/supabase/server';
import crypto from 'crypto';

export async function decideVisitorRequest(requestReference: string, rawToken: string, status: 'approved' | 'rejected') {
  try {
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    
    // Call the RPC
    const { data, error } = await supabaseServer.rpc('decide_request', {
      p_request_reference: requestReference,
      p_token_hash: tokenHash,
      p_new_status: status,
      p_decision_by: 'approval_link'
    });

    if (error) {
      console.error("RPC Error:", error);
      return { success: false, message: 'An error occurred while saving the decision.' };
    }

    // RPC returns { success: boolean, message?: string }
    if (!data.success) {
      return { success: false, message: data.message };
    }

    return { success: true };
  } catch (err: unknown) {
    console.error("Decision action error:", err);
    return { success: false, message: 'Internal server error.' };
  }
}
