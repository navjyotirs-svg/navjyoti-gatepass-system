'use client';

import { useEffect } from 'react';
import { messaging, onMessage } from '@/lib/client/firebase';

export function ForegroundPushListener() {
  useEffect(() => {
    if (typeof window === 'undefined' || !messaging) return;

    const unsubscribe = onMessage(messaging, (payload) => {
      console.log('Message received in foreground:', payload);
      
      const notificationTitle = payload.notification?.title || 'New Notification';
      const notificationOptions = {
        body: payload.notification?.body,
        icon: '/navjyoti-logo.png',
        data: {
          url: payload.data?.url || '/'
        }
      };

      // Ensure permissions are granted before showing local notification
      if (Notification.permission === 'granted' && 'serviceWorker' in navigator) {
        navigator.serviceWorker.ready.then((registration) => {
          registration.showNotification(notificationTitle, notificationOptions);
        });
      }
    });

    return () => {
      unsubscribe();
    };
  }, []);

  return null;
}
