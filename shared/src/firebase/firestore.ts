import {
    doc,
    getDoc,
    setDoc,
    collection,
    query,
    where,
    orderBy,
    onSnapshot,
    getDocs,
    getCountFromServer,
    limit as limitTo,
    startAfter,
    Timestamp,
    type DocumentData,
    type QueryConstraint,
    type QueryDocumentSnapshot,
    type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './config';
import { getApiBaseUrl } from './api-config';
import { UserProfile } from '../types/user';
import { ClassSession, SpotSelection } from '../types/class';
import { Booking } from '../types/booking';
import { Trainer } from '../types/trainer';
import { GymCenter } from '../types/gym';

// ---------------------------------------------------------------------------
// API call helper — gets ID token and calls our Next.js API routes
// ---------------------------------------------------------------------------

export async function apiFetch<T>(
    url: string,
    options: { method?: string; body?: unknown } = {},
): Promise<T> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();

    const res = await fetch(`${getApiBaseUrl()}${url}`, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });

    const data = (await res.json()) as Record<string, unknown>;
    if (!res.ok) {
        throw new Error((data.error as string) || 'API request failed');
    }
    return data as T;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

export function toDate(val: unknown): Date {
    if (val instanceof Timestamp) return val.toDate();
    if (val instanceof Date) return val;
    if (typeof val === 'string' || typeof val === 'number') return new Date(val);
    return new Date();
}

export function convertTimestamps<T extends Record<string, unknown>>(data: T): T {
    const result = { ...data };
    for (const key of Object.keys(result)) {
        const val = result[key];
        if (val instanceof Timestamp) {
            (result as Record<string, unknown>)[key] = val.toDate();
        }
    }
    return result;
}

export type FirestorePageCursor = QueryDocumentSnapshot<DocumentData> | null;

export interface PaginatedResult<T> {
    items: T[];
    nextCursor: FirestorePageCursor;
    total: number;
}

interface PageOptions {
    pageSize: number;
    cursor?: FirestorePageCursor;
}

async function getPage<T>(
    collectionName: string,
    constraints: QueryConstraint[],
    pageSize: number,
    cursor: FirestorePageCursor | undefined,
    mapper: (snapshot: QueryDocumentSnapshot<DocumentData>) => T,
): Promise<PaginatedResult<T>> {
    const baseQuery = query(collection(db, collectionName), ...constraints);
    const countSnap = await getCountFromServer(baseQuery);
    const pageQuery = query(
        collection(db, collectionName),
        ...constraints,
        ...(cursor ? [startAfter(cursor)] : []),
        limitTo(pageSize),
    );
    const snapshot = await getDocs(pageQuery);

    return {
        items: snapshot.docs.map(mapper),
        nextCursor: snapshot.docs.length === pageSize ? snapshot.docs[snapshot.docs.length - 1] : null,
        total: countSnap.data().count,
    };
}

function mapDocWithId<T>(snapshot: QueryDocumentSnapshot<DocumentData>, idField = 'id'): T {
    return convertTimestamps({
        ...snapshot.data(),
        [idField]: snapshot.id,
    }) as unknown as T;
}

// ---------------------------------------------------------------------------
// 1. getClassesByDate — Query classes for a given date
// ---------------------------------------------------------------------------

export async function getClassesByDate(date: Date): Promise<ClassSession[]> {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const q = query(
        collection(db, 'classes'),
        where('status', '==', 'scheduled'),
        where('date', '>=', Timestamp.fromDate(start)),
        where('date', '<=', Timestamp.fromDate(end)),
        orderBy('date'),
        orderBy('startTime'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return convertTimestamps({ ...data, id: doc.id }) as unknown as ClassSession;
    });
}

// ---------------------------------------------------------------------------
// 2. getClassById — Single class document (with optional real-time listener)
// ---------------------------------------------------------------------------

export async function getClassById(classId: string): Promise<ClassSession | null> {
    const docRef = doc(db, 'classes', classId);
    const snap = await getDoc(docRef);
    if (!snap.exists()) return null;
    return convertTimestamps({ ...snap.data(), id: snap.id }) as unknown as ClassSession;
}

// ---------------------------------------------------------------------------
// 3. getUserBookings — User's bookings ordered by classDate desc
// ---------------------------------------------------------------------------

export async function getUserBookings(userId: string): Promise<Booking[]> {
    const q = query(
        collection(db, 'bookings'),
        where('userId', '==', userId),
        orderBy('classDate', 'desc'),
    );

    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return convertTimestamps({ ...data, id: doc.id }) as unknown as Booking;
    });
}

