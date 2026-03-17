import * as functions from 'firebase-functions';
import { db } from '../init';
import { FieldValue, Timestamp } from 'firebase-admin/firestore';

// ---------------------------------------------------------------------------
// Trainer seed data (matches mentors-desktop.tsx exactly)
// ---------------------------------------------------------------------------

const TRAINERS = [
    {
        id: 'trainer-marcus',
        name: 'Marcus Cole',
        email: 'marcus@solpilates.com',
        phone: '+1 (212) 555-0101',
        bio: 'Specialising in Footwork, Long Stretch, and Elephant sequences. 10+ years of reformer experience guiding you through controlled, intentional movements that build lasting strength from the inside out.',
        certifications: ['PMA-CPT', 'BASI Pilates', 'Balanced Body Reformer'],
        specialties: ['Reformer Pilates', 'Strength Training', 'Core Stability'],
        profilePictureUrl: 'https://images.unsplash.com/photo-1594381898411-846e7d193883?q=80&w=600&auto=format&fit=crop',
        experienceYears: 10,
        rating: 4.9,
        isActive: true,
    },
    {
        id: 'trainer-elena',
        name: 'Elena Fox',
        email: 'elena@solpilates.com',
        phone: '+1 (212) 555-0102',
        bio: 'Master of The Hundred, Roll-Up, and Teaser progressions. Classical mat Pilates instructor known for transformative sessions that reshape your entire body through precision and breath.',
        certifications: ['PMA-CPT', 'Romana\'s Pilates', 'Classical Mat Certification'],
        specialties: ['Mat Pilates', 'Classical Pilates', 'Breath Work'],
        profilePictureUrl: 'https://images.unsplash.com/photo-1611672585731-fa10603fb9e0?q=80&w=600&auto=format&fit=crop',
        experienceYears: 8,
        rating: 4.8,
        isActive: true,
    },
    {
        id: 'trainer-david',
        name: 'David Stone',
        email: 'david@solpilates.com',
        phone: '+1 (212) 555-0103',
        bio: 'Expert in Plank Series, Side Kick, and Leg Pull variations. Pilates-based strength coach specialising in functional movement and deep core stability — true strength is about control.',
        certifications: ['NASM-CPT', 'STOTT Pilates', 'TRX Certified'],
        specialties: ['Strength & Sculpt', 'Functional Movement', 'Core Training'],
        profilePictureUrl: 'https://images.unsplash.com/photo-1599058945522-28d584b6f0ff?q=80&w=600&auto=format&fit=crop',
        experienceYears: 7,
        rating: 4.7,
        isActive: true,
    },
    {
        id: 'trainer-sarah',
        name: 'Sarah Jen',
        email: 'sarah@solpilates.com',
        phone: '+1 (212) 555-0104',
        bio: 'Teaching Spine Stretch, Swan Dive, and Mermaid flows. Former dancer focusing on barre-fusion and flexibility — unlock the freedom and elegance your body was designed for.',
        certifications: ['PMA-CPT', 'Barre3 Certified', 'Dance Conditioning'],
        specialties: ['Barre Pilates', 'Flexibility', 'Dance Conditioning'],
        profilePictureUrl: 'https://images.unsplash.com/photo-1548690312-e3b507d8c110?q=80&w=600&auto=format&fit=crop',
        experienceYears: 6,
        rating: 4.8,
        isActive: true,
    },
    {
        id: 'trainer-maya',
        name: 'Maya Lee',
        email: 'maya@solpilates.com',
        phone: '+1 (212) 555-0105',
        bio: 'Guiding Pelvic Curl, Cat-Cow, and Side Lying sequences. Specialist in prenatal Pilates and restorative movement — gentle, purposeful sessions for every stage of life.',
        certifications: ['PMA-CPT', 'Prenatal Pilates', 'Restorative Movement'],
        specialties: ['Prenatal Pilates', 'Restorative', 'Gentle Movement'],
        profilePictureUrl: 'https://images.unsplash.com/photo-1574680096145-d05b474e2155?q=80&w=600&auto=format&fit=crop',
        experienceYears: 9,
        rating: 4.9,
        isActive: true,
    },
];

// ---------------------------------------------------------------------------
// Class templates — these rotate across days
// ---------------------------------------------------------------------------

interface ClassTemplate {
    classType: string;
    startTime: string;
    duration: number;
    capacity: number;
    totalSpots: number;
    trainerId: string;
    difficultyLevel: 'beginner' | 'intermediate' | 'advanced';
    description: string;
    equipmentNeeded: string;
    location: string;
    intensityLevel: 1 | 2 | 3;
}

