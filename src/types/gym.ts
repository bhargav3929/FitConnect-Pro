export interface GymCenter {
    id: string;
    name: string;
    address: {
        street: string;
        city: string;
        state: string;
        zip: string;
        country: string;
    };
    coordinates: {
        lat: number;
        lng: number;
    };
    contactInfo: {
        phone: string;
        email: string;
    };
    operatingHours: {
        [key: string]: { open: string; close: string; }; // monday, tuesday, etc.
    };
    facilities: string; // Rich text
    photos: string[];
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
}
