'use server';

import { supabaseServer } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function processSelfCheckout(formData: FormData) {
  const identifier = String(formData.get('identifier') || '').trim();
  
  if (!identifier) {
    return { success: false, message: 'Please enter your mobile or pass number.' };
  }

  // Find active pass by pass_number or mobile
  const { data: activePasses, error } = await supabaseServer
    .from('gate_pass_requests')
    .select('id, pass_number, visitor_name')
    .eq('status', 'approved')
    .eq('visit_status', 'checked_in')
    .is('check_out_at', null)
    .or(`pass_number.eq.${identifier},visitor_mobile.eq.${identifier}`);

  if (error || !activePasses || activePasses.length === 0) {
    return { success: false, message: 'No active visit found. You may have already checked out.' };
  }

  let successCount = 0;
  for (const pass of activePasses) {
    const { error: checkoutError } = await supabaseServer.rpc('check_out_visitor', {
      p_pass_number: pass.pass_number,
      p_performed_by: 'self_checkout_kiosk',
      p_method: 'kiosk',
    });
    
    if (!checkoutError) {
      successCount++;
      revalidatePath(`/verify/${pass.pass_number}`);
    }
  }

  if (successCount === 0) {
    return { success: false, message: 'Failed to process checkout. Please try again.' };
  }

  revalidatePath('/admin');
  revalidatePath('/gate');
  
  return { 
    success: true, 
    visitorName: activePasses[0].visitor_name 
  };
}
