// Auth triggers
export { onUserCreate } from './triggers/onUserCreate';

// Firestore triggers
export { onBookingStatusChange } from './triggers/onBookingStatusChange';
export { sendBookingConfirmation } from './triggers/sendBookingConfirmation';

// HTTPS callable functions
export { activateSubscription } from './api/activateSubscription';
export { bookClass } from './api/bookClass';
export { cancelBooking } from './api/cancelBooking';
export { createClass } from './api/createClass';
export { updateClass } from './api/updateClass';
export { deleteClass } from './api/deleteClass';
export { getScheduleByDate } from './api/getScheduleByDate';
export { getUserBookings } from './api/getUserBookings';
export { setAdminRole } from './api/setAdminRole';

// Seed data
export { seedDatabase } from './seed/seedData';