export async function getUserBookingsPage(
    userId: string,
    options: PageOptions & {
        statuses?: Booking['status'][];
        direction?: 'asc' | 'desc';
    },
): Promise<PaginatedResult<Booking>> {
    const constraints: QueryConstraint[] = [
        where('userId', '==', userId),
        ...(options.statuses && options.statuses.length > 0
            ? [where('status', 'in', options.statuses)]
            : []),
        orderBy('classDate', options.direction || 'desc'),
    ];

    const page = await getPage<Booking>(
        'bookings',
        constraints,
        options.pageSize,
        options.cursor,
        (snapshot) => mapDocWithId<Booking & { classId: string; trainerId: string }>(snapshot),
    );

    const classIds = Array.from(new Set(page.items.map((b) => b.classId).filter(Boolean)));
    const classEntries = await Promise.all(
        classIds.map(async (id) => {
            const snap = await getDoc(doc(db, 'classes', id));
            return [id, snap.exists() ? snap.data() : {}] as const;
        }),
    );
    const classCache = new Map<string, Record<string, unknown>>(classEntries);

    const trainerIds = Array.from(
        new Set(
            page.items
                .map((b) => (classCache.get(b.classId)?.trainerId as string) || b.trainerId)
                .filter(Boolean),
        ),
    );
    const trainerEntries = await Promise.all(
        trainerIds.map(async (id) => {
            const snap = await getDoc(doc(db, 'trainers', id));
            return [id, snap.exists() ? (snap.data().name as string) : 'Instructor'] as const;
        }),
    );
    const trainerCache = new Map<string, string>(trainerEntries);

    return {
        ...page,
        items: page.items.map((b) => {
            const cls = classCache.get(b.classId) || {};
            const trainerId = (cls.trainerId as string) || b.trainerId;
            return {
                ...b,
                classType: (cls.classType as string) || 'Pilates',
                classStartTime: (cls.startTime as string) || '',
                classDuration: (cls.duration as number) || 0,
                classLocation: (cls.location as string) || 'Main Studio',
                trainerName: trainerCache.get(trainerId) || 'Instructor',
            } as Booking;
        }),
    };
}

// ---------------------------------------------------------------------------
// 4. getUserProfile — Enhanced with optional real-time listener
// ---------------------------------------------------------------------------

export async function getUserProfile(uid: string): Promise<UserProfile | null> {
    const userRef = doc(db, 'users', uid);
    const userDoc = await getDoc(userRef);
    if (!userDoc.exists()) return null;
    return convertTimestamps({ ...userDoc.data(), uid: userDoc.id }) as unknown as UserProfile;
}

export function subscribeToUserProfile(
    uid: string,
    callback: (profile: UserProfile | null) => void,
): Unsubscribe {
    const userRef = doc(db, 'users', uid);
    return onSnapshot(userRef, (snap) => {
        if (!snap.exists()) {
            callback(null);
            return;
        }
        callback(convertTimestamps({ ...snap.data(), uid: snap.id }) as unknown as UserProfile);
    });
}

// ---------------------------------------------------------------------------
// 5. getTrainers — All active trainers
// ---------------------------------------------------------------------------

export async function getTrainers(): Promise<Trainer[]> {
    const q = query(
        collection(db, 'trainers'),
        where('isActive', '==', true),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return convertTimestamps({ ...data, id: doc.id }) as unknown as Trainer;
    });
}

// ---------------------------------------------------------------------------
// 6. subscribeToClass — Real-time listener for spot availability
// ---------------------------------------------------------------------------

export function subscribeToClass(
    classId: string,
    callback: (classSession: ClassSession | null) => void,
): Unsubscribe {
    const classRef = doc(db, 'classes', classId);
    return onSnapshot(classRef, (snap) => {
        if (!snap.exists()) {
            callback(null);
            return;
        }
        callback(convertTimestamps({ ...snap.data(), id: snap.id }) as unknown as ClassSession);
    });
}

// Real-time listener for all scheduled classes on a given date.
// Fires whenever any class in the day is added, updated (e.g. bookedSpots changes),
// or removed — used by Dashboard's "Today at the Studio" and Schedule tab.
export function subscribeToClassesByDate(
    date: Date,
    callback: (classes: ClassSession[]) => void,
    options: {
        trainerId?: string;
        classType?: string;
    } = {},
): Unsubscribe {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const q = query(
        collection(db, 'classes'),
        where('status', '==', 'scheduled'),
        ...(options.trainerId ? [where('trainerId', '==', options.trainerId)] : []),
        ...(options.classType ? [where('classType', '==', options.classType)] : []),
        where('date', '>=', Timestamp.fromDate(start)),
        where('date', '<=', Timestamp.fromDate(end)),
        orderBy('date'),
        orderBy('startTime'),
    );
    return onSnapshot(q, (snapshot) => {
        const classes = snapshot.docs.map((doc) => {
            const data = doc.data();
            return convertTimestamps({ ...data, id: doc.id }) as unknown as ClassSession;
        });
        callback(classes);
    });
}

