export interface Booking {
    id: string;
    userId: string;
    classId: string;
    trainerId: string;
    classDate: Date;
    bookingDate: Date;
    spotNumber: number;
    isGuest: boolean;
    status: 'confirmed' | 'canceled' | 'attended' | 'no-show';
    canceledAt?: Date;
    cancelReason?: string;
    attendedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
