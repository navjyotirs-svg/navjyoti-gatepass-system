import { supabaseServer } from '../supabase/server';
import { HostSelection, HostNotificationCapability } from '../../types/employee';

/**
 * Normalizes a given Indian mobile number for WhatsApp routing.
 * Converts things like +91 98106 15904 into 919810615904.
 */
export function normalizeMobile(mobile: string | null): string | null {
  if (!mobile) return null;
  // Remove all non-digit characters
  let digits = mobile.replace(/\D/g, '');
  
  if (digits.length === 10) {
    digits = '91' + digits;
  }
  
  return digits;
}

/**
 * Server-only utility to securely resolve a HostSelection into a HostNotificationCapability.
 * Since employee mobile numbers are not exposed to the public frontend, this securely
 * fetches the record from the Supabase 'employees' table.
 */
export async function resolveHostForNotification(selection: HostSelection): Promise<HostNotificationCapability> {
  if (selection.type === 'department') {
    return {
      selectionType: 'department',
      displayName: selection.departmentCode,
      hasMobile: false,
      normalizedMobile: null,
      hasEmail: false,
      employeeEmail: null,
      notificationMode: 'manual',
    };
  }
  
  // Try fetching the employee (include email for free Gmail approval)
  const { data: employee, error } = await supabaseServer
    .from('employees')
    .select('name, mobile, email, active')
    .eq('id', selection.employeeId)
    .single();

  if (error || !employee) {
    throw new Error('Employee not found or invalid ID');
  }

  if (!employee.active) {
    throw new Error('Selected employee is inactive');
  }

  const { data: devices } = await supabaseServer
    .from('employee_push_devices')
    .select('fcm_token')
    .eq('employee_id', selection.employeeId)
    .eq('active', true);

  const hasPush = devices && devices.length > 0;
  const normalized = normalizeMobile(employee.mobile);
  const hasMobile = Boolean(normalized);
  const employeeEmail = (employee as any).email as string | null;
  const hasEmail = Boolean(employeeEmail && employeeEmail.includes('@'));

  // Priority: push (free FCM) > email (free Gmail SMTP) > whatsapp (free wa.me) > manual
  let notificationMode: 'push' | 'email' | 'whatsapp' | 'manual' = 'manual';
  if (hasPush) {
    notificationMode = 'push';
  } else if (hasEmail) {
    notificationMode = 'email';
  } else if (hasMobile) {
    notificationMode = 'whatsapp';
  }

  return {
    selectionType: 'employee',
    employeeId: selection.employeeId,
    displayName: employee.name,
    hasMobile,
    normalizedMobile: normalized,
    hasEmail,
    employeeEmail: employeeEmail || null,
    notificationMode,
  };
}