// ---------------------------------------------------------------------------
// 7. subscribeToUserBookings — Real-time listener for user bookings
// ---------------------------------------------------------------------------

export function subscribeToUserBookings(
    userId: string,
    callback: (bookings: Booking[]) => void,
): Unsubscribe {
    const q = query(
        collection(db, 'bookings'),
        where('userId', '==', userId),
        orderBy('classDate', 'desc'),
    );
    const classCache = new Map<string, Record<string, unknown>>();
    const trainerCache = new Map<string, string>();

    return onSnapshot(q, async (snapshot) => {
        const rawBookings = snapshot.docs.map((doc) => {
            const data = doc.data();
            return convertTimestamps({ ...data, id: doc.id }) as unknown as Booking & {
                classId: string;
                trainerId: string;
            };
        });

        const classIds = Array.from(new Set(rawBookings.map((b) => b.classId).filter(Boolean)));
        const missingClassIds = classIds.filter((id) => !classCache.has(id));
        await Promise.all(
            missingClassIds.map(async (id) => {
                const snap = await getDoc(doc(db, 'classes', id));
                if (snap.exists()) classCache.set(id, snap.data() as Record<string, unknown>);
                else classCache.set(id, {});
            }),
        );

        const trainerIds = Array.from(
            new Set(
                rawBookings
                    .map((b) => (classCache.get(b.classId)?.trainerId as string) || b.trainerId)
                    .filter(Boolean),
            ),
        );
        const missingTrainerIds = trainerIds.filter((id) => !trainerCache.has(id));
        await Promise.all(
            missingTrainerIds.map(async (id) => {
                const snap = await getDoc(doc(db, 'trainers', id));
                trainerCache.set(id, snap.exists() ? (snap.data().name as string) : 'Instructor');
            }),
        );

        const enriched = rawBookings.map((b) => {
            const cls = classCache.get(b.classId) || {};
            const trainerId = (cls.trainerId as string) || b.trainerId;
            return {
                ...b,
                classType: (cls.classType as string) || 'Pilates',
                classStartTime: (cls.startTime as string) || '',
                classDuration: (cls.duration as number) || 0,
                classLocation: (cls.location as string) || 'Main Studio',
                trainerName: trainerCache.get(trainerId) || 'Instructor',
            } as Booking;
        });
        callback(enriched);
    });
}

// ---------------------------------------------------------------------------
// 8. getAllClasses — Admin: all classes
// ---------------------------------------------------------------------------

export async function getAllClasses(): Promise<ClassSession[]> {
    const q = query(
        collection(db, 'classes'),
        orderBy('date', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return convertTimestamps({ ...data, id: doc.id }) as unknown as ClassSession;
    });
}

export async function getClassesPage(
    options: PageOptions & { status?: ClassSession['status'] },
): Promise<PaginatedResult<ClassSession>> {
    return getPage<ClassSession>(
        'classes',
        [
            ...(options.status ? [where('status', '==', options.status)] : []),
            orderBy('date', 'desc'),
        ],
        options.pageSize,
        options.cursor,
        (snapshot) => mapDocWithId<ClassSession>(snapshot),
    );
}

export async function getClassStats(): Promise<{
    totalClasses: number;
    scheduledClasses: number;
    completedClasses: number;
    totalCapacity: number;
}> {
    const snapshot = await getDocs(collection(db, 'classes'));
    let totalClasses = 0;
    let scheduledClasses = 0;
    let completedClasses = 0;
    let totalCapacity = 0;

    snapshot.docs.forEach((doc) => {
        const data = doc.data();
        totalClasses++;
        if (data.status === 'scheduled') scheduledClasses++;
        if (data.status === 'completed') completedClasses++;
        totalCapacity += (data.totalSpots as number) || (data.capacity as number) || 0;
    });

    return {
        totalClasses,
        scheduledClasses,
        completedClasses,
        totalCapacity,
    };
}

// ---------------------------------------------------------------------------
// 9. getAllBookings — Admin: all bookings
// ---------------------------------------------------------------------------

