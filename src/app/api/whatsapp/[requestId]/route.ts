import { NextResponse } from 'next/server';
import { supabaseServer } from '@/lib/supabase/server';
import { resolveHostForNotification } from '@/lib/server/hostResolution';
import { HostSelection } from '@/types/employee';

import crypto from 'crypto';

export async function GET(request: Request, { params }: { params: Promise<{ requestId: string }> }) {
  try {
    const { requestId } = await params;

    // 1. Fetch the request to get visitor details and meeting target
    const { data: req, error } = await supabaseServer
      .from('gate_pass_requests')
      .select('visitor_name, visitor_mobile, visitor_company, purpose, meeting_target_type, department_target, employee_id, request_reference')
      .eq('id', requestId)
      .single();

    if (error || !req) {
      return NextResponse.json({ error: 'Request not found' }, { status: 404 });
    }

    // 2. Resolve host
    const hostSelection: HostSelection = req.meeting_target_type === 'department'
      ? { type: 'department', departmentCode: req.department_target as 'HR' }
      : { type: 'employee', employeeId: req.employee_id as string };

    const hostInfo = await resolveHostForNotification(hostSelection);

    if (!hostInfo.normalizedMobile || hostInfo.notificationMode === 'manual') {
      return NextResponse.json({ error: 'WhatsApp routing not available for this host.' }, { status: 400 });
    }

    // 3. Generate Secure Approval Token
    const rawToken = crypto.randomBytes(32).toString('hex');
    const tokenHash = crypto.createHash('sha256').update(rawToken).digest('hex');
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString(); // 24 hours

    const { error: updateError } = await supabaseServer
      .from('gate_pass_requests')
      .update({
        approval_token_hash: tokenHash,
        approval_token_expires_at: expiresAt
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Failed to update request with approval token:', updateError);
      return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const approvalLink = `${appUrl}/approve/${req.request_reference}?token=${rawToken}`;

    // 4. Construct WhatsApp Message
    let text = `*Navjyoti Visitor Approval Request*\n\n`;
    text += `*Visitor:* ${req.visitor_name}\n`;
    text += `*Mobile:* ${req.visitor_mobile}\n`;
    if (req.visitor_company) {
      text += `*Company:* ${req.visitor_company}\n`;
    }
    text += `*Purpose:* ${req.purpose}\n\n`;
    text += `A visitor is waiting to meet you.\n\n`;
    text += `*Please review and decide here:*\n${approvalLink}`;

    const encodedText = encodeURIComponent(text);
    const whatsappUrl = `https://wa.me/${hostInfo.normalizedMobile}?text=${encodedText}`;

    // 4. Return safely as JSON
    return NextResponse.json({ url: whatsappUrl });

  } catch (err) {
    console.error('WhatsApp redirect error:', err);
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}
