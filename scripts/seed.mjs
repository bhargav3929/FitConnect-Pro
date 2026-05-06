#!/usr/bin/env node
// Usage:
//   node scripts/seed.mjs            # dry-run, prints what would be written
//   node scripts/seed.mjs --execute  # actually writes to Firebase
//
// Seeds: 1 admin + 4 members (Auth + Firestore), gymCenters/main, 4 trainers,
// ~10 classes covering empty / partial / full / past / horizon-edge cases.
// Idempotent: re-running updates existing docs in place (upserts by email / slug).

import { readFileSync } from 'node:fs';
import { resolve, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';
import { getFirestore, FieldValue, Timestamp } from 'firebase-admin/firestore';

const __dirname = dirname(fileURLToPath(import.meta.url));

// -------------------- env --------------------
function loadEnv() {
    const envPath = resolve(__dirname, '..', '.env.local');
    const raw = readFileSync(envPath, 'utf8');
    for (const line of raw.split('\n')) {
        const t = line.trim();
        if (!t || t.startsWith('#')) continue;
        const eq = t.indexOf('=');
        if (eq === -1) continue;
        const k = t.slice(0, eq).trim();
        let v = t.slice(eq + 1).trim();
        if ((v.startsWith("'") && v.endsWith("'")) || (v.startsWith('"') && v.endsWith('"'))) {
            v = v.slice(1, -1);
        }
        if (!(k in process.env)) process.env[k] = v;
    }
}
loadEnv();

const execute = process.argv.includes('--execute');

const sa = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);
sa.private_key = sa.private_key.replace(/\\n/g, '\n');
if (!getApps().length) initializeApp({ credential: cert(sa) });
const auth = getAuth();
const db = getFirestore();

console.log(`\n  Mode: ${execute ? 'EXECUTE (writes to Firebase)' : 'DRY-RUN'}\n`);

// -------------------- helpers --------------------
const now = new Date();
const days = (n) => {
    const d = new Date(now);
    d.setDate(d.getDate() + n);
    return d;
};
const atTime = (d, hhmm) => {
    const [h, m] = hhmm.split(':').map(Number);
    const out = new Date(d);
    out.setHours(h, m, 0, 0);
    return out;
};
const dayAtMidnight = (d) => {
    const out = new Date(d);
    out.setHours(0, 0, 0, 0);
    return out;
};

async function ensureAuthUser({ email, password, displayName }) {
    try {
        const u = await auth.getUserByEmail(email);
        console.log(`  [auth]   reuse ${email} uid=${u.uid}`);
        return u.uid;
    } catch (e) {
        if (e.code !== 'auth/user-not-found') throw e;
    }
    if (!execute) {
        console.log(`  [auth]   would CREATE ${email}`);
        return `DRY_${email.replace(/[^a-z0-9]/gi, '_')}`;
    }
    const u = await auth.createUser({ email, password, displayName, emailVerified: true });
    console.log(`  [auth]   created ${email} uid=${u.uid}`);
    return u.uid;
}

async function writeDoc(path, data, { merge = true } = {}) {
    if (!execute) {
        console.log(`  [fs]     would WRITE ${path}`);
        return;
    }
    await db.doc(path).set(data, { merge });
    console.log(`  [fs]     wrote ${path}`);
}

// -------------------- plan presets (from shared/src/types/subscription.ts) --------------------
const PLAN_PRESETS = {
    unlimited:    { category: 'membership', credits: null, durationDays: 28, maxClassesPerDay: 5, advanceBookingDays: 14, guestPasses: 0 },
    once_weekly:  { category: 'membership', credits: 4,    durationDays: 28, maxClassesPerDay: 1, advanceBookingDays: 14, guestPasses: 0 },
    five_pack:    { category: 'class_pack', credits: 5,    durationDays: 180, maxClassesPerDay: 1, advanceBookingDays: 7,  guestPasses: 1 },
};

