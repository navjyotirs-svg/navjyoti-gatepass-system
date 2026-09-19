import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getMessaging } from 'firebase-admin/messaging';

if (getApps().length === 0) {
  try {
    // Determine how we load credentials. It could be from a JSON file path or a stringified JSON in env.
    let serviceAccountString = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (serviceAccountString) {
      // Handle single quotes often added by .env parsers incorrectly
      if (serviceAccountString.startsWith("'") && serviceAccountString.endsWith("'")) {
        serviceAccountString = serviceAccountString.slice(1, -1);
      }
      const serviceAccount = JSON.parse(serviceAccountString);
      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }
      initializeApp({
        credential: cert(serviceAccount)
      });
    } else {
      console.warn("FIREBASE_SERVICE_ACCOUNT_KEY is not defined. Push notifications will fail if used.");
    }
  } catch (error) {
    console.error('Firebase admin initialization error', error);
  }
}

export const adminMessaging = getApps().length > 0 ? getMessaging() : null;
