import { ref, uploadBytesResumable, getDownloadURL, deleteObject } from 'firebase/storage';
import { storage } from './config';

const MAX_BYTES = 5 * 1024 * 1024; // 5MB
const ACCEPTED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/gif'];

export interface UploadImageOptions {
    /** Stable id used in the storage path (e.g. trainerId or uid). Falls back to a generated id. */
    id?: string;
    /** Progress callback (0–100). */
    onProgress?: (percent: number) => void;
}

export interface UploadImageResult {
    url: string;
    path: string;
}

/** Validate a candidate image file. Returns an error message, or null if valid. */
export function validateImageFile(file: File): string | null {
    if (!ACCEPTED_TYPES.includes(file.type)) {
        return 'Please choose a JPG, PNG, WebP, or GIF image.';
    }
    if (file.size > MAX_BYTES) {
        return 'Image must be smaller than 5MB.';
    }
    return null;
}

/**
 * Upload an image file to Firebase Storage under `folder/<id>.<ext>` and return its
 * permanent download URL. Used for trainer photos and user avatars.
 */
export async function uploadImageFile(
    file: File,
    folder: string,
    options: UploadImageOptions = {},
): Promise<UploadImageResult> {
    const validationError = validateImageFile(file);
    if (validationError) {
        throw new Error(validationError);
    }

    const ext = (file.name.split('.').pop() || 'jpg').toLowerCase();
    const uniqueId = options.id || `${Date.now()}-${Math.random().toString(36).slice(2, 10)}`;
    const path = `${folder}/${uniqueId}.${ext}`;
    const storageRef = ref(storage, path);

    const task = uploadBytesResumable(storageRef, file, { contentType: file.type });

    await new Promise<void>((resolve, reject) => {
        task.on(
            'state_changed',
            (snapshot) => {
                if (options.onProgress && snapshot.totalBytes > 0) {
                    options.onProgress(Math.round((snapshot.bytesTransferred / snapshot.totalBytes) * 100));
                }
            },
            reject,
            () => resolve(),
        );
    });

    const url = await getDownloadURL(task.snapshot.ref);
    return { url, path };
}

/**
 * Best-effort delete of a previously uploaded Storage object by its download URL.
 * Silently ignores failures (e.g. object already gone or external URL).
 */
export async function deleteImageByUrl(url: string): Promise<void> {
    if (!url || !url.includes('firebasestorage.googleapis.com')) return;
    try {
        await deleteObject(ref(storage, url));
    } catch {
        // Non-fatal: the new upload already succeeded, an orphaned object is harmless.
    }
}
