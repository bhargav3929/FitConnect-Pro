import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase/admin';
import { Storage } from '@google-cloud/storage';

const BUCKET = 'sol-pilates-studio-storage';
const MAX_SIZE = 10 * 1024 * 1024; // 10MB

function getStorage() {
    const raw = process.env.FIREBASE_SERVICE_ACCOUNT || '';
    const cleaned = raw.replace(/\\\n/g, '\\n');
    const creds = JSON.parse(cleaned);
    if (creds.private_key) creds.private_key = creds.private_key.replace(/\\n/g, '\n');
    return new Storage({ credentials: creds, projectId: creds.project_id });
}

export async function POST(req: NextRequest) {
    const t0 = Date.now();
    console.log('[upload-avatar] POST received');

    const authHeader = req.headers.get('Authorization');
    if (!authHeader?.startsWith('Bearer ')) {
        return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    let uid: string;
    try {
        const token = authHeader.split('Bearer ')[1];
        console.log('[upload-avatar] verifying token...');
        const decoded = await adminAuth.verifyIdToken(token);
        uid = decoded.uid;
        console.log(`[upload-avatar] token ok uid=${uid} (${Date.now()-t0}ms)`);
    } catch (e) {
        console.log('[upload-avatar] token error:', e);
        return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
    }

    let formData: FormData;
    try {
        console.log('[upload-avatar] parsing formData...');
        formData = await req.formData();
        console.log(`[upload-avatar] formData parsed (${Date.now()-t0}ms)`);
    } catch (e) {
        console.log('[upload-avatar] formData error:', e);
        return NextResponse.json({ error: 'Invalid form data' }, { status: 400 });
    }

    const file = formData.get('avatar') as File | null;
    if (!file) {
        console.log('[upload-avatar] no file in formData, keys:', [...formData.keys()]);
        return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }
    console.log(`[upload-avatar] file: name=${file.name} size=${file.size} type=${file.type}`);

    if (file.size > MAX_SIZE) {
        return NextResponse.json({ error: 'File too large (max 10MB)' }, { status: 413 });
    }

    if (!file.type.startsWith('image/')) {
        return NextResponse.json({ error: 'File must be an image' }, { status: 400 });
    }

    console.log('[upload-avatar] reading buffer...');
    const buffer = Buffer.from(await file.arrayBuffer());
    console.log(`[upload-avatar] buffer ready ${buffer.length} bytes (${Date.now()-t0}ms)`);

    const storage = getStorage();
    const bucket = storage.bucket(BUCKET);
    const gcsFile = bucket.file(`avatars/${uid}/avatar.jpg`);

    console.log('[upload-avatar] uploading to GCS...');
    const t1 = Date.now();
    await gcsFile.save(buffer, { contentType: 'image/jpeg', resumable: false });
    console.log(`[upload-avatar] GCS upload done in ${Date.now()-t1}ms`);

    await gcsFile.makePublic();
    console.log(`[upload-avatar] makePublic done (${Date.now()-t0}ms total)`);

    const publicUrl = `https://storage.googleapis.com/${BUCKET}/avatars/${uid}/avatar.jpg`;

    console.log('[upload-avatar] writing Firestore...');
    await adminDb.collection('users').doc(uid).set({ profilePictureUrl: publicUrl, avatar: publicUrl }, { merge: true });
    console.log(`[upload-avatar] done, total=${Date.now()-t0}ms`);

    return NextResponse.json({ url: publicUrl });
}