const CLASS_TEMPLATES: ClassTemplate[][] = [
    // Day pattern A (Mon, Wed, Fri)
    [
        {
            classType: 'Reformer Pilates',
            startTime: '06:00',
            duration: 50,
            capacity: 12,
            totalSpots: 12,
            trainerId: 'trainer-marcus',
            difficultyLevel: 'intermediate',
            description: 'Full-body reformer session focusing on Footwork, Long Stretch, and Elephant sequences. Build strength through controlled, intentional movements.',
            equipmentNeeded: 'Reformer (provided)',
            location: 'Reformer Studio',
            intensityLevel: 2,
        },
        {
            classType: 'Mat Pilates',
            startTime: '08:00',
            duration: 45,
            capacity: 15,
            totalSpots: 15,
            trainerId: 'trainer-elena',
            difficultyLevel: 'beginner',
            description: 'Classical mat Pilates featuring The Hundred, Roll-Up, and Teaser progressions. Reshape your body through precision and breath.',
            equipmentNeeded: 'Mat (provided)',
            location: 'Main Studio',
            intensityLevel: 1,
        },
        {
            classType: 'Strength & Sculpt',
            startTime: '10:00',
            duration: 50,
            capacity: 10,
            totalSpots: 10,
            trainerId: 'trainer-david',
            difficultyLevel: 'advanced',
            description: 'Pilates-based strength training with Plank Series, Side Kick, and Leg Pull variations. Functional movement meets deep core stability.',
            equipmentNeeded: 'Mat, light weights (provided)',
            location: 'Performance Floor',
            intensityLevel: 3,
        },
        {
            classType: 'Barre Pilates',
            startTime: '16:00',
            duration: 45,
            capacity: 12,
            totalSpots: 12,
            trainerId: 'trainer-sarah',
            difficultyLevel: 'intermediate',
            description: 'Barre-fusion class with Spine Stretch, Swan Dive, and Mermaid flows. Unlock freedom and elegance through dance-inspired movement.',
            equipmentNeeded: 'Barre, mat (provided)',
            location: 'Barre Studio',
            intensityLevel: 2,
        },
        {
            classType: 'Reset & Restore',
            startTime: '18:00',
            duration: 60,
            capacity: 8,
            totalSpots: 8,
            trainerId: 'trainer-maya',
            difficultyLevel: 'beginner',
            description: 'Gentle restorative session with Pelvic Curl, Cat-Cow, and Side Lying sequences. Purposeful movement designed for recovery and renewal.',
            equipmentNeeded: 'Mat, bolster (provided)',
            location: 'Wellness Room',
            intensityLevel: 1,
        },
    ],
    // Day pattern B (Tue, Thu)
    [
        {
            classType: 'Mat Pilates',
            startTime: '06:00',
            duration: 45,
            capacity: 15,
            totalSpots: 15,
            trainerId: 'trainer-elena',
            difficultyLevel: 'intermediate',
            description: 'Morning mat Pilates flow. Build core strength and flexibility with classical sequences adapted for all levels.',
            equipmentNeeded: 'Mat (provided)',
            location: 'Main Studio',
            intensityLevel: 2,
        },
        {
            classType: 'Reformer Pilates',
            startTime: '08:30',
            duration: 50,
            capacity: 12,
            totalSpots: 12,
            trainerId: 'trainer-marcus',
            difficultyLevel: 'advanced',
            description: 'Advanced reformer session. Challenge yourself with complex sequences requiring precision and control.',
            equipmentNeeded: 'Reformer (provided)',
            location: 'Reformer Studio',
            intensityLevel: 3,
        },
        {
            classType: 'Barre Pilates',
            startTime: '10:30',
            duration: 45,
            capacity: 12,
            totalSpots: 12,
            trainerId: 'trainer-sarah',
            difficultyLevel: 'beginner',
            description: 'Beginner-friendly barre class focusing on alignment, posture, and gentle strengthening through dance-inspired exercises.',
            equipmentNeeded: 'Barre, mat (provided)',
            location: 'Barre Studio',
            intensityLevel: 1,
        },
        {
            classType: 'Strength & Sculpt',
            startTime: '17:00',
            duration: 50,
            capacity: 10,
            totalSpots: 10,
            trainerId: 'trainer-david',
            difficultyLevel: 'intermediate',
            description: 'Evening strength session blending Pilates principles with resistance training for total body sculpting.',
            equipmentNeeded: 'Mat, resistance bands (provided)',
            location: 'Performance Floor',
            intensityLevel: 2,
        },
    ],
    // Day pattern C (Sat, Sun)
    [
        {
            classType: 'Reformer Pilates',
            startTime: '07:00',
            duration: 50,
            capacity: 12,
            totalSpots: 12,
            trainerId: 'trainer-marcus',
            difficultyLevel: 'beginner',
            description: 'Weekend reformer fundamentals. Perfect for beginners or those seeking a mindful start to the weekend.',
            equipmentNeeded: 'Reformer (provided)',
            location: 'Reformer Studio',
            intensityLevel: 1,
        },
        {
            classType: 'Mat Pilates',
            startTime: '09:00',
            duration: 45,
            capacity: 15,
            totalSpots: 15,
            trainerId: 'trainer-elena',
            difficultyLevel: 'intermediate',
            description: 'Weekend mat flow combining breath work with classical Pilates movements for full-body renewal.',
            equipmentNeeded: 'Mat (provided)',
            location: 'Main Studio',
            intensityLevel: 2,
        },
        {
            classType: 'Barre Pilates',
            startTime: '11:00',
            duration: 45,
            capacity: 12,
            totalSpots: 12,
            trainerId: 'trainer-sarah',
            difficultyLevel: 'intermediate',
            description: 'Weekend barre fusion class — energizing movements at the barre combined with mat Pilates for a complete workout.',
            equipmentNeeded: 'Barre, mat (provided)',
            location: 'Barre Studio',
            intensityLevel: 2,
        },
        {
            classType: 'Reset & Restore',
            startTime: '14:00',
            duration: 60,
            capacity: 8,
            totalSpots: 8,
            trainerId: 'trainer-maya',
            difficultyLevel: 'beginner',
            description: 'Weekend wind-down session. Deep stretching, gentle movement, and guided breathing for total relaxation.',
            equipmentNeeded: 'Mat, bolster (provided)',
            location: 'Wellness Room',
            intensityLevel: 1,
        },
    ],
];

