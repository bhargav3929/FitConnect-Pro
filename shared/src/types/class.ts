export interface ClassSession {
    id: string;
    trainerId: string;
    date: Date;
    startTime: string; // "06:00"
    duration: number; // minutes
    capacity: number;
    bookedCount: number;
    classType?: string;
    difficultyLevel?: 'beginner' | 'intermediate' | 'advanced';
    equipmentNeeded?: string;
    description?: string;
    status: 'scheduled' | 'ongoing' | 'completed' | 'canceled';
    canceledAt?: Date;
    cancelReason?: string;
    createdAt: Date;
    updatedAt: Date;
    // New fields for spot-based booking
    totalSpots?: number; // e.g., 12
    bookedSpots?: number[]; // array of spot numbers taken
    instructorImage?: string; // instructor avatar URL
    location?: string; // Room/area within the facility, e.g., "Performance Floor", "Yoga Studio"
    intensityLevel?: 1 | 2 | 3; // fire emoji count
}

export const CLASS_TYPES = ['Sol Flow', 'Sol Cardio', 'Sol Stretch'] as const;
export type ClassTypeName = (typeof CLASS_TYPES)[number];

export const CLASS_TYPE_DESCRIPTIONS: Record<ClassTypeName, string> = {
    'Sol Flow': 'Strength meets movement in this smooth, continuous reformer class. No breaks, just flow.',
    'Sol Cardio': 'Fast-paced movement that gets your heart rate up.',
    'Sol Stretch': 'Hit reset on your body, one stretch at a time.',
};

export const CLASS_SCHEDULE_TIMES = ['08:00', '09:00', '10:00', '17:00', '18:00', '19:00'] as const;

export interface SpotSelection {
    spotNumber: number;
    isGuest: boolean;
}
