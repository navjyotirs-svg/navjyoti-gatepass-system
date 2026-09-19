'use server';

import { supabaseServer } from '@/lib/supabase/server';

export async function registerPushDevice(employeeId: string, token: string, label: string = 'Browser') {
  try {
    // Upsert the token to handle duplicates if the token is already registered to this employee
    const { error } = await supabaseServer.from('employee_push_devices').upsert({
      employee_id: employeeId,
      fcm_token: token,
      active: true,
      device_label: label,
      updated_at: new Date().toISOString()
    }, { onConflict: 'fcm_token' });

    if (error) {
      console.error('Failed to register push device:', error);
      return { success: false, error: 'Failed to register device.' };
    }
    
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: 'Internal server error.' };
  }
}

export async function unregisterPushDevice(token: string) {
  try {
    const { error } = await supabaseServer.from('employee_push_devices').delete().eq('fcm_token', token);

    if (error) {
      console.error('Failed to unregister push device:', error);
      return { success: false, error: 'Failed to unregister device.' };
    }
    
    return { success: true };
  } catch (err) {
    console.error(err);
    return { success: false, error: 'Internal server error.' };
  }
}

import { adminMessaging } from '@/lib/server/firebase';

export async function sendTestPushNotification(token: string) {
  try {
    if (!adminMessaging) {
      return { success: false, error: 'Firebase not initialized' };
    }
    const messagePayload = {
      notification: {
        title: 'Test Notification from Gate Pass',
        body: 'If you are reading this, your push notifications are perfectly configured!',
      },
      data: {
        url: '/'
      },
      token: token
    };
    await adminMessaging.send(messagePayload);
    return { success: true };
  } catch (e: unknown) {
    console.error("Test push failed:", e);
    return { success: false, error: e instanceof Error ? e.message : 'Unknown error' };
  }
}
