importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/10.7.1/firebase-messaging-compat.js');

// Will be initialized via query params or environment building in a real app,
// or we can use a hardcoded config here for the service worker.
// To keep things simple for the demo, we will listen for a message to initialize it,
// or assume a fixed config. Wait, service worker needs the config to receive background pushes.
// Usually, we define the config directly in the SW.

firebase.initializeApp({
  apiKey: "AIzaSyCddXa3_C-JgA2xtiG9ru8UTrr94zJX1Zw",
  authDomain: "gatepass-90f93.firebaseapp.com",
  projectId: "gatepass-90f93",
  storageBucket: "gatepass-90f93.firebasestorage.app",
  messagingSenderId: "160920186582",
  appId: "1:160920186582:web:4c378a6cdd916aa18ae377"
});

const messaging = firebase.messaging();

messaging.onBackgroundMessage((payload) => {
  console.log('[firebase-messaging-sw.js] Received background message ', payload);
  
  const notificationTitle = payload.notification?.title || 'New Notification';
  const notificationOptions = {
    body: payload.notification?.body,
    icon: '/navjyoti-logo.png',
    data: {
      url: payload.data?.url || '/'
    }
  };

  self.registration.showNotification(notificationTitle, notificationOptions);
});

self.addEventListener('notificationclick', function(event) {
  console.log('[firebase-messaging-sw.js] Notification click Received.', event.notification.data);
  event.notification.close();
  
  const targetUrl = event.notification.data.url;
  
  event.waitUntil(
    clients.matchAll({ type: 'window', includeUncontrolled: true }).then((windowClients) => {
      // Check if there is already a window/tab open with the target URL
      for (let i = 0; i < windowClients.length; i++) {
        const client = windowClients[i];
        if (client.url === targetUrl && 'focus' in client) {
          return client.focus();
        }
      }
      // If not, open a new window/tab
      if (clients.openWindow) {
        return clients.openWindow(targetUrl);
      }
    })
  );
});
