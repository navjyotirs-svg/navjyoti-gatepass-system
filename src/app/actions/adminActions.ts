'use server';

import { supabaseServer } from '@/lib/supabase/server';
import { sendVisitorDecisionEmail } from '@/lib/server/email';
import { revalidatePath } from 'next/cache';

export async function adminDecideRequest(requestId: string, decision: 'approved' | 'rejected') {
  try {
    const { data: requestRecord, error: fetchError } = await supabaseServer
      .from('gate_pass_requests')
      .select('visitor_email, visitor_name, request_reference, status')
      .eq('id', requestId)
      .single();

    if (fetchError || !requestRecord) {
      return { success: false, message: 'Request not found' };
    }

    if (requestRecord.status !== 'pending') {
      return { success: false, message: `Request is already ${requestRecord.status}` };
    }

    const { error: updateError } = await supabaseServer
      .from('gate_pass_requests')
      .update({
        status: decision,
        decision_at: new Date().toISOString(),
        decision_by: 'admin_dashboard',
        approved_at: decision === 'approved' ? new Date().toISOString() : null,
        rejected_at: decision === 'rejected' ? new Date().toISOString() : null,
      })
      .eq('id', requestId);

    if (updateError) {
      console.error('Error updating request via admin:', updateError);
      return { success: false, message: 'Failed to update request' };
    }

    // Send email to visitor if they provided one
    if ((requestRecord as any).visitor_email) {
      const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
      const passLink = `${appUrl}/visit/pass/${requestRecord.request_reference}`;
      
      await sendVisitorDecisionEmail({
        to: (requestRecord as any).visitor_email,
        visitorName: requestRecord.visitor_name,
        status: decision,
        passLink
      }).catch(err => console.error("Admin decision email failed:", err));
    }

    revalidatePath('/admin');
    return { success: true };
  } catch (err) {
    console.error('Admin decide error:', err);
    return { success: false, message: 'Internal server error' };
  }
}

export async function resendPassEmail(requestId: string) {
  try {
    const { data: requestRecord, error } = await supabaseServer
      .from('gate_pass_requests')
      .select('visitor_email, visitor_name, request_reference, status')
      .eq('id', requestId)
      .single();

    if (error || !requestRecord) {
      return { success: false, message: 'Request not found' };
    }

    if (!(requestRecord as any).visitor_email) {
      return { success: false, message: 'No email address on file for this visitor' };
    }

    if (requestRecord.status !== 'approved') {
      return { success: false, message: 'Only approved passes can be resent' };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const passLink = `${appUrl}/visit/pass/${requestRecord.request_reference}`;
    
    await sendVisitorDecisionEmail({
      to: (requestRecord as any).visitor_email,
      visitorName: requestRecord.visitor_name,
      status: 'approved',
      passLink
    });

    return { success: true, message: 'Pass resent successfully' };
  } catch (err) {
    console.error('Resend email error:', err);
    return { success: false, message: 'Internal server error' };
  }
}

export async function getGatePasses(page: number = 1, limit: number = 100, filter: string = 'all', search: string = '') {
  let query = supabaseServer
    .from('gate_pass_requests')
    .select('*, host:employee_id(name, department)', { count: 'exact' });

  // Apply filters at the database level for efficiency
  if (filter === 'pending') query = query.eq('status', 'pending');
  else if (filter === 'awaiting') query = query.eq('status', 'approved').is('visit_status', null);
  else if (filter === 'inside') query = query.eq('visit_status', 'checked_in').is('check_out_at', null);
  else if (filter === 'completed') query = query.eq('visit_status', 'checked_out');
  else if (filter === 'rejected') query = query.eq('status', 'rejected');

  if (search) {
    const searchPattern = `%${search}%`;
    query = query.or(`visitor_name.ilike.${searchPattern},visitor_mobile.ilike.${searchPattern},pass_number.ilike.${searchPattern},visitor_company.ilike.${searchPattern}`);
  }

  // Pagination
  const from = (page - 1) * limit;
  const to = from + limit - 1;
  
  query = query.order('created_at', { ascending: false }).range(from, to);

  const { data, count, error } = await query;
  
  if (error || !data) {
    console.error('Error fetching passes:', error);
    return { data: [], count: 0 };
  }

  // Sign photo URLs in bulk
  const photoPaths = Array.from(new Set(data.map(r => r.visitor_photo_url).filter(Boolean)));
  if (photoPaths.length > 0) {
    const { data: signedUrls, error: signError } = await supabaseServer.storage
      .from('visitor-photos')
      .createSignedUrls(photoPaths, 3600);
      
    if (!signError && signedUrls) {
      const urlMap = new Map(signedUrls.map(item => [item.path, item.signedUrl]));
      for (const row of data) {
        if (row.visitor_photo_url && urlMap.has(row.visitor_photo_url)) {
          row.visitor_photo_url = urlMap.get(row.visitor_photo_url);
        }
      }
    }
  }

  return { data, count };
}
