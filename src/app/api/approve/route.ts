import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import crypto from 'crypto';
import { sendVisitorDecisionEmail } from '@/lib/server/email';

export async function POST(request: Request) {
  try {
    const { requestReference, token, decision } = await request.json();

    if (!requestReference || !token || !decision) {
      return NextResponse.json({ success: false, message: 'Missing parameters' }, { status: 400 });
    }

    if (decision !== 'approved' && decision !== 'rejected') {
      return NextResponse.json({ success: false, message: 'Invalid decision' }, { status: 400 });
    }

    // Hash the provided token
    const tokenHash = crypto.createHash('sha256').update(token).digest('hex');

    // Call the RPC function
    const { data, error } = await supabaseServer.rpc('decide_request', {
      p_request_reference: requestReference,
      p_token_hash: tokenHash,
      p_new_status: decision,
      p_decision_by: 'employee_link' // Hardcoded for this route
    });

    if (error) {
      console.error('Error in decide_request RPC:', error);
      return NextResponse.json({ success: false, message: 'Database error' }, { status: 500 });
    }

    if (data && data.success === false) {
      return NextResponse.json({ success: false, message: data.message }, { status: 400 });
    }

    // Fetch visitor email to notify them
    const { data: requestRecord } = await supabaseServer
      .from('gate_pass_requests')
      .select('visitor_email, visitor_name, request_reference')
      .eq('request_reference', requestReference)
      .single();

    if (requestRecord && (requestRecord as any).visitor_email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const passLink = `${appUrl}/visit/pass/${requestRecord.request_reference}`;
      
      // Fire and forget
      sendVisitorDecisionEmail({
        to: (requestRecord as any).visitor_email,
        visitorName: requestRecord.visitor_name,
        status: decision,
        passLink
      }).catch(err => console.error("Failed to send visitor email on host approval:", err));
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('API Error in /api/approve:', error);
    return NextResponse.json({ success: false, message: 'Internal Server Error' }, { status: 500 });
  }
}
