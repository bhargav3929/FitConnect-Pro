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
}