export async function getAllBookings(): Promise<Booking[]> {
    const q = query(
        collection(db, 'bookings'),
        orderBy('classDate', 'desc'),
    );
    const snapshot = await getDocs(q);
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return convertTimestamps({ ...data, id: doc.id }) as unknown as Booking;
    });
}

export async function getBookingsPage(
    options: PageOptions & { status?: Booking['status'] },
): Promise<PaginatedResult<Booking>> {
    return getPage<Booking>(
        'bookings',
        [
            ...(options.status ? [where('status', '==', options.status)] : []),
            orderBy('classDate', 'desc'),
        ],
        options.pageSize,
        options.cursor,
        (snapshot) => mapDocWithId<Booking>(snapshot),
    );
}

// ---------------------------------------------------------------------------
// 10. getAllMembers — Admin: all user profiles
// ---------------------------------------------------------------------------

export async function getAllMembers(): Promise<UserProfile[]> {
    const snapshot = await getDocs(collection(db, 'users'));
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return convertTimestamps({ ...data, uid: doc.id }) as unknown as UserProfile;
    });
}

export async function getMembersPage(
    options: PageOptions & {
        planId?: string;
        status?: UserProfile['subscription']['status'];
    },
): Promise<PaginatedResult<UserProfile>> {
    return getPage<UserProfile>(
        'users',
        [
            ...(options.planId ? [where('subscription.planId', '==', options.planId)] : []),
            ...(options.status ? [where('subscription.status', '==', options.status)] : []),
            orderBy('createdAt', 'desc'),
        ],
        options.pageSize,
        options.cursor,
        (snapshot) => mapDocWithId<UserProfile>(snapshot, 'uid'),
    );
}

// ---------------------------------------------------------------------------
// 11. callBookClass — API route wrapper
// ---------------------------------------------------------------------------

export async function callBookClass(
    classId: string,
    spotNumber: number,
    isGuest: boolean,
    guestName?: string,
): Promise<{ success: boolean; bookingId: string }> {
    return apiFetch<{ success: boolean; bookingId: string }>('/api/bookings/book', {
        method: 'POST',
        body: { classId, spotNumber, isGuest, guestName },
    });
}

// ---------------------------------------------------------------------------
// 12. callCancelBooking — API route wrapper
// ---------------------------------------------------------------------------

export async function callCancelBooking(
    bookingId: string,
): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/bookings/cancel', {
        method: 'POST',
        body: { bookingId },
    });
}

// ---------------------------------------------------------------------------
// callDeleteAccount — irreversibly delete the signed-in user's account.
// Cancels upcoming bookings, anonymizes booking history, deletes profile + auth user.
// Caller MUST re-authenticate the user immediately before invoking this.
// ---------------------------------------------------------------------------

export async function callDeleteAccount(): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/account/delete', {
        method: 'POST',
    });
}

// ---------------------------------------------------------------------------
// 13. callCreateClass — API route wrapper for admin
// ---------------------------------------------------------------------------

interface CreateClassInput {
    trainerId: string;
    date: string;
    startTime: string;
    duration: number;
    capacity: number;
    classType?: string;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    equipmentNeeded?: string;
    description?: string;
    totalSpots?: number;
    location?: string;
    intensityLevel?: 1 | 2 | 3;
}

export async function callCreateClass(
    classData: CreateClassInput,
): Promise<{ success: boolean; classId: string }> {
    return apiFetch<{ success: boolean; classId: string }>('/api/classes', {
        method: 'POST',
        body: classData,
    });
}

// ---------------------------------------------------------------------------
// 14. callUpdateClass — API route wrapper for admin
// ---------------------------------------------------------------------------

interface UpdateClassInput extends Partial<CreateClassInput> {
    classId: string;
    status?: 'scheduled' | 'ongoing' | 'completed' | 'canceled';
}

export async function callUpdateClass(
    classData: UpdateClassInput,
): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/classes', {
        method: 'PUT',
        body: classData,
    });
}

// ---------------------------------------------------------------------------
// 15. callDeleteClass — API route wrapper for admin
// ---------------------------------------------------------------------------

export async function callDeleteClass(
    classId: string,
    cancelReason?: string,
): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/classes', {
        method: 'DELETE',
        body: { classId, cancelReason },
    });
}

// ---------------------------------------------------------------------------
// 16. callSetAdminRole — API route wrapper
// ---------------------------------------------------------------------------

export async function callSetAdminRole(
    targetUid: string,
    isAdmin: boolean,
): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/admin/set-role', {
        method: 'POST',
        body: { targetUid, isAdmin },
    });
}

// ---------------------------------------------------------------------------
// 17. callActivateSubscription — API route wrapper (supports both old and new)
// ---------------------------------------------------------------------------

