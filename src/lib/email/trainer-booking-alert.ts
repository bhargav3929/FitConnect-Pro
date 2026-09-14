import nodemailer from 'nodemailer';
import { Timestamp } from 'firebase-admin/firestore';
import { adminDb } from '@/lib/firebase/admin';

/**
 * Emails the class trainer when a member is booked into their class.
 *
 * Sends through a studio Gmail account over SMTP. Configure with:
 *   GMAIL_USER          the sending address
 *   GMAIL_APP_PASSWORD  a Google "app password" for that account
 * If either is missing the alert is skipped and a warning is logged, so
 * booking never fails because mail is unconfigured.
 */

const STUDIO_TIME_ZONE = 'Asia/Kolkata';

function getTransport() {
    const user = process.env.GMAIL_USER;
    const pass = process.env.GMAIL_APP_PASSWORD;
    if (!user || !pass) return null;
    return nodemailer.createTransport({
        service: 'gmail',
        auth: { user, pass },
    });
}

function toDate(value: unknown): Date | null {
    if (value instanceof Timestamp) return value.toDate();
    if (value instanceof Date) return value;
    if (typeof value === 'string' || typeof value === 'number') {
        const d = new Date(value);
        return Number.isNaN(d.getTime()) ? null : d;
    }
    return null;
}

function formatClassDate(date: Date | null): string {
    if (!date) return '';
    return date.toLocaleDateString('en-IN', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
        timeZone: STUDIO_TIME_ZONE,
    });
}

function escapeHtml(value: string): string {
    return value
        .replace(/&/g, '&amp;')
        .replace(/</g, '&lt;')
        .replace(/>/g, '&gt;')
        .replace(/"/g, '&quot;');
}

export async function sendTrainerBookingAlert(bookingId: string): Promise<void> {
    const transport = getTransport();
    if (!transport) {
        console.warn('[trainer-alert] GMAIL_USER / GMAIL_APP_PASSWORD not set; skipping alert for booking', bookingId);
        return;
    }

    const bookingDoc = await adminDb.collection('bookings').doc(bookingId).get();
    if (!bookingDoc.exists) {
        console.warn('[trainer-alert] booking not found', bookingId);
        return;
    }
    const booking = bookingDoc.data()!;

    const classDoc = await adminDb.collection('classes').doc(booking.classId).get();
    if (!classDoc.exists) {
        console.warn('[trainer-alert] class not found for booking', bookingId);
        return;
    }
    const classData = classDoc.data()!;

    const trainerId: string = booking.trainerId || classData.trainerId || '';
    if (!trainerId) {
        console.warn('[trainer-alert] class has no trainer; skipping', booking.classId);
        return;
    }
    const trainerDoc = await adminDb.collection('trainers').doc(trainerId).get();
    const trainer = trainerDoc.exists ? trainerDoc.data()! : null;
    const trainerEmail: string = trainer?.email || '';
    if (!trainerEmail) {
        console.warn('[trainer-alert] trainer has no email; skipping', trainerId);
        return;
    }

    let memberName: string = booking.userName || '';
    let memberPhone = '';
    if (booking.userId) {
        const userDoc = await adminDb.collection('users').doc(booking.userId).get();
        if (userDoc.exists) {
            const user = userDoc.data()!;
            memberName = memberName || user.displayName || user.name || user.email || 'Member';
            memberPhone = user.phone || user.phoneNumber || '';
        }
    }
    memberName = memberName || 'Member';

    const classType: string = classData.classType || 'Pilates';
    const dateStr = formatClassDate(toDate(classData.date));
    const startTime: string = classData.startTime || '';
    const bookedCount = typeof classData.bookedCount === 'number' ? classData.bookedCount : null;
    const totalSpots = classData.totalSpots || classData.capacity || null;
    const spot = typeof booking.spotNumber === 'number' ? booking.spotNumber : null;
    const guestLine = booking.isGuest && booking.guestName ? ` (guest: ${booking.guestName})` : '';
    const occupancy = bookedCount !== null && totalSpots ? `${bookedCount} of ${totalSpots} spots booked` : '';

    const subject = `New booking: ${memberName} for ${classType} on ${dateStr}${startTime ? ` at ${startTime}` : ''}`;

    const lines = [
        `Hi ${trainer?.name || 'there'},`,
        '',
        `${memberName}${guestLine} just booked your ${classType} class.`,
        '',
        `Date: ${dateStr}`,
        startTime ? `Time: ${startTime}` : '',
        spot !== null ? `Spot: ${spot}` : '',
        memberPhone ? `Member phone: ${memberPhone}` : '',
        occupancy ? `Class: ${occupancy}` : '',
        '',
        'Sol Pilates Studio',
    ].filter((line) => line !== '');

    const text = lines.join('\n');
    const html = `<div style="font-family:Arial,sans-serif;font-size:15px;line-height:1.5;color:#1a1a1a">${lines
        .map((line) => (line === '' ? '<br>' : `<p style="margin:0 0 6px">${escapeHtml(line)}</p>`))
        .join('')}</div>`;

    await transport.sendMail({
        from: `"Sol Pilates Studio" <${process.env.GMAIL_USER}>`,
        to: trainerEmail,
        subject,
        text,
        html,
    });
    console.log('[trainer-alert] sent', { bookingId, trainerId, to: trainerEmail });
}
