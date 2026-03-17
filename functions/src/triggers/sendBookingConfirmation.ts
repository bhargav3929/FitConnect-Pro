import * as functions from 'firebase-functions';
import { db } from '../init';
import { getTemplate } from '../templates/emailTemplates';

export const sendBookingConfirmation = functions.firestore
    .document('bookings/{bookingId}')
    .onCreate(async (snapshot, _context) => {
        const bookingData = snapshot.data();

        if (bookingData.status !== 'confirmed') {
            return null;
        }

        try {
            // Fetch user details
            const userDoc = await db.collection('users').doc(bookingData.userId).get();
            if (!userDoc.exists) {
                console.error(`User ${bookingData.userId} not found for booking confirmation`);
                return null;
            }
            const userData = userDoc.data()!;

            // Fetch class details
            const classDoc = await db.collection('classes').doc(bookingData.classId).get();
            if (!classDoc.exists) {
                console.error(`Class ${bookingData.classId} not found for booking confirmation`);
                return null;
            }
            const classData = classDoc.data()!;

            // Fetch trainer details
            let trainerName = 'Instructor';
            if (classData.trainerId) {
                const trainerDoc = await db.collection('trainers').doc(classData.trainerId).get();
                if (trainerDoc.exists) {
                    trainerName = trainerDoc.data()!.name;
                }
            }

            // Fetch gym info (single facility)
            let gymName = 'SOL Pilates Studio';
            let address = '';
            const gymSnapshot = await db.collection('gymCenters').limit(1).get();
            if (!gymSnapshot.empty) {
                const gymData = gymSnapshot.docs[0].data();
                gymName = gymData.name || gymName;
                const addr = gymData.address;
                if (addr) {
                    address = `${addr.street}, ${addr.city}, ${addr.state} ${addr.zip}`;
                }
            }

            // Format the class date
            const classDate = classData.date.toDate ? classData.date.toDate() : new Date(classData.date);
            const dateStr = classDate.toLocaleDateString('en-US', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric',
            });

            // Generate email HTML (stub — actual sending would use a mail service)
            const emailHtml = getTemplate('BOOKING_CONFIRMED', {
                name: userData.name || 'Member',
                classType: classData.classType || 'Pilates',
                trainerName,
                date: dateStr,
                time: classData.startTime || '',
                gymName,
                address,
            });

            // TODO: Integrate with an email service (SendGrid, Mailgun, etc.)
            // For now, log the confirmation
            console.log(`Booking confirmation for ${userData.email}:`, {
                bookingId: snapshot.id,
                classType: classData.classType,
                date: dateStr,
                time: classData.startTime,
                trainer: trainerName,
                htmlLength: emailHtml.length,
            });

            return null;
        } catch (error) {
            console.error('Error sending booking confirmation:', error);
            return null;
        }
    });
