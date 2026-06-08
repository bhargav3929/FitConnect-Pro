import { PlanId } from './subscription';

export interface Booking {
    id: string;
    userId: string;
    userName?: string;
    classId: string;
    trainerId: string;
    classDate: Date;
    bookingDate: Date;
    spotNumber: number;
    isGuest: boolean;
    guestName?: string;
    status: 'confirmed' | 'canceled' | 'attended' | 'no-show';
    creditType: 'standard' | 'unlimited' | 'guest_pass' | 'intro_credit';
    planIdAtBooking: PlanId | null;
    usedGuestPass: boolean;
    canceledAt?: Date;
    cancelReason?: string;
    attendedAt?: Date;
    createdAt: Date;
    updatedAt: Date;
}
