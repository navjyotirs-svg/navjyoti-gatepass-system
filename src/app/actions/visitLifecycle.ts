'use server';

import { redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import crypto from 'crypto';
import { supabaseServer } from '@/lib/supabase/server';
import { generateGatePassToken } from '@/lib/server/crypto';
import { createGateSession, gatePasswordIsValid, isGateOperatorAuthorized } from '@/lib/server/gateAuth';

function safeRedirectPath(value: FormDataEntryValue | null) {
  const path = typeof value === 'string' ? value : '/gate';
  return path.startsWith('/') && !path.startsWith('//') ? path : '/gate';
}

export async function authenticateGateOperator(formData: FormData) {
  const password = String(formData.get('password') || '');
  const returnTo = safeRedirectPath(formData.get('returnTo'));
  if (!gatePasswordIsValid(password)) redirect(`${returnTo}${returnTo.includes('?') ? '&' : '?'}authError=1`);
  await createGateSession();
  redirect(returnTo);
}

function tokenIsValid(passNumber: string, providedToken: string) {
  const expected = generateGatePassToken(passNumber);
  const a = Buffer.from(providedToken);
  const b = Buffer.from(expected);
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

async function performGateAction(formData: FormData, action: 'check_in_visitor' | 'check_out_visitor', method: string = 'qr') {
  const passNumber = String(formData.get('passNumber') || '');
  const token = String(formData.get('token') || '');
  if (!passNumber || !token || !tokenIsValid(passNumber, token)) return { success: false, message: 'Invalid gate pass token.' };

  const { data, error } = await supabaseServer.rpc(action, {
    p_pass_number: passNumber,
    p_performed_by: 'self_service',
    p_method: method,
  });
  if (error) return { success: false, message: 'The gate action could not be completed.' };
  revalidatePath(`/verify/${passNumber}`);
  revalidatePath('/admin');
  revalidatePath('/gate');
  return data as { success: boolean; message?: string };
}

export async function checkInVisitor(formData: FormData) {
  return performGateAction(formData, 'check_in_visitor', 'qr');
}

export async function checkOutVisitor(formData: FormData) {
  return performGateAction(formData, 'check_out_visitor', 'qr');
}

export async function manualCheckOutVisitor(formData: FormData) {
  if (!(await isGateOperatorAuthorized())) return { success: false, message: 'Gate operator authorization required.' };
  const passNumber = String(formData.get('passNumber') || '');
  if (!passNumber) return { success: false, message: 'Pass number is required.' };
  const { data, error } = await supabaseServer.rpc('check_out_visitor', {
    p_pass_number: passNumber,
    p_performed_by: 'gate_operator',
    p_method: 'manual_security',
  });
  if (error) return { success: false, message: 'The gate action could not be completed.' };
  revalidatePath(`/verify/${passNumber}`);
  revalidatePath('/admin');
  revalidatePath('/gate');
  return data as { success: boolean; message?: string };
}