export async function callActivateSubscription(
    planId: string,
): Promise<{ success: boolean; endDate: string }> {
    return apiFetch<{ success: boolean; endDate: string }>('/api/subscriptions/activate', {
        method: 'POST',
        body: { planId },
    });
}

// ---------------------------------------------------------------------------
// 17b. callCreatePaymentIntent — Create a payment intent for subscription
// ---------------------------------------------------------------------------

export async function callCreatePaymentIntent(
    planId: string,
): Promise<{ paymentId: string; clientSecret: string; amount: number; status: string }> {
    return apiFetch<{ paymentId: string; clientSecret: string; amount: number; status: string }>(
        '/api/payments/create-intent',
        { method: 'POST', body: { planId } },
    );
}

// ---------------------------------------------------------------------------
// 17c. callConfirmPayment — Confirm a payment and activate subscription
// ---------------------------------------------------------------------------

export async function callConfirmPayment(
    paymentId: string,
): Promise<{ success: boolean; endDate: string; planId: string; planName: string; credits: number | null }> {
    return apiFetch<{ success: boolean; endDate: string; planId: string; planName: string; credits: number | null }>(
        '/api/payments/confirm',
        { method: 'POST', body: { paymentId } },
    );
}

// ---------------------------------------------------------------------------
// 17d. callCreatePaymentOrder — Create a Razorpay order for subscription
// ---------------------------------------------------------------------------

export async function callCreatePaymentOrder(
    planId: string,
): Promise<{ orderId: string; paymentId: string; amount: number; currency: string; key: string }> {
    return apiFetch<{ orderId: string; paymentId: string; amount: number; currency: string; key: string }>(
        '/api/payments/create-order',
        { method: 'POST', body: { planId } },
    );
}

// ---------------------------------------------------------------------------
// 17e. callVerifyPayment — Verify Razorpay signature and activate subscription
// ---------------------------------------------------------------------------

export async function callVerifyPayment(payload: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
    paymentId: string;
}): Promise<{ success: boolean; endDate: string; planId: string; planName: string; credits: number | null }> {
    return apiFetch<{ success: boolean; endDate: string; planId: string; planName: string; credits: number | null }>(
        '/api/payments/verify',
        { method: 'POST', body: payload },
    );
}

// ---------------------------------------------------------------------------
// 17f. callCancelSubscription — Cancel the current subscription
// ---------------------------------------------------------------------------

export async function callCancelSubscription(): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/subscriptions/cancel', { method: 'POST' });
}

// ---------------------------------------------------------------------------
// 17g. callGetSubscriptionPortalLink — Get Razorpay subscription management URL
// ---------------------------------------------------------------------------

export async function callGetSubscriptionPortalLink(): Promise<{ url: string; status: string }> {
    return apiFetch<{ url: string; status: string }>('/api/subscriptions/portal-link', { method: 'GET' });
}

// ---------------------------------------------------------------------------
// 17h. callGetPricing — Fetch live Razorpay pricing
// ---------------------------------------------------------------------------

export async function callGetPricing(): Promise<{
    plans: Array<{
        planId: string;
        name: string;
        price: number;
        razorpayPlanId: string | null;
        razorpayItemId: string | null;
        configured: boolean;
        category: string;
        source: 'plans' | 'items' | 'static';
    }>;
    lastSyncedAt: string | null;
    source: 'plans' | 'items' | 'static';
}> {
    // Public endpoint — no auth needed
    const baseUrl = getApiBaseUrl();
    const res = await fetch(`${baseUrl}/api/subscriptions/pricing`);
    if (!res.ok) throw new Error('Failed to fetch pricing');
    return res.json() as Promise<{
        plans: Array<{
            planId: string;
            name: string;
            price: number;
            razorpayPlanId: string | null;
            razorpayItemId: string | null;
            configured: boolean;
            category: string;
            source: 'plans' | 'items' | 'static';
        }>;
        lastSyncedAt: string | null;
        source: 'plans' | 'items' | 'static';
    }>;
}

// ---------------------------------------------------------------------------
// 18. getBookingStats — Admin dashboard aggregate
// ---------------------------------------------------------------------------