function subscriptionFor(planId, { active = true, overrides = {} } = {}) {
    const p = PLAN_PRESETS[planId];
    if (!p) {
        return {
            planId: null, planCategory: null,
            startDate: null, endDate: null, status: 'canceled',
            classesRemaining: 0, maxClassesPerDay: 1, advanceBookingDays: 7, guestPassesRemaining: 0,
            lastPaymentId: null, stripeCustomerId: null, stripeSubscriptionId: null,
            ...overrides,
        };
    }
    const start = active ? now : days(-60);
    const end = active ? days(p.durationDays) : days(-1);
    return {
        planId,
        planCategory: p.category,
        startDate: start,
        endDate: end,
        status: active ? 'active' : 'expired',
        classesRemaining: p.credits,
        maxClassesPerDay: p.maxClassesPerDay,
        advanceBookingDays: p.advanceBookingDays,
        guestPassesRemaining: p.guestPasses,
        lastPaymentId: null,
        stripeCustomerId: null,
        stripeSubscriptionId: null,
        ...overrides,
    };
}

// -------------------- 1. Users --------------------
console.log('─── 1. Users ───');

const MEMBERS = [
    {
        email: 'alice@test.com', password: 'Alice123!', name: 'Alice Rivera', age: 32,
        fitnessGoals: ['strength', 'flexibility'],
        subscription: subscriptionFor('thrice_6mo'),
        stats: { totalClassesAttended: 7, currentStreak: 3, longestStreak: 5 },
    },
    {
        email: 'bob@test.com', password: 'Bob123!', name: 'Bob Chen', age: 41,
        fitnessGoals: ['endurance'],
        subscription: subscriptionFor('twice_quarterly', { overrides: { classesRemaining: 1 } }),
        stats: { totalClassesAttended: 2, currentStreak: 1, longestStreak: 2 },
    },
    {
        email: 'carol@test.com', password: 'Carol123!', name: 'Carol Singh', age: 28,
        fitnessGoals: ['weight_loss'],
        subscription: subscriptionFor(null),
        stats: { totalClassesAttended: 0, currentStreak: 0, longestStreak: 0 },
    },
    {
        email: 'dave@test.com', password: 'Dave123!', name: 'Dave Park', age: 37,
        fitnessGoals: ['recovery'],
        subscription: subscriptionFor('kickstarter', { active: false, overrides: { classesRemaining: 0 } }),
        stats: { totalClassesAttended: 5, currentStreak: 0, longestStreak: 4 },
    },
];

const uidByEmail = {};
for (const m of MEMBERS) {
    const uid = await ensureAuthUser({ email: m.email, password: m.password, displayName: m.name });
    uidByEmail[m.email] = uid;

    // Custom claim for admin
    if (m.admin && execute) {
        await auth.setCustomUserClaims(uid, { admin: true });
        console.log(`  [auth]   set admin claim on ${m.email}`);
    } else if (m.admin) {
        console.log(`  [auth]   would SET admin claim on ${m.email}`);
    }

    await writeDoc(`users/${uid}`, {
        uid,
        email: m.email,
        name: m.name,
        age: m.age,
        fitnessGoals: m.fitnessGoals,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
        subscription: m.subscription,
        stats: m.stats,
    });

    if (m.admin) {
        await writeDoc(`admins/${uid}`, {
            uid, email: m.email, name: m.name, role: 'super_admin',
            grantedAt: FieldValue.serverTimestamp(), grantedBy: uid,
        });
    }
}

// -------------------- 2. gymCenters/main --------------------
console.log('\n─── 2. Facility ───');

await writeDoc('gymCenters/main', {
    id: 'main',
    name: 'Sol Pilates Studio',
    address: { street: '250 West 54th', city: 'New York', state: 'NY', zip: '10019', country: 'USA' },
    coordinates: { lat: 40.7649, lng: -73.9827 },
    contactInfo: { phone: '+1 (212) 555-0180', email: 'hello@solpilates.test' },
    operatingHours: {
        monday:    { open: '06:00', close: '21:00' },
        tuesday:   { open: '06:00', close: '21:00' },
        wednesday: { open: '06:00', close: '21:00' },
        thursday:  { open: '06:00', close: '21:00' },
        friday:    { open: '06:00', close: '20:00' },
        saturday:  { open: '08:00', close: '18:00' },
        sunday:    { open: '08:00', close: '18:00' },
    },
    facilities: 'Reformers, Tower, Cadillac, Chair, Locker rooms, Showers, Filtered water, Herbal tea bar',
    photos: [],
    isActive: true,
    createdAt: FieldValue.serverTimestamp(),
    updatedAt: FieldValue.serverTimestamp(),
});

