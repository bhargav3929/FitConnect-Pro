export interface Booking {
    id: string;
    userId: string;
    classId: string;
    gymCenterId: string;
    trainerId: string;
    classDate: Date;
    bookingDate: Date;
    status: 'confirmed' | 'canceled' | 'attended' | 'no-show';
    canceledAt?: Date;
    attendedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
