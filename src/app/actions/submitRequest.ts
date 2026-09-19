'use server';

import { z } from 'zod';
import { supabaseServer } from '@/lib/supabase/server';
import crypto from 'crypto';
import { resolveHostForNotification } from '@/lib/server/hostResolution';
import { HostSelection } from '@/types/employee';
import { sendPushNotification } from './pushNotification';
import { sendApprovalRequestEmail } from '@/lib/server/email';

// Strict server-side schema
const submitSchema = z.object({
  visitorName: z.string().trim().min(2).max(100),
  visitorMobile: z.string().trim().regex(/^\d{10}$/),
  visitorEmail: z.string().trim().email().max(254).optional(),
  visitorCompany: z.string().trim().max(150).optional(),
  purpose: z.string().trim().min(3).max(500),
  visitorPhotoPath: z.string().min(1),
  hostSelection: z.object({
    type: z.enum(['employee', 'department']),
    id: z.string().min(1),
  }),
});

function generateRequestReference(): string {
  const date = new Date();
  const yyyy = date.getFullYear();
  const mm = String(date.getMonth() + 1).padStart(2, '0');
  const dd = String(date.getDate()).padStart(2, '0');
  
  // Generate 4 random alphanumeric characters
  const randomSuffix = Math.random().toString(36).substring(2, 6).toUpperCase();
  
  return `VR-${yyyy}${mm}${dd}-${randomSuffix}`;
}

export async function submitVisitorRequest(formData: unknown) {
  try {
    // 1. Validate incoming data
    const parsed = submitSchema.parse(formData);
    
    // 2. Validate photo path strictly belongs to visitor-photos format (rough check)
    // Actually the upload in Phase 3 returned the path. We assume it's valid if it doesn't contain external URLs.
    if (parsed.visitorPhotoPath.startsWith('http://') || parsed.visitorPhotoPath.startsWith('https://')) {
      throw new Error("Invalid photo path. External URLs are not allowed.");
    }
    
    // 3. Resolve host and determine notification mode
    // This will securely fetch the employee's mobile from DB and validate active status
    const hostSelection: HostSelection = parsed.hostSelection.type === 'department'
      ? { type: 'department', departmentCode: parsed.hostSelection.id as 'HR' }
      : { type: 'employee', employeeId: parsed.hostSelection.id };
      
    // If it's a department, ensure it is 'HR'
    if (hostSelection.type === 'department' && hostSelection.departmentCode !== 'HR') {
      throw new Error("Invalid department selected.");
    }
    
    const hostInfo = await resolveHostForNotification(hostSelection);
    
    // 4. Generate Request Reference
    const requestReference = generateRequestReference();
    
    // 5. Generate secure approval token
    const approvalToken = crypto.randomBytes(32).toString('base64url');
    const approvalTokenHash = crypto.createHash('sha256').update(approvalToken).digest('hex');
    const approvalTokenExpiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000).toISOString();

    // 6. Construct secure insertion payload
    const insertPayload: Record<string, any> = {
      visitor_name: parsed.visitorName,
      visitor_mobile: parsed.visitorMobile,
      visitor_email: (parsed as any).visitorEmail || null,
      visitor_company: parsed.visitorCompany || null,
      visitor_photo_url: parsed.visitorPhotoPath,
      purpose: parsed.purpose,
      status: 'pending',
      request_reference: requestReference,
      meeting_target_type: hostSelection.type,
      department_target: hostSelection.type === 'department' ? hostSelection.departmentCode : null,
      employee_id: hostSelection.type === 'employee' ? hostSelection.employeeId : null,
      approval_token_hash: approvalTokenHash,
      approval_token_expires_at: approvalTokenExpiresAt,
    };
    
    // 6. Insert into Supabase securely using Service Role (bypasses RLS)
    const { data: requestRecord, error: insertError } = await supabaseServer
      .from('gate_pass_requests')
      .insert(insertPayload)
      .select('id')
      .single();
      
    if (insertError) {
      console.error("Supabase insert error:", insertError);
      throw new Error("Failed to insert request into database.");
    }
    // 7. Dispatch approval notification (FREE channels)
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const approvalLink = `${appUrl}/approve/${requestReference}?token=${approvalToken}`;
    if (hostInfo.notificationMode === 'push' && hostSelection.type === 'employee') {
      // Push via FCM (free) - fire and forget
      sendPushNotification({
        requestId: requestRecord.id,
        employeeId: hostSelection.employeeId,
        visitorName: parsed.visitorName,
        purpose: parsed.purpose,
        requestReference,
        approvalToken
      }).catch(err => console.error("Push dispatch failed:", err));
      // Also send Gmail as second agent (free) if employee has email
      if (hostInfo.hasEmail && hostInfo.employeeEmail) {
        sendApprovalRequestEmail({
          to: hostInfo.employeeEmail,
          hostName: hostInfo.displayName,
          visitorName: parsed.visitorName,
          visitorMobile: parsed.visitorMobile,
          visitorCompany: parsed.visitorCompany || null,
          visitorEmail: (parsed as any).visitorEmail || null,
          purpose: parsed.purpose,
          approvalLink,
        }).catch(err => console.error("Approval email (second agent) failed:", err));
      }
    } else if (hostInfo.notificationMode === 'email' && hostInfo.employeeEmail) {
      // Email via Gmail SMTP (free 100/day) - fire and forget, zero cost
      sendApprovalRequestEmail({
        to: hostInfo.employeeEmail,
        hostName: hostInfo.displayName,
        visitorName: parsed.visitorName,
        visitorMobile: parsed.visitorMobile,
        visitorCompany: parsed.visitorCompany || null,
        visitorEmail: (parsed as any).visitorEmail || null,
        purpose: parsed.purpose,
        approvalLink,
      }).catch(err => console.error("Approval email dispatch failed:", err));
    }
    // whatsapp/manual are handled client-side via wa.me link (also free) - no server dispatch needed
    
    // 8. Prepare notification data
    return {
      success: true,
      requestId: requestRecord.id,
      requestReference,
      notificationMode: hostInfo.notificationMode,
      hostName: hostInfo.displayName,
      approvalToken
    };
    
  } catch (err: unknown) {
    console.error("Submit Visitor Request Error:", err);
    return {
      success: false,
      error: err instanceof Error ? err.message : "An unexpected error occurred during submission."
    };
  }
}