// ---------------------------------------------------------------------------
// Subscription Plans
// ---------------------------------------------------------------------------

const SUBSCRIPTION_PLANS = [
    {
        id: 'weekly',
        name: 'Weekly Plan',
        duration: 7,
        price: 49,
        classesIncluded: 3,
        features: [
            '3 classes per week',
            'Full studio access',
            'Standard booking window',
            'Email support',
        ],
        recommended: false,
    },
    {
        id: 'monthly',
        name: 'Monthly Plan',
        duration: 30,
        price: 149,
        classesIncluded: 12,
        features: [
            '12 classes per month',
            'Full studio access',
            'Priority booking window',
            '24h advance booking',
            '1 free guest pass per month',
        ],
        recommended: true,
    },
    {
        id: 'quarterly',
        name: 'Quarterly Plan',
        duration: 90,
        price: 349,
        classesIncluded: 40,
        features: [
            '40 classes per quarter',
            'Full studio access',
            'Premium booking window',
            '1 week advance booking',
            '3 free guest passes',
            'Premium welcome pack',
        ],
        recommended: false,
    },
];

// ---------------------------------------------------------------------------
// Gym Center
// ---------------------------------------------------------------------------

const GYM_CENTER = {
    id: 'sol-pilates',
    name: 'SOL Pilates Studio',
    address: {
        street: '250 West 54th Street',
        city: 'New York',
        state: 'NY',
        zip: '10019',
        country: 'USA',
    },
    coordinates: { lat: 40.7638, lng: -73.9826 },
    contactInfo: {
        phone: '(212) 555-0180',
        email: 'solpilatesstudio.in@gmail.com',
    },
    operatingHours: {
        monday: { open: '05:00', close: '23:00' },
        tuesday: { open: '05:00', close: '23:00' },
        wednesday: { open: '05:00', close: '23:00' },
        thursday: { open: '05:00', close: '23:00' },
        friday: { open: '05:00', close: '23:00' },
        saturday: { open: '06:00', close: '22:00' },
        sunday: { open: '07:00', close: '21:00' },
    },
    facilities: 'Reformer Studio, Main Studio, Performance Floor, Barre Studio, Wellness Room, Recovery Lounge, Changing Rooms, Smoothie Bar',
    photos: [
        'https://images.unsplash.com/photo-1534438327276-14e5300c3a48?q=80&w=1470&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1593079831268-3381b0db4a77?q=80&w=1469&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1571902943202-507ec2618e8f?q=80&w=1375&auto=format&fit=crop',
        'https://images.unsplash.com/photo-1576678927484-cc907957088c?q=80&w=1374&auto=format&fit=crop',
    ],
    isActive: true,
};

