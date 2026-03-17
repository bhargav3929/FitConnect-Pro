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
    Timestamp,
    type Unsubscribe,
} from 'firebase/firestore';
import { db, auth } from './config';
import { UserProfile } from '@/types/user';
import { ClassSession, SpotSelection } from '@/types/class';
import { Booking } from '@/types/booking';
import { Trainer } from '@/types/trainer';

// ---------------------------------------------------------------------------
// API call helper — gets ID token and calls our Next.js API routes
// ---------------------------------------------------------------------------

async function apiFetch<T>(
    url: string,
    options: { method?: string; body?: unknown } = {},
): Promise<T> {
    const user = auth.currentUser;
    if (!user) throw new Error('Not authenticated');
    const token = await user.getIdToken();

    const res = await fetch(url, {
        method: options.method || 'GET',
        headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${token}`,
        },
        ...(options.body !== undefined ? { body: JSON.stringify(options.body) } : {}),
    });

    const data = await res.json();
    if (!res.ok) {
        throw new Error(data.error || 'API request failed');
    }
    return data as T;
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDate(val: unknown): Date {
    if (val instanceof Timestamp) return val.toDate();
    if (val instanceof Date) return val;
    if (typeof val === 'string' || typeof val === 'number') return new Date(val);
    return new Date();
}

function convertTimestamps<T extends Record<string, unknown>>(data: T): T {
    const result = { ...data };
    for (const key of Object.keys(result)) {
        const val = result[key];
        if (val instanceof Timestamp) {
            (result as Record<string, unknown>)[key] = val.toDate();
        }
    }
    return result;
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
        where('date', '>=', Timestamp.fromDate(start)),
        where('date', '<=', Timestamp.fromDate(end)),
        where('status', '==', 'scheduled'),
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
    return onSnapshot(q, (snapshot) => {
        const bookings = snapshot.docs.map((doc) => {
            const data = doc.data();
            return convertTimestamps({ ...data, id: doc.id }) as unknown as Booking;
        });
        callback(bookings);
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

// ---------------------------------------------------------------------------
// 11. callBookClass — API route wrapper
// ---------------------------------------------------------------------------

export async function callBookClass(
    classId: string,
    spotNumber: number,
    isGuest: boolean,
): Promise<{ success: boolean; bookingId: string }> {
    return apiFetch<{ success: boolean; bookingId: string }>('/api/bookings/book', {
        method: 'POST',
        body: { classId, spotNumber, isGuest },
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
// 17. callActivateSubscription — API route wrapper
// ---------------------------------------------------------------------------

export async function callActivateSubscription(
    planType: 'weekly' | 'monthly' | 'quarterly',
): Promise<{ success: boolean; endDate: string }> {
    return apiFetch<{ success: boolean; endDate: string }>('/api/subscriptions/activate', {
        method: 'POST',
        body: { planType },
    });
}

// ---------------------------------------------------------------------------
// 18. getBookingStats — Admin dashboard aggregate
// ---------------------------------------------------------------------------

export async function getBookingStats(): Promise<{
    totalBookings: number;
    confirmedBookings: number;
    canceledBookings: number;
    attendedBookings: number;
    todayBookings: number;
}> {
    const allBookingsSnap = await getDocs(collection(db, 'bookings'));
    let totalBookings = 0;
    let confirmedBookings = 0;
    let canceledBookings = 0;
    let attendedBookings = 0;
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
// 20. callSeedDatabase — Admin-only seed function
// ---------------------------------------------------------------------------

export async function callSeedDatabase(): Promise<{
    success: boolean;
    seeded: { trainers: number; classes: number; subscriptionPlans: number; gymCenters: number };
}> {
    return apiFetch<{
        success: boolean;
        seeded: { trainers: number; classes: number; subscriptionPlans: number; gymCenters: number };
    }>('/api/admin/seed', {
        method: 'POST',
        body: {},
    });
}

// ---------------------------------------------------------------------------
// Re-export SpotSelection for convenience
// ---------------------------------------------------------------------------

export type { SpotSelection };