export async function getBookingStats(): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    canceledBookings: number;
    attendedBookings: number;
    noShowBookings: number;
    todayBookings: number;
}> {
    const allBookingsSnap = await getDocs(collection(db, 'bookings'));
    let totalBookings = 0;
    let confirmedBookings = 0;
    let canceledBookings = 0;
    let attendedBookings = 0;
    let noShowBookings = 0;
    let todayBookings = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const tomorrow = new Date(today);
    tomorrow.setDate(tomorrow.getDate() + 1);

    allBookingsSnap.docs.forEach((doc) => {
        const data = doc.data();
        totalBookings++;

        switch (data.status) {
            case 'confirmed':
                confirmedBookings++;
                break;
            case 'canceled':
                canceledBookings++;
                break;
            case 'attended':
                attendedBookings++;
                break;
            case 'no-show':
                noShowBookings++;
                break;
        }

        const classDate = toDate(data.classDate);
        if (classDate >= today && classDate < tomorrow) {
            todayBookings++;
        }
    });

    return {
        totalBookings,
        confirmedBookings,
        canceledBookings,
        attendedBookings,
        noShowBookings,
        todayBookings,
    };
}

// ---------------------------------------------------------------------------
// 19. createUserProfile — Create user profile doc
// ---------------------------------------------------------------------------

export async function createUserProfile(user: UserProfile): Promise<void> {
    const userRef = doc(db, 'users', user.uid);
    await setDoc(userRef, user);
}

// ---------------------------------------------------------------------------
// 20. getAllTrainers — Admin: all trainers (including inactive)
// ---------------------------------------------------------------------------

export async function getAllTrainers(): Promise<Trainer[]> {
    const snapshot = await getDocs(collection(db, 'trainers'));
    return snapshot.docs.map((doc) => {
        const data = doc.data();
        return convertTimestamps({ ...data, id: doc.id }) as unknown as Trainer;
    });
}

export async function getTrainersPage(
    options: PageOptions,
): Promise<PaginatedResult<Trainer>> {
    return getPage<Trainer>(
        'trainers',
        [orderBy('name')],
        options.pageSize,
        options.cursor,
        (snapshot) => mapDocWithId<Trainer>(snapshot),
    );
}

export async function getCollectionPage<T>(
    collectionName: string,
    options: PageOptions & {
        orderField: string;
        orderDirection?: 'asc' | 'desc';
        filters?: Array<{ field: string; op: '==' | 'in'; value: unknown }>;
    },
): Promise<PaginatedResult<T>> {
    return getPage<T>(
        collectionName,
        [
            ...(options.filters || []).map((filter) => where(filter.field, filter.op, filter.value)),
            orderBy(options.orderField, options.orderDirection || 'desc'),
        ],
        options.pageSize,
        options.cursor,
        (snapshot) => mapDocWithId<T>(snapshot),
    );
}

// ---------------------------------------------------------------------------
// 22. callCreateTrainer — API route wrapper for admin
// ---------------------------------------------------------------------------

interface CreateTrainerInput {
    name: string;
    email: string;
    phone?: string;
    bio?: string;
    certifications?: string[];
    specialties?: string[];
    profilePictureUrl?: string;
    experienceYears?: number;
    rating?: number;
}

export async function callCreateTrainer(
    trainerData: CreateTrainerInput,
): Promise<{ success: boolean; trainerId: string }> {
    return apiFetch<{ success: boolean; trainerId: string }>('/api/admin/trainers', {
        method: 'POST',
        body: trainerData,
    });
}

// ---------------------------------------------------------------------------
// 23. callUpdateTrainer — API route wrapper for admin
// ---------------------------------------------------------------------------

interface UpdateTrainerInput extends Partial<CreateTrainerInput> {
    trainerId: string;
    isActive?: boolean;
}

export async function callUpdateTrainer(
    trainerData: UpdateTrainerInput,
): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/admin/trainers', {
        method: 'PUT',
        body: trainerData,
    });
}

// ---------------------------------------------------------------------------
// 24. callDeleteTrainer — API route wrapper for admin (soft delete)
// ---------------------------------------------------------------------------

export async function callDeleteTrainer(
    trainerId: string,
): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/admin/trainers', {
        method: 'DELETE',
        body: { trainerId },
    });
}

// ---------------------------------------------------------------------------
// 25. getFacility — Get the single gym center from Firestore
// ---------------------------------------------------------------------------

export async function getFacility(): Promise<GymCenter | null> {
    const snapshot = await getDocs(collection(db, 'gymCenters'));
    if (snapshot.empty) return null;
    const doc = snapshot.docs[0];
    return convertTimestamps({ ...doc.data(), id: doc.id }) as unknown as GymCenter;
}

// ---------------------------------------------------------------------------
// 26. callUpdateFacility — API route wrapper for admin
// ---------------------------------------------------------------------------