// ---------------------------------------------------------------------------
// Helper: get day pattern based on day of week
// ---------------------------------------------------------------------------

function getPatternForDay(dayOfWeek: number): ClassTemplate[] {
    // 0=Sun, 1=Mon, ..., 6=Sat
    if (dayOfWeek === 0 || dayOfWeek === 6) return CLASS_TEMPLATES[2]; // Weekend
    if (dayOfWeek === 2 || dayOfWeek === 4) return CLASS_TEMPLATES[1]; // Tue, Thu
    return CLASS_TEMPLATES[0]; // Mon, Wed, Fri
}

// ---------------------------------------------------------------------------
// seedDatabase — Admin-only callable Cloud Function
// ---------------------------------------------------------------------------

export const seedDatabase = functions.https.onCall(async (_data, context) => {
    if (!context.auth) {
        throw new functions.https.HttpsError('unauthenticated', 'Must be logged in');
    }

    if (!context.auth.token.admin) {
        throw new functions.https.HttpsError('permission-denied', 'Admin access required');
    }

    // Check if already seeded
    const seedMarkerRef = db.collection('_metadata').doc('seed_status');
    const seedMarker = await seedMarkerRef.get();
    if (seedMarker.exists && seedMarker.data()?.seeded === true) {
        throw new functions.https.HttpsError(
            'already-exists',
            'Database has already been seeded. Delete _metadata/seed_status to re-seed.'
        );
    }

    const batch = db.batch();
    const now = FieldValue.serverTimestamp();

    // -----------------------------------------------------------------------
    // 1. Seed Trainers
    // -----------------------------------------------------------------------
    for (const trainer of TRAINERS) {
        const ref = db.collection('trainers').doc(trainer.id);
        batch.set(ref, {
            ...trainer,
            createdAt: now,
            updatedAt: now,
        });
    }

    // -----------------------------------------------------------------------
    // 2. Seed Subscription Plans
    // -----------------------------------------------------------------------
    for (const plan of SUBSCRIPTION_PLANS) {
        const ref = db.collection('subscriptionPlans').doc(plan.id);
        batch.set(ref, {
            ...plan,
            createdAt: now,
            updatedAt: now,
        });
    }

    // -----------------------------------------------------------------------
    // 3. Seed Gym Center
    // -----------------------------------------------------------------------
    const gymRef = db.collection('gymCenters').doc(GYM_CENTER.id);
    batch.set(gymRef, {
        ...GYM_CENTER,
        createdAt: now,
        updatedAt: now,
    });

    // Commit the first batch (trainers, plans, gym)
    await batch.commit();

    // -----------------------------------------------------------------------
    // 4. Seed Classes (next 7 days) — separate batches to stay under 500 limit
    // -----------------------------------------------------------------------
    const classBatch = db.batch();
    let classCount = 0;

    const today = new Date();
    today.setHours(0, 0, 0, 0);

    for (let dayOffset = 0; dayOffset < 7; dayOffset++) {
        const classDate = new Date(today);
        classDate.setDate(classDate.getDate() + dayOffset);

        const dayOfWeek = classDate.getDay();
        const templates = getPatternForDay(dayOfWeek);

        for (const template of templates) {
            const classRef = db.collection('classes').doc();
            classBatch.set(classRef, {
                id: classRef.id,
                trainerId: template.trainerId,
                date: Timestamp.fromDate(classDate),
                startTime: template.startTime,
                duration: template.duration,
                capacity: template.capacity,
                bookedCount: 0,
                classType: template.classType,
                difficultyLevel: template.difficultyLevel,
                description: template.description,
                equipmentNeeded: template.equipmentNeeded,
                status: 'scheduled',
                totalSpots: template.totalSpots,
                bookedSpots: [],
                location: template.location,
                intensityLevel: template.intensityLevel,
                createdAt: now,
                updatedAt: now,
            });
            classCount++;
        }
    }

    await classBatch.commit();

    // -----------------------------------------------------------------------
    // 5. Mark as seeded
    // -----------------------------------------------------------------------
    await seedMarkerRef.set({
        seeded: true,
        seededAt: now,
        seededBy: context.auth.uid,
        stats: {
            trainers: TRAINERS.length,
            classes: classCount,
            subscriptionPlans: SUBSCRIPTION_PLANS.length,
            gymCenters: 1,
        },
    });

    return {
        success: true,
        seeded: {
            trainers: TRAINERS.length,
            classes: classCount,
            subscriptionPlans: SUBSCRIPTION_PLANS.length,
            gymCenters: 1,
        },
    };
});
