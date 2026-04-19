// Pure helper functions for CalendarStrip — testable without React Native

const DAY_NAMES = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];

export function generateDays(fromDate: Date, count: number): Date[] {
    const days: Date[] = [];
    for (let i = 0; i < count; i++) {
        const d = new Date(fromDate);
        d.setDate(d.getDate() + i);
        d.setHours(0, 0, 0, 0);
        days.push(d);
    }
    return days;
}

export function formatDayName(date: Date): string {
    return DAY_NAMES[date.getDay()];
}

export function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}