interface UpdateFacilityInput {
    facilityId: string;
    name?: string;
    address?: GymCenter['address'];
    coordinates?: GymCenter['coordinates'];
    contactInfo?: GymCenter['contactInfo'];
    operatingHours?: GymCenter['operatingHours'];
    facilities?: string;
    photos?: string[];
    isActive?: boolean;
}

export async function callUpdateFacility(
    facilityData: UpdateFacilityInput,
): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/admin/facility', {
        method: 'PUT',
        body: facilityData,
    });
}

// ---------------------------------------------------------------------------
// 27. Real-time listeners for admin pages
// ---------------------------------------------------------------------------

export function subscribeToAllClasses(
    callback: (classes: ClassSession[]) => void,
): Unsubscribe {
    const q = query(
        collection(db, 'classes'),
        orderBy('date', 'desc'),
    );
    return onSnapshot(q, (snapshot) => {
        const classes = snapshot.docs.map((d) => {
            const data = d.data();
            return convertTimestamps({ ...data, id: d.id }) as unknown as ClassSession;
        });
        callback(classes);
    });
}

export function subscribeToAllBookings(
    callback: (bookings: Booking[]) => void,
): Unsubscribe {
    const q = query(
        collection(db, 'bookings'),
        orderBy('classDate', 'desc'),
    );
    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map((d) => {
            const data = d.data();
            return convertTimestamps({ ...data, id: d.id }) as unknown as Booking;
        });
        callback(bookings);
    });
}

export function subscribeToTrainers(
    callback: (trainers: Trainer[]) => void,
    activeOnly = false,
): Unsubscribe {
    const q = activeOnly
        ? query(collection(db, 'trainers'), where('isActive', '==', true))
        : query(collection(db, 'trainers'));
    return onSnapshot(q, (snapshot) => {
        const trainers = snapshot.docs.map((d) => {
            const data = d.data();
            return convertTimestamps({ ...data, id: d.id }) as unknown as Trainer;
        });
        callback(trainers);
    });
}

// ---------------------------------------------------------------------------
// 28. Report stats — computed from Firestore data
// ---------------------------------------------------------------------------

export interface MembershipDistribution {
    name: string;
    value: number;
    color: string;
}

export async function getMembershipDistribution(): Promise<MembershipDistribution[]> {
    const snapshot = await getDocs(collection(db, 'users'));
    const planCounts: Record<string, number> = {};

    snapshot.docs.forEach((d) => {
        const data = d.data();
        const planId = data.subscription?.planId || data.subscription?.planType || null;
        if (planId) {
            planCounts[planId] = (planCounts[planId] || 0) + 1;
        }
    });

    const colors: Record<string, string> = {
        unlimited: '#8B3F2C',
        twice_weekly: '#6B7752',
        once_weekly: '#D4B494',
        drop_in: '#9B7653',
        five_pack: '#556B2F',
        ten_pack: '#8B6914',
    };

    return Object.entries(planCounts).map(([name, value]) => ({
        name: name.replace(/_/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase()),
        value,
        color: colors[name] || '#888888',
    }));
}

export interface ClassPopularityItem {
    name: string;
    bookings: number;
}

export async function getClassPopularity(): Promise<ClassPopularityItem[]> {
    const snapshot = await getDocs(collection(db, 'classes'));
    const typeMap: Record<string, number> = {};

    snapshot.docs.forEach((d) => {
        const data = d.data();
        const classType = (data.classType as string) || 'Unknown';
        const booked = (data.bookedCount as number) || 0;
        typeMap[classType] = (typeMap[classType] || 0) + booked;
    });

    return Object.entries(typeMap)
        .map(([name, bookings]) => ({ name, bookings }))
        .sort((a, b) => b.bookings - a.bookings)
        .slice(0, 8);
}

export interface LocationUtilization {
    name: string;
    bookings: number;
    utilization: number;
}

export async function getLocationUtilization(): Promise<LocationUtilization[]> {
    const snapshot = await getDocs(collection(db, 'classes'));
    const locationMap: Record<string, { booked: number; capacity: number }> = {};

    snapshot.docs.forEach((d) => {
        const data = d.data();
        const location = (data.location as string) || 'Main Studio';
        const booked = (data.bookedCount as number) || 0;
        const capacity = (data.totalSpots as number) || (data.capacity as number) || 12;

        if (!locationMap[location]) {
            locationMap[location] = { booked: 0, capacity: 0 };
        }
        locationMap[location].booked += booked;
        locationMap[location].capacity += capacity;
    });

    return Object.entries(locationMap)
        .map(([name, stats]) => ({
            name,
            bookings: stats.booked,
            utilization: stats.capacity > 0 ? Math.round((stats.booked / stats.capacity) * 100) : 0,
        }))
        .sort((a, b) => b.bookings - a.bookings);
}

