export interface Trainer {
    id: string;
    name: string;
    email: string;
    phone: string;
    bio: string;
    certifications: string[];
    specialties: string[];
    profilePictureUrl: string;
    experienceYears: number;
    rating?: number;
    isActive: boolean;
    gymCenterIds: string[];
    createdAt: Date;
    updatedAt: Date;
}
