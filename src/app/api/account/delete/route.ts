import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminAuth } from '@/lib/firebase/admin';
import { FieldValue } from 'firebase-admin/firestore';
import { cancelRazorpaySubscription } from '@fitconnect/shared/payments/razorpay-processor';
import { sign as cryptoSign } from 'crypto';

type DeleteAccountBody = {
    appleAuthorizationCode?: string;
};

type RouteError = {
    status: number;
    error: string;
    code: string;
};

type AppleTokenResponse = {
    access_token?: string;
    refresh_token?: string;
    error?: string;
    error_description?: string;
};

const APPLE_TOKEN_URL = 'https://appleid.apple.com/auth/token';
const APPLE_REVOKE_URL = 'https://appleid.apple.com/auth/revoke';

function routeError(status: number, error: string, code: string): RouteError {
    return { status, error, code };
}

function base64Url(input: string | Buffer): string {
    return Buffer.from(input)
        .toString('base64')
        .replace(/\+/g, '-')
        .replace(/\//g, '_')
        .replace(/=+$/g, '');
}

function getAppleConfig() {
    const teamId = process.env.APPLE_TEAM_ID;
    const keyId = process.env.APPLE_KEY_ID;
    const privateKey = process.env.APPLE_PRIVATE_KEY?.replace(/\\n/g, '\n');
    const clientId = process.env.APPLE_CLIENT_ID || 'com.fitconnect.pro';

    if (!teamId || !keyId || !privateKey || !clientId) {
        throw routeError(
            500,
            'Apple account deletion is not configured. Please contact support.',
            'apple-revoke-not-configured',
        );
    }

    return { teamId, keyId, privateKey, clientId };
}

function createAppleClientSecret(): string {
    const { teamId, keyId, privateKey, clientId } = getAppleConfig();
    const nowSeconds = Math.floor(Date.now() / 1000);
    const header = base64Url(JSON.stringify({ alg: 'ES256', kid: keyId }));
    const payload = base64Url(JSON.stringify({
        iss: teamId,
        iat: nowSeconds,
        exp: nowSeconds + 300,
        aud: 'https://appleid.apple.com',
        sub: clientId,
    }));
    const unsignedToken = `${header}.${payload}`;
    const signature = cryptoSign('sha256', Buffer.from(unsignedToken), {
        key: privateKey,
        dsaEncoding: 'ieee-p1363',
    });

    return `${unsignedToken}.${base64Url(signature)}`;
}

async function postAppleForm(url: string, params: URLSearchParams): Promise<AppleTokenResponse> {
    const res = await fetch(url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: params.toString(),
    });
    const data = await res.json().catch(() => ({})) as AppleTokenResponse;

    if (!res.ok) {
        console.error('[account/delete] Apple request failed:', {
            status: res.status,
            error: data.error,
            errorDescription: data.error_description,
        });
        throw routeError(
            502,
            'Unable to revoke Apple sign-in before deleting account. Please try again.',
            'apple-revoke-failed',
        );
    }

    return data;
}

async function revokeAppleAuthorization(authorizationCode: string): Promise<void> {
    const { clientId } = getAppleConfig();
    const clientSecret = createAppleClientSecret();

    const tokenData = await postAppleForm(APPLE_TOKEN_URL, new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        code: authorizationCode,
        grant_type: 'authorization_code',
    }));

    const tokenToRevoke = tokenData.refresh_token || tokenData.access_token;
    const tokenTypeHint = tokenData.refresh_token ? 'refresh_token' : 'access_token';

    if (!tokenToRevoke) {
        throw routeError(
            502,
            'Apple did not return a token to revoke. Please try deleting again.',
            'apple-revoke-failed',
        );
    }

    await postAppleForm(APPLE_REVOKE_URL, new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        token: tokenToRevoke,
        token_type_hint: tokenTypeHint,
    }));
}

async function ensureAppleAuthorizationRevoked(
    userId: string,
    appleAuthorizationCode?: string,
): Promise<void> {
    const authUser = await adminAuth.getUser(userId);
    const hasAppleProvider = authUser.providerData.some(
        (provider) => provider.providerId === 'apple.com',
    );

    if (!hasAppleProvider) return;

    if (!appleAuthorizationCode) {
        throw routeError(
            400,
            'Please confirm with Apple before deleting your account.',
            'apple-reauth-required',
        );
    }

    await revokeAppleAuthorization(appleAuthorizationCode);
}

