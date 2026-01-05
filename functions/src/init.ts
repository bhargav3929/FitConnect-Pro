import * as functions from 'firebase-functions';
import * as admin from 'firebase-admin';

// Initialize Admin SDK
if (!admin.apps.length) {
    admin.initializeApp();
}

export const db = admin.firestore();
export const auth = admin.auth();
export const storage = admin.storage();