// -------------------- 3. Trainers --------------------
console.log('\n─── 3. Trainers ───');

const TRAINERS = [
    { slug: 'maya-chen',     name: 'Maya Chen',       email: 'maya@solpilates.test',   phone: '+1 212 555 0101',
      bio: 'Classical Pilates lineage, 8 years teaching reformer.',
      certifications: ['Power Pilates Comprehensive', 'BASI'], specialties: ['Reformer', 'Pre/Postnatal'],
      experienceYears: 8, rating: 4.9, isActive: true },
    { slug: 'julien-okafor', name: 'Julien Okafor',   email: 'julien@solpilates.test', phone: '+1 212 555 0102',
      bio: 'Former dancer. High-energy jumpboard and tower classes.',
      certifications: ['STOTT Pilates'], specialties: ['Jumpboard', 'Tower', 'Cardio'],
      experienceYears: 6, rating: 4.8, isActive: true },
    { slug: 'priya-kapoor',  name: 'Priya Kapoor',    email: 'priya@solpilates.test',  phone: '+1 212 555 0103',
      bio: 'Rehab-focused instructor, works with post-surgery clients.',
      certifications: ['Polestar Pilates', 'Rehab Cert'], specialties: ['Rehab', 'Mat', 'Restorative'],
      experienceYears: 11, rating: 5.0, isActive: true },
    { slug: 'noah-west',     name: 'Noah West',       email: 'noah@solpilates.test',   phone: '+1 212 555 0104',
      bio: 'On sabbatical — inactive in the schedule.',
      certifications: ['BASI'], specialties: ['Reformer'],
      experienceYears: 3, rating: 4.5, isActive: false },
];