export async function POST(req: NextRequest) {
    try {
        const authHeader = req.headers.get('Authorization');
        if (!authHeader?.startsWith('Bearer ')) {
            return NextResponse.json(
                { error: 'Must be logged in to delete account', code: 'unauthenticated' },
                { status: 401 },
            );
        }
        const token = authHeader.split('Bearer ')[1];
        const decoded = await adminAuth.verifyIdToken(token);
        const userId = decoded.uid;
        const body = await req.json().catch(() => ({})) as DeleteAccountBody;

        await ensureAppleAuthorizationRevoked(userId, body.appleAuthorizationCode);

        const now = FieldValue.serverTimestamp();
        const userRef = adminDb.collection('users').doc(userId);
        const userDoc = await userRef.get();
        const subscription = userDoc.data()?.subscription as Record<string, unknown> | undefined;
        const razorpaySubscriptionId = subscription?.razorpaySubscriptionId as string | undefined;

        if (razorpaySubscriptionId) {
            const keyId = process.env.RAZORPAY_KEY_ID;
            const keySecret = process.env.RAZORPAY_KEY_SECRET;
            if (!keyId || !keySecret) {
                throw routeError(
                    500,
                    'Unable to cancel active billing before deleting account. Please contact support.',
                    'billing-cancel-not-configured',
                );
            }

            try {
                await cancelRazorpaySubscription(razorpaySubscriptionId, keyId, keySecret, false);
            } catch (cancelError) {
                const message = cancelError instanceof Error ? cancelError.message : String(cancelError);
                if (!/cancelled|canceled|completed|not found/i.test(message)) {
                    console.error('[account/delete] Failed to cancel Razorpay subscription:', cancelError);
                    throw routeError(
                        502,
                        'Unable to cancel active billing before deleting account. Please contact support.',
                        'billing-cancel-failed',
                    );
                }
            }
        }

        // Cancel all upcoming confirmed bookings and release their class spots.
        const today = new Date();
        today.setHours(0, 0, 0, 0);

        const bookingsSnap = await adminDb
            .collection('bookings')
            .where('userId', '==', userId)
            .get();

        for (const bDoc of bookingsSnap.docs) {
            const b = bDoc.data();
            const classDate = b.classDate?.toDate
                ? b.classDate.toDate()
                : new Date(b.classDate);

            // Release spot for upcoming confirmed bookings only
            if (b.status === 'confirmed' && classDate >= today) {
                const classRef = adminDb.collection('classes').doc(b.classId);
                const classDoc = await classRef.get();
                if (classDoc.exists) {
                    const update: Record<string, unknown> = {
                        bookedCount: FieldValue.increment(-1),
                        updatedAt: now,
                    };
                    if (b.spotNumber !== undefined) {
                        update.bookedSpots = FieldValue.arrayRemove(b.spotNumber);
                    }
                    await classRef.update(update);
                }
            }

            // Anonymize the booking record (preserve historical aggregates, drop PII).
            await bDoc.ref.update({
                userId: 'deleted-user',
                userName: 'Deleted User',
                guestName: FieldValue.delete(),
                status: b.status === 'confirmed' && classDate >= today ? 'canceled' : b.status,
                canceledAt: b.status === 'confirmed' ? now : b.canceledAt ?? null,
                updatedAt: now,
                deletedByUser: true,
            });
        }

        const paymentsSnap = await adminDb
            .collection('payments')
            .where('userId', '==', userId)
            .get();

        for (const paymentDoc of paymentsSnap.docs) {
            await paymentDoc.ref.update({
                userId: 'deleted-user',
                deletedByUser: true,
                updatedAt: now,
            });
        }

        const leadsSnap = await adminDb
            .collection('introClassLeads')
            .where('userId', '==', userId)
            .get();

        for (const leadDoc of leadsSnap.docs) {
            await leadDoc.ref.update({
                userId: 'deleted-user',
                name: FieldValue.delete(),
                email: FieldValue.delete(),
                phone: FieldValue.delete(),
                deletedByUser: true,
                updatedAt: now,
            });
        }

        // Delete the Firestore user profile
        await userRef.delete();

        // Delete any admin role doc if present
        await adminDb.collection('admins').doc(userId).delete().catch(() => {});

        // Delete the Auth user (irreversible)
        await adminAuth.deleteUser(userId);

        return NextResponse.json({ success: true });
    } catch (error: unknown) {
        if (error && typeof error === 'object' && 'status' in error) {
            const e = error as { status: number; error: string; code: string };
            return NextResponse.json({ error: e.error, code: e.code }, { status: e.status });
        }
        console.error('Error deleting account:', error);
        return NextResponse.json(
            { error: 'Failed to delete account', code: 'internal' },
            { status: 500 },
        );
    }
}