export interface AttendanceStats {
    totalAttended: number;
    totalClasses: number;
    avgAttendanceRate: number;
    thisMonthClasses: number;
    activeMembers: number;
}

export async function getAttendanceStats(): Promise<AttendanceStats> {
    const [bookingsSnap, classesSnap, usersSnap] = await Promise.all([
        getDocs(collection(db, 'bookings')),
        getDocs(collection(db, 'classes')),
        getDocs(collection(db, 'users')),
    ]);

    const totalAttended = bookingsSnap.docs.filter(
        (d) => d.data().status === 'attended',
    ).length;

    const totalClasses = classesSnap.size;

    const totalCapacity = classesSnap.docs.reduce(
        (sum, d) => sum + ((d.data().totalSpots as number) || (d.data().capacity as number) || 0),
        0,
    );

    const totalBooked = classesSnap.docs.reduce(
        (sum, d) => sum + ((d.data().bookedCount as number) || 0),
        0,
    );

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const thisMonthClasses = classesSnap.docs.filter((d) => {
        const dateVal = d.data().date;
        const date = toDate(dateVal);
        return date >= startOfMonth && date <= now;
    }).length;

    const activeMembers = usersSnap.docs.filter(
        (d) => d.data().subscription?.status === 'active',
    ).length;

    return {
        totalAttended,
        totalClasses,
        avgAttendanceRate: totalCapacity > 0 ? Math.round((totalBooked / totalCapacity) * 100) : 0,
        thisMonthClasses,
        activeMembers,
    };
}

// ---------------------------------------------------------------------------
// 29. callUpdateUserProfile — Admin: update member profile
// ---------------------------------------------------------------------------

export async function callUpdateUserProfile(
    uid: string,
    updates: Partial<Pick<UserProfile, 'name' | 'age' | 'fitnessGoals'>>,
): Promise<void> {
    const userRef = doc(db, 'users', uid);
    await setDoc(userRef, { ...updates, updatedAt: new Date() }, { merge: true });
}

// ---------------------------------------------------------------------------
// 29b. subscribeToCheckinClasses — Today's active classes for the check-in panel
//      Includes 'scheduled' AND 'ongoing' (unlike subscribeToClassesByDate which
//      only returns 'scheduled'). Filters out 'canceled' and 'completed' client-side
//      to avoid needing an extra composite index on status + date.
// ---------------------------------------------------------------------------

export function subscribeToCheckinClasses(
    date: Date,
    callback: (classes: ClassSession[]) => void,
): Unsubscribe {
    const start = new Date(date);
    start.setHours(0, 0, 0, 0);
    const end = new Date(date);
    end.setHours(23, 59, 59, 999);

    const q = query(
        collection(db, 'classes'),
        where('date', '>=', Timestamp.fromDate(start)),
        where('date', '<=', Timestamp.fromDate(end)),
        orderBy('date'),
        orderBy('startTime'),
    );

    return onSnapshot(q, (snapshot) => {
        const classes = snapshot.docs
            .map((d) => {
                const data = d.data();
                return convertTimestamps({ ...data, id: d.id }) as unknown as ClassSession;
            })
            .filter((cls) => cls.status !== 'canceled' && cls.status !== 'completed');
        callback(classes);
    });
}

// ---------------------------------------------------------------------------
// 30. subscribeToBookingsByClass — Real-time attendee list for a class (admin check-in)
// ---------------------------------------------------------------------------

export function subscribeToBookingsByClass(
    classId: string,
    callback: (bookings: Booking[]) => void,
): Unsubscribe {
    const q = query(
        collection(db, 'bookings'),
        where('classId', '==', classId),
    );
    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map((d) => {
            const data = d.data();
            return convertTimestamps({ ...data, id: d.id }) as unknown as Booking;
        });
        callback(bookings);
    });
}

// ---------------------------------------------------------------------------
// 31. callCheckInBooking — Mark a booking as attended or no-show.
// Members may mark their own booking attended during the check-in window;
// admins may mark attended/no-show.
// ---------------------------------------------------------------------------

export async function callCheckInBooking(
    bookingId: string,
    action: 'attended' | 'no-show',
): Promise<{ success: boolean }> {
    return apiFetch<{ success: boolean }>('/api/bookings/checkin', {
        method: 'POST',
        body: { bookingId, action },
    });
}

// ---------------------------------------------------------------------------
// Re-export SpotSelection for convenience
// ---------------------------------------------------------------------------

export type { SpotSelection };
