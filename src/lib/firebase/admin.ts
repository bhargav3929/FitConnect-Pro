import { initializeApp, getApps, cert } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

if (!getApps().length) {
    let serviceAccount: Record<string, string> | undefined;
    try {
        serviceAccount = process.env.FIREBASE_SERVICE_ACCOUNT
            ? JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT)
            : undefined;
    } catch {
        // Service account JSON may be malformed in dev — fall back to default credentials
        serviceAccount = undefined;
    }
    initializeApp(serviceAccount ? { credential: cert(serviceAccount) } : {});
}

export const adminDb = getFirestore();
export const adminAuth = getAuth();