const trainerIdBySlug = {};
for (const t of TRAINERS) {
    const id = t.slug;
    trainerIdBySlug[t.slug] = id;
    await writeDoc(`trainers/${id}`, {
        id,
        name: t.name,
        email: t.email,
        phone: t.phone,
        bio: t.bio,
        certifications: t.certifications,
        specialties: t.specialties,
        profilePictureUrl: '',
        experienceYears: t.experienceYears,
        rating: t.rating,
        isActive: t.isActive,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
}

// -------------------- 3.5 Class Types --------------------
console.log('\n─── 3.5 Class Types ───');

const CLASS_TYPES = [
    {
        id: 'sol-flow',
        name: 'Sol Flow',
        description: 'Strength meets movement in this smooth, continuous reformer class. No breaks, just flow.',
        defaultIntensity: 2,
        defaultDuration: 50,
        equipment: 'Reformer',
        isActive: true,
    },
    {
        id: 'sol-cardio',
        name: 'Sol Cardio',
        description: 'Fast-paced movement that gets your heart rate up.',
        defaultIntensity: 3,
        defaultDuration: 45,
        equipment: 'Reformer + Jumpboard',
        isActive: false, // not currently scheduled
    },
    {
        id: 'sol-stretch',
        name: 'Sol Stretch',
        description: 'Hit reset on your body, one stretch at a time.',
        defaultIntensity: 1,
        defaultDuration: 50,
        equipment: 'Mat + Reformer',
        isActive: false, // not currently scheduled
    },
];

for (const ct of CLASS_TYPES) {
    await writeDoc(`classTypes/${ct.id}`, {
        ...ct,
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
}

// -------------------- 4. Classes --------------------
console.log('\n─── 4. Classes ───');

const CLASSES = [
    // #1 Today empty
    { slug: 'cls-today-0600',    dayOffset: 0,   startTime: '06:00', trainer: 'maya-chen',     totalSpots: 10, bookedSpots: [],                              status: 'scheduled', classType: 'Sol Flow',      intensityLevel: 2, location: 'Performance Floor' },
    // #2 Today partial
    { slug: 'cls-today-0900',    dayOffset: 0,   startTime: '09:00', trainer: 'julien-okafor', totalSpots: 10, bookedSpots: [1, 3, 5],                        status: 'scheduled', classType: 'Sol Cardio',   intensityLevel: 3, location: 'Performance Floor' },
    // #3 Today FULL
    { slug: 'cls-today-1730',    dayOffset: 0,   startTime: '17:30', trainer: 'priya-kapoor',  totalSpots: 10, bookedSpots: [1,2,3,4,5,6,7,8,9,10],           status: 'scheduled', classType: 'Sol Stretch',  intensityLevel: 1, location: 'Yoga Studio' },
    // #4 Today amber (50%)
    { slug: 'cls-today-1900',    dayOffset: 0,   startTime: '19:00', trainer: 'maya-chen',     totalSpots: 10, bookedSpots: [2,4,6,8,10],                  status: 'scheduled', classType: 'Sol Flow',  intensityLevel: 2, location: 'Performance Floor' },
    // #5 Tomorrow
    { slug: 'cls-tmrw-0700',     dayOffset: 1,   startTime: '07:00', trainer: 'julien-okafor', totalSpots: 10, bookedSpots: [],                              status: 'scheduled', classType: 'Sol Stretch',           intensityLevel: 2, location: 'Yoga Studio' },
    // #6 +3 days
    { slug: 'cls-plus3-0800',    dayOffset: 3,   startTime: '08:00', trainer: 'priya-kapoor',  totalSpots: 10, bookedSpots: [],                              status: 'scheduled', classType: 'Sol Stretch',     intensityLevel: 1, location: 'Rehab Room' },
    // #7 +14 days — exactly at Alice's advance-booking horizon
    { slug: 'cls-plus14-1000',   dayOffset: 14,  startTime: '10:00', trainer: 'maya-chen',     totalSpots: 10, bookedSpots: [],                              status: 'scheduled', classType: 'Sol Flow',      intensityLevel: 2, location: 'Performance Floor' },
    // #8 +15 days — one past Alice's horizon
    { slug: 'cls-plus15-1000',   dayOffset: 15,  startTime: '10:00', trainer: 'maya-chen',     totalSpots: 10, bookedSpots: [],                              status: 'scheduled', classType: 'Sol Flow',      intensityLevel: 2, location: 'Performance Floor' },
    // #9 Yesterday completed
    { slug: 'cls-yday-1000',     dayOffset: -1,  startTime: '10:00', trainer: 'maya-chen',     totalSpots: 10, bookedSpots: [1, 2, 3],                        status: 'completed', classType: 'Sol Flow',      intensityLevel: 2, location: 'Performance Floor' },
    // #10 Today canceled
    { slug: 'cls-today-1400',    dayOffset: 0,   startTime: '14:00', trainer: 'julien-okafor', totalSpots: 10, bookedSpots: [],                              status: 'canceled',  classType: 'Sol Cardio',   intensityLevel: 3, location: 'Performance Floor', canceledAt: now, cancelReason: 'Instructor illness' },
    // #11 3 days ago completed (Alice attended)
    { slug: 'cls-past3-0900',    dayOffset: -3,  startTime: '09:00', trainer: 'julien-okafor', totalSpots: 10, bookedSpots: [1],                             status: 'completed', classType: 'Sol Cardio',   intensityLevel: 3, location: 'Performance Floor' },
    // #12 7 days ago completed (Alice attended)
    { slug: 'cls-past7-0730',    dayOffset: -7,  startTime: '07:30', trainer: 'priya-kapoor',  totalSpots: 10, bookedSpots: [4],                             status: 'completed', classType: 'Sol Stretch',     intensityLevel: 1, location: 'Rehab Room' },
    // #13 10 days ago completed (Alice no-show)
    { slug: 'cls-past10-1800',   dayOffset: -10, startTime: '18:00', trainer: 'maya-chen',     totalSpots: 10, bookedSpots: [2],                             status: 'completed', classType: 'Sol Flow',  intensityLevel: 2, location: 'Performance Floor' },
    // #14 5 days ago scheduled (Alice canceled her booking)
    { slug: 'cls-past5-1100',    dayOffset: -5,  startTime: '11:00', trainer: 'julien-okafor', totalSpots: 10, bookedSpots: [],                              status: 'completed', classType: 'Sol Stretch',           intensityLevel: 2, location: 'Yoga Studio' },
];

for (const c of CLASSES) {
    const classDay = dayAtMidnight(days(c.dayOffset));
    const bookedCount = c.bookedSpots.length;
    await writeDoc(`classes/${c.slug}`, {
        id: c.slug,
        trainerId: trainerIdBySlug[c.trainer],
        date: classDay,
        startTime: c.startTime,
        duration: 50,
        capacity: c.totalSpots,
        bookedCount,
        classType: c.classType,
        difficultyLevel: 'intermediate',
        equipmentNeeded: 'Reformer',
        description: `Seeded test class — ${c.classType}`,
        status: c.status,
        totalSpots: c.totalSpots,
        bookedSpots: c.bookedSpots,
        instructorImage: '',
        location: c.location,
        intensityLevel: c.intensityLevel,
        ...(c.canceledAt ? { canceledAt: c.canceledAt, cancelReason: c.cancelReason } : {}),
        createdAt: FieldValue.serverTimestamp(),
        updatedAt: FieldValue.serverTimestamp(),
    });
}

// -------------------- 4.5 Sol weekly schedule (next 14 days) --------------------
console.log('\n─── 4.5 Sol Weekly Schedule ───');

const SCHEDULE_TIMES = ['08:00', '09:00', '10:00', '17:00', '18:00', '19:00'];
const ACTIVE_TRAINERS = TRAINERS.filter((t) => t.isActive).map((t) => t.slug);

// Skip slots that collide with existing edge-case classes (same date + startTime)
const existingSlots = new Set(
    CLASSES.map((c) => `${c.dayOffset}@${c.startTime}`)
);

let scheduleCount = 0;
for (let offset = 0; offset < 14; offset++) {
    for (let i = 0; i < SCHEDULE_TIMES.length; i++) {
        const startTime = SCHEDULE_TIMES[i];
        if (existingSlots.has(`${offset}@${startTime}`)) continue;

        const trainerSlug = ACTIVE_TRAINERS[(offset + i) % ACTIVE_TRAINERS.length];
        const slug = `cls-sched-d${offset}-${startTime.replace(':', '')}`;
        const classDay = dayAtMidnight(days(offset));

        await writeDoc(`classes/${slug}`, {
            id: slug,
            trainerId: trainerIdBySlug[trainerSlug],
            date: classDay,
            startTime,
            duration: 50,
            capacity: 10,
            bookedCount: 0,
            classType: 'Sol Flow',
            difficultyLevel: 'intermediate',
            equipmentNeeded: 'Reformer',
            description: 'Sol Flow — strength meets movement, smooth and continuous.',
            status: 'scheduled',
            totalSpots: 10,
            bookedSpots: [],
            instructorImage: '',
            location: 'Performance Floor',
            intensityLevel: 2,
            createdAt: FieldValue.serverTimestamp(),
            updatedAt: FieldValue.serverTimestamp(),
        });
        scheduleCount++;
    }
}
console.log(`  Generated ${scheduleCount} Sol Flow sessions across 14 days × 6 time slots.`);

// -------------------- 5. Past bookings (Alice) --------------------
console.log('\n─── 5. Past bookings (Alice) ───');

const aliceUid = uidByEmail['alice@test.com'];

const ALICE_PAST_BOOKINGS = [
    // Attended yesterday — Reformer Flow with Maya
    { id: 'bk-alice-yday',   classSlug: 'cls-yday-1000',   spotNumber: 2,  status: 'attended', dayOffset: -1 },
    // Attended 3 days ago — Jumpboard Cardio with Julien
    { id: 'bk-alice-past3',  classSlug: 'cls-past3-0900',  spotNumber: 1,  status: 'attended', dayOffset: -3 },
    // Attended 7 days ago — Rehab Reformer with Priya
    { id: 'bk-alice-past7',  classSlug: 'cls-past7-0730',  spotNumber: 4,  status: 'attended', dayOffset: -7 },
    // No-show 10 days ago — Reformer Strength with Maya
    { id: 'bk-alice-past10', classSlug: 'cls-past10-1800', spotNumber: 2,  status: 'no-show', dayOffset: -10 },
    // Canceled 5 days ago — Mat Flow with Julien
    { id: 'bk-alice-past5',  classSlug: 'cls-past5-1100',  spotNumber: 7,  status: 'canceled', dayOffset: -5 },
];

const classBySlug = Object.fromEntries(CLASSES.map((c) => [c.slug, c]));

for (const b of ALICE_PAST_BOOKINGS) {
    const cls = classBySlug[b.classSlug];
    if (!cls) {
        console.log(`  [skip]   no class ${b.classSlug} for ${b.id}`);
        continue;
    }
    const classDay = dayAtMidnight(days(b.dayOffset));
    const bookingCreatedAt = days(b.dayOffset - 2); // booked 2 days before the class
    await writeDoc(`bookings/${b.id}`, {
        id: b.id,
        userId: aliceUid,
        classId: b.classSlug,
        trainerId: trainerIdBySlug[cls.trainer],
        classDate: classDay,
        bookingDate: bookingCreatedAt,
        spotNumber: b.spotNumber,
        isGuest: false,
        status: b.status,
        creditType: 'unlimited',
        planIdAtBooking: 'thrice_6mo',
        usedGuestPass: false,
        ...(b.status === 'attended' ? { attendedAt: atTime(days(b.dayOffset), cls.startTime) } : {}),
        ...(b.status === 'canceled'
            ? { canceledAt: days(b.dayOffset - 1), cancelReason: 'Plans changed' }
            : {}),
        createdAt: bookingCreatedAt,
        updatedAt: bookingCreatedAt,
    });
}

// -------------------- 6. Upcoming bookings (Alice) --------------------
console.log('\n─── 6. Upcoming bookings (Alice) ───');

const ALICE_UPCOMING_BOOKINGS = [];

for (const b of ALICE_UPCOMING_BOOKINGS) {
    const cls = classBySlug[b.classSlug];
    if (!cls) {
        console.log(`  [skip]   no class ${b.classSlug} for ${b.id}`);
        continue;
    }
    const classDay = dayAtMidnight(days(b.dayOffset));
    const bookingCreatedAt = days(Math.min(0, b.dayOffset - 1));
    await writeDoc(`bookings/${b.id}`, {
        id: b.id,
        userId: aliceUid,
        classId: b.classSlug,
        trainerId: trainerIdBySlug[cls.trainer],
        classDate: classDay,
        bookingDate: bookingCreatedAt,
        spotNumber: b.spotNumber,
        isGuest: false,
        status: 'confirmed',
        creditType: 'unlimited',
        planIdAtBooking: 'thrice_6mo',
        usedGuestPass: false,
        createdAt: bookingCreatedAt,
        updatedAt: bookingCreatedAt,
    });

    // Ensure the class's bookedSpots includes this spot so capacity stays consistent
    if (!cls.bookedSpots.includes(b.spotNumber)) {
        cls.bookedSpots.push(b.spotNumber);
        await writeDoc(`classes/${cls.slug}`, {
            bookedSpots: cls.bookedSpots,
            bookedCount: cls.bookedSpots.length,
            updatedAt: FieldValue.serverTimestamp(),
        }, { merge: true });
    }
}

// -------------------- summary --------------------
console.log('\n─── Summary ───');
console.log(`  users    : ${MEMBERS.length}`);
console.log(`  admins   : ${MEMBERS.filter(m => m.admin).length}`);
console.log(`  trainers : ${TRAINERS.length} (${TRAINERS.filter(t => t.isActive).length} active)`);
console.log(`  classes  : ${CLASSES.length} edge-case + ${scheduleCount} scheduled = ${CLASSES.length + scheduleCount}`);
console.log(`  classTypes: ${CLASS_TYPES.length}`);
console.log(`  bookings : ${ALICE_PAST_BOOKINGS.length} past + ${ALICE_UPCOMING_BOOKINGS.length} upcoming (Alice)`);
console.log(`  facility : gymCenters/main`);

if (!execute) {
    console.log('\n  Dry-run complete. Re-run with --execute to actually write.\n');
    console.log('  node scripts/seed.mjs --execute\n');
} else {
    console.log('\n  Seed complete.\n');
}
