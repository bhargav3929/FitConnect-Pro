export interface ClassSession {
    id: string;
    gymCenterId: string;
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
    location?: string; // e.g., "Cedar Park"
    intensityLevel?: 1 | 2 | 3; // fire emoji count
}

export interface SpotSelection {
    spotNumber: number;
    isGuest: boolean;
}
