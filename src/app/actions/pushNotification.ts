'use server';

import { supabaseServer } from '@/lib/supabase/server';
import { adminMessaging } from '@/lib/server/firebase';

interface PushNotificationPayload {
  requestId: string;
  employeeId: string;
  visitorName: string;
  purpose: string;
  requestReference: string;
  approvalToken: string;
}

export async function sendPushNotification(payload: PushNotificationPayload) {
  try {
    // 1. Fetch active devices for the employee
    const { data: devices } = await supabaseServer
      .from('employee_push_devices')
      .select('fcm_token')
      .eq('employee_id', payload.employeeId)
      .eq('active', true);

    if (!devices || devices.length === 0) {
      console.log('No active push devices found for employee:', payload.employeeId);
      return { success: false, reason: 'unavailable' };
    }

    if (!adminMessaging) {
      console.error('Firebase Admin SDK is not initialized.');
      // Record failure
      await recordAttempt(payload.requestId, payload.employeeId, 'push', 'failed', 'firebase_not_initialized');
      return { success: false, reason: 'failed' };
    }

    const appUrl = process.env.NEXT_PUBLIC_APP_URL || 'http://localhost:3000';
    const approvalLink = `${appUrl}/approve/${payload.requestReference}?token=${payload.approvalToken}`;

    const messagePayload = {
      notification: {
        title: 'Visitor Approval Request',
        body: `${payload.visitorName} wants to meet you. Purpose: ${payload.purpose}`,
      },
      data: {
        url: approvalLink,
      },
      tokens: devices.map(d => d.fcm_token)
    };

    const response = await adminMessaging.sendEachForMulticast(messagePayload);
    
    if (response.successCount > 0) {
      await recordAttempt(payload.requestId, payload.employeeId, 'push', 'sent', null);
      return { success: true };
    } else {
      await recordAttempt(payload.requestId, payload.employeeId, 'push', 'failed', 'fcm_delivery_failed');
      return { success: false, reason: 'failed' };
    }
  } catch (error) {
    console.error('Push notification error:', error);
    await recordAttempt(payload.requestId, payload.employeeId, 'push', 'failed', 'exception');
    return { success: false, reason: 'failed' };
  }
}

async function recordAttempt(requestId: string, employeeId: string, channel: string, status: string, errorCode: string | null) {
  await supabaseServer.from('notification_attempts').insert({
    request_id: requestId,
    employee_id: employeeId,
    channel,
    status,
    error_code: errorCode
  });
}
