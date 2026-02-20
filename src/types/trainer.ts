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
    createdAt: Date;
    updatedAt: Date;
}
