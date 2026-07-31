"use client";

import { useState, useEffect } from "react";
import {
    subscribeToCheckinClasses,
    subscribeToBookingsByClass,
    callCheckInBooking,
} from "@fitconnect/shared/firebase/firestore";
import { ClassSession } from "@fitconnect/shared/types/class";
import { Booking } from "@fitconnect/shared/types/booking";
import { CheckCircle, X, Users, UserCheck, RefreshCw, ChevronLeft, ChevronRight } from "lucide-react";
import { toast } from "sonner";

// ── Helpers ────────────────────────────────────────────────────────────────

function fmtTime(t: string) {
    const [h, m] = t.split(":").map(Number);
    const period = h >= 12 ? "PM" : "AM";
    const hour = h % 12 || 12;
    return `${hour}:${m.toString().padStart(2, "0")} ${period}`;
}

/** `<input type="date">` value for a Date, in local time (never UTC-shifted). */
function toDateInputValue(d: Date): string {
    const month = `${d.getMonth() + 1}`.padStart(2, "0");
    const day = `${d.getDate()}`.padStart(2, "0");
    return `${d.getFullYear()}-${month}-${day}`;
}

/** Parse a `yyyy-mm-dd` input value as local midnight, not UTC midnight. */
function fromDateInputValue(value: string): Date | null {
    const [year, month, day] = value.split("-").map(Number);
    if (!year || !month || !day) return null;
    return new Date(year, month - 1, day);
}

function addDays(d: Date, days: number): Date {
    const next = new Date(d);
    next.setDate(next.getDate() + days);
    return next;
}

function isSameDay(a: Date, b: Date): boolean {
    return (
        a.getFullYear() === b.getFullYear() &&
        a.getMonth() === b.getMonth() &&
        a.getDate() === b.getDate()
    );
}

function isClassNow(cls: ClassSession): boolean {
    const now = new Date();
    const [h, m] = cls.startTime.split(":").map(Number);
    const base = cls.date instanceof Date ? cls.date : new Date(cls.date);
    const start = new Date(base);
    start.setHours(h, m, 0, 0);
    const end = new Date(start.getTime() + (cls.duration || 60) * 60 * 1000);
    return now >= start && now <= end;
}

// ── Component ──────────────────────────────────────────────────────────────

export default function CheckInPage() {
    const [today] = useState(() => new Date());
    const [selectedDate, setSelectedDate] = useState<Date>(today);
    const [selectedClassId, setSelectedClassId] = useState<string | null>(null);
    const [actionLoading, setActionLoading] = useState<Record<string, boolean>>({});
    const [now, setNow] = useState(new Date());

    // Both subscriptions stamp their results with the key they were opened for.
    // Rendering off that stamp means a date or class switch shows an empty,
    // loading panel without an effect having to reset state first.
    const [classSnapshot, setClassSnapshot] = useState<{
        dateKey: string;
        classes: ClassSession[];
    } | null>(null);
    const [bookingSnapshot, setBookingSnapshot] = useState<{
        classId: string;
        bookings: Booking[];
    } | null>(null);

    // Clock tick — updates every 30s to keep the "NOW" badge accurate
    useEffect(() => {
        const id = setInterval(() => setNow(new Date()), 30_000);
        return () => clearInterval(id);
    }, []);

    // Subscribe to the selected day's classes (includes scheduled + ongoing).
    // Keyed on the date string so a same-day re-render does not resubscribe.
    const selectedDateKey = toDateInputValue(selectedDate);
    useEffect(() => {
        const date = fromDateInputValue(selectedDateKey);
        if (!date) return;

        const unsub = subscribeToCheckinClasses(date, (cls) => {
            setClassSnapshot({ dateKey: selectedDateKey, classes: cls });
        });
        return unsub;
    }, [selectedDateKey]);

    const classesLoading = classSnapshot?.dateKey !== selectedDateKey;
    const classes = classesLoading ? [] : classSnapshot.classes;

    // Selection is derived, not stored: an explicit pick wins, otherwise fall
    // back to the class running now, otherwise the first of the day. A pick
    // from another day simply stops matching and the fallback takes over.
    const selectedClass =
        classes.find((c) => c.id === selectedClassId) ??
        classes.find(isClassNow) ??
        classes[0] ??
        null;

    // Subscribe to bookings for the selected class
    const classId = selectedClass?.id;
    useEffect(() => {
        if (!classId) return;
        const unsub = subscribeToBookingsByClass(classId, (bkgs) => {
            setBookingSnapshot({
                classId,
                bookings: bkgs
                    .filter((b) => b.status !== "canceled")
                    .sort((a, b) => a.spotNumber - b.spotNumber),
            });
        });
        return unsub;
    }, [classId]);

    const bookings =
        classId && bookingSnapshot?.classId === classId ? bookingSnapshot.bookings : [];

    const handleAction = async (
        bookingId: string,
        action: "attended" | "no-show",
    ) => {
        setActionLoading((prev) => ({ ...prev, [bookingId]: true }));
        try {
            await callCheckInBooking(bookingId, action);
        } catch (err: unknown) {
            toast.error(
                err instanceof Error ? err.message : "Failed to update. Check your connection.",
            );
        } finally {
            setActionLoading((prev) => ({ ...prev, [bookingId]: false }));
        }
    };

    const attended = bookings.filter((b) => b.status === "attended").length;
    const noShow = bookings.filter((b) => b.status === "no-show").length;
    const pending = bookings.filter((b) => b.status === "confirmed").length;

    const isToday = isSameDay(selectedDate, today);
    const startOfToday = new Date(today);
    startOfToday.setHours(0, 0, 0, 0);
    const startOfSelected = new Date(selectedDate);
    startOfSelected.setHours(0, 0, 0, 0);
    // Admins bypass the check-in time window server-side, so hide the actions on
    // days that have not happened yet rather than let them record attendance early.
    const isFutureDay = startOfSelected > startOfToday;

    const dateLabel = selectedDate.toLocaleDateString("en-IN", {
        weekday: "long",
        day: "numeric",
        month: "long",
    });
    const eyebrowLabel = isToday
        ? "Today"
        : isSameDay(selectedDate, addDays(today, 1))
          ? "Tomorrow"
          : isSameDay(selectedDate, addDays(today, -1))
            ? "Yesterday"
            : isFutureDay
              ? "Upcoming"
              : "Past class";

    const clockLabel = now.toLocaleTimeString("en-IN", {
        hour: "2-digit",
        minute: "2-digit",
    });

    return (
        <div className="flex h-[calc(100vh-5rem)] -m-6 lg:-m-8 overflow-hidden">
            {/* ── Left panel: class list ─────────────────────────────── */}
            <aside className="w-56 lg:w-64 flex-shrink-0 border-r border-peach-400/20 bg-peach-50 flex flex-col overflow-y-auto">
                <div className="p-4 border-b border-peach-400/20">
                    <p className="text-[10px] font-bold uppercase tracking-[0.2em] text-terra-400">
                        {eyebrowLabel}
                    </p>
                    <p className="text-sm font-bold text-olive-600 mt-0.5 leading-snug">
                        {dateLabel}
                    </p>
                    <p className="text-xs text-olive-400 mt-1">
                        {isToday ? clockLabel : "Roster view"}
                    </p>

                    {/* Day navigation */}
                    <div className="flex items-center gap-1 mt-3">
                        <button
                            onClick={() => setSelectedDate((d) => addDays(d, -1))}
                            aria-label="Previous day"
                            className="w-7 h-7 flex-shrink-0 flex items-center justify-center border border-peach-400/30 text-olive-400 hover:text-olive-600 hover:border-olive-400/50 transition-colors"
                        >
                            <ChevronLeft className="w-3.5 h-3.5" />
                        </button>
                        <input
                            type="date"
                            value={toDateInputValue(selectedDate)}
                            onChange={(e) => {
                                const next = fromDateInputValue(e.target.value);
                                if (next) setSelectedDate(next);
                            }}
                            aria-label="Roster date"
                            className="flex-1 min-w-0 h-7 px-2 text-xs font-medium bg-peach-100 border border-peach-400/30 text-olive-600 focus:border-terra-400/60 focus:outline-none cursor-pointer"
                        />
                        <button
                            onClick={() => setSelectedDate((d) => addDays(d, 1))}
                            aria-label="Next day"
                            className="w-7 h-7 flex-shrink-0 flex items-center justify-center border border-peach-400/30 text-olive-400 hover:text-olive-600 hover:border-olive-400/50 transition-colors"
                        >
                            <ChevronRight className="w-3.5 h-3.5" />
                        </button>
                    </div>

                    {!isToday && (
                        <button
                            onClick={() => setSelectedDate(new Date())}
                            className="mt-2 text-[10px] font-bold uppercase tracking-[0.15em] text-terra-400 hover:text-terra-300 transition-colors"
                        >
                            Jump to today
                        </button>
                    )}
                </div>

                {classesLoading ? (
                    <div className="p-3 space-y-2">
                        {[1, 2, 3].map((i) => (
                            <div
                                key={i}
                                className="h-16 bg-peach-200/50 animate-pulse rounded"
                            />
                        ))}
                    </div>
                ) : classes.length === 0 ? (
                    <div className="flex-1 flex items-center justify-center p-6 text-center">
                        <p className="text-olive-300 text-sm">
                            No classes scheduled on this day
                        </p>
                    </div>
                ) : (
                    <nav className="flex-1 p-2 space-y-1">
                        {classes.map((cls) => {
                            const isSelected = selectedClass?.id === cls.id;
                            const nowActive = isClassNow(cls);
                            return (
                                <button
                                    key={cls.id}
                                    onClick={() => setSelectedClassId(cls.id)}
                                    className={`w-full text-left p-3 rounded-lg transition-all relative ${
                                        isSelected
                                            ? "bg-terra-400 shadow-lg shadow-terra-400/20"
                                            : nowActive
                                              ? "bg-terra-400/10 border border-terra-400/30"
                                              : "hover:bg-peach-200/60"
                                    }`}
                                >
                                    <div className="flex items-center justify-between gap-1">
                                        <p
                                            className={`text-sm font-black leading-none ${
                                                isSelected ? "text-peach-50" : "text-olive-600"
                                            }`}
                                        >
                                            {fmtTime(cls.startTime)}
                                        </p>
                                        {nowActive && (
                                            <span
                                                className={`text-[9px] font-bold uppercase tracking-wider px-1.5 py-0.5 ${
                                                    isSelected
                                                        ? "bg-peach-50/20 text-peach-50"
                                                        : "bg-terra-400/20 text-terra-400"
                                                }`}
                                            >
                                                NOW
                                            </span>
                                        )}
                                    </div>
                                    <p
                                        className={`text-xs mt-1 font-medium ${
                                            isSelected ? "text-peach-100/80" : "text-olive-400"
                                        }`}
                                    >
                                        {cls.classType || "Class"}
                                    </p>
                                    <p
                                        className={`text-[10px] mt-1 ${
                                            isSelected ? "text-peach-100/60" : "text-olive-300"
                                        }`}
                                    >
                                        {cls.bookedCount || 0} /{" "}
                                        {cls.totalSpots || cls.capacity || 12} booked
                                    </p>
                                </button>
                            );
                        })}
                    </nav>
                )}
            </aside>

            {/* ── Right panel: attendees ─────────────────────────────── */}
            <div className="flex-1 flex flex-col overflow-hidden bg-peach-100">
                {!selectedClass ? (
                    <div className="flex-1 flex items-center justify-center">
                        <div className="text-center">
                            <UserCheck className="w-12 h-12 text-olive-300/30 mx-auto mb-3" />
                            <p className="text-olive-400 text-sm">
                                Select a class to begin check-in
                            </p>
                        </div>
                    </div>
                ) : (
                    <>
                        {/* Panel header */}
                        <header className="flex items-center justify-between px-6 py-4 border-b border-peach-400/20 bg-peach-50 flex-wrap gap-3">
                            <div>
                                <h2 className="text-xl font-black text-olive-600 font-display leading-none">
                                    {selectedClass.classType || "Class"}{" "}
                                    <span className="text-terra-400">·</span>{" "}
                                    {fmtTime(selectedClass.startTime)}
                                    {isClassNow(selectedClass) && (
                                        <span className="ml-3 text-sm font-bold text-terra-400 border border-terra-400/40 px-2 py-0.5 align-middle">
                                            IN SESSION
                                        </span>
                                    )}
                                </h2>
                                <p className="text-xs text-olive-400 mt-1">
                                    {!isToday && <>{dateLabel} · </>}
                                    {selectedClass.location || "Group Room"} ·{" "}
                                    {selectedClass.duration} min
                                </p>
                            </div>

                            {/* Attendance counters */}
                            <div className="flex items-center gap-6">
                                <div className="text-center">
                                    <p className="text-3xl font-black text-green-700 leading-none">
                                        {attended}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-green-600 mt-1">
                                        Attended
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-black text-terra-400 leading-none">
                                        {pending}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-terra-400 mt-1">
                                        Pending
                                    </p>
                                </div>
                                <div className="text-center">
                                    <p className="text-3xl font-black text-olive-400 leading-none">
                                        {noShow}
                                    </p>
                                    <p className="text-[10px] font-bold uppercase tracking-[0.15em] text-olive-400 mt-1">
                                        No Show
                                    </p>
                                </div>
                            </div>
                        </header>

                        {/* Attendee rows */}
                        <div className="flex-1 overflow-y-auto">
                            {bookings.length === 0 ? (
                                <div className="flex items-center justify-center h-full">
                                    <div className="text-center">
                                        <Users className="w-10 h-10 text-olive-300/30 mx-auto mb-3" />
                                        <p className="text-olive-400 text-sm">
                                            No bookings for this class yet
                                        </p>
                                    </div>
                                </div>
                            ) : (
                                <ul className="divide-y divide-peach-400/15">
                                    {bookings.map((booking) => {
                                        const isLoading = actionLoading[booking.id];
                                        const isAttended = booking.status === "attended";
                                        const isNoShow = booking.status === "no-show";
                                        const isPending = booking.status === "confirmed";
                                        const name =
                                            booking.isGuest && booking.guestName
                                                ? booking.guestName
                                                : booking.userName || "Member";

                                        return (
                                            <li
                                                key={booking.id}
                                                className={`flex items-center gap-4 px-6 py-4 transition-colors ${
                                                    isAttended
                                                        ? "bg-green-50/50"
                                                        : isNoShow
                                                          ? "bg-peach-200/20 opacity-70"
                                                          : "hover:bg-peach-200/30"
                                                }`}
                                            >
                                                {/* Spot badge */}
                                                <div className="w-10 h-10 flex-shrink-0 border border-peach-400/30 bg-peach-200/40 flex items-center justify-center">
                                                    <span className="text-sm font-black text-olive-500">
                                                        #{booking.spotNumber}
                                                    </span>
                                                </div>

                                                {/* Name + credit type */}
                                                <div className="flex-1 min-w-0">
                                                    <div className="flex items-center gap-2 flex-wrap">
                                                        <p className="font-bold text-olive-600 truncate">
                                                            {name}
                                                        </p>
                                                        {booking.isGuest && (
                                                            <span className="text-[10px] font-bold text-terra-400 uppercase tracking-wider border border-terra-400/40 px-1.5 py-0.5">
                                                                Guest
                                                            </span>
                                                        )}
                                                    </div>
                                                    <p className="text-xs text-olive-400 mt-0.5 capitalize">
                                                        {booking.creditType?.replace("_", " ") ??
                                                            "standard"}{" "}
                                                        pass
                                                    </p>
                                                </div>

                                                {/* Actions — pending: primary buttons; settled: status badge + undo */}
                                                {isPending && isFutureDay && (
                                                    <span className="flex-shrink-0 text-xs font-bold uppercase tracking-wider text-olive-300 border border-peach-400/30 px-3 py-1.5">
                                                        Booked
                                                    </span>
                                                )}

                                                {isPending && !isFutureDay && (
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <button
                                                            onClick={() =>
                                                                handleAction(booking.id, "attended")
                                                            }
                                                            disabled={isLoading}
                                                            className="inline-flex items-center gap-1.5 px-5 py-2.5 bg-terra-400 text-peach-50 text-sm font-bold hover:bg-terra-300 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <CheckCircle className="w-4 h-4" />
                                                            Check In
                                                        </button>
                                                        <button
                                                            onClick={() =>
                                                                handleAction(booking.id, "no-show")
                                                            }
                                                            disabled={isLoading}
                                                            className="inline-flex items-center gap-1.5 px-5 py-2.5 border border-peach-400/40 text-olive-400 text-sm font-bold hover:border-olive-400/60 hover:text-olive-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                                                        >
                                                            <X className="w-4 h-4" />
                                                            No Show
                                                        </button>
                                                    </div>
                                                )}

                                                {isAttended && (
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-green-700 px-3 py-1.5 bg-green-100 border border-green-200">
                                                            <CheckCircle className="w-4 h-4" />
                                                            Attended
                                                        </span>
                                                        {/* Undo — let admin switch to no-show if mistaken */}
                                                        <button
                                                            onClick={() =>
                                                                handleAction(booking.id, "no-show")
                                                            }
                                                            disabled={isLoading}
                                                            title="Mark as No Show instead"
                                                            className="w-8 h-8 flex items-center justify-center text-olive-300 hover:text-olive-500 hover:bg-peach-200/50 rounded transition-colors disabled:opacity-40"
                                                        >
                                                            {isLoading ? (
                                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <X className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                )}

                                                {isNoShow && (
                                                    <div className="flex items-center gap-2 flex-shrink-0">
                                                        <span className="inline-flex items-center gap-1.5 text-sm font-bold text-olive-400 px-3 py-1.5 bg-peach-200/50 border border-peach-400/30">
                                                            <X className="w-4 h-4" />
                                                            No Show
                                                        </span>
                                                        {/* Undo — let admin check in if they show up late */}
                                                        <button
                                                            onClick={() =>
                                                                handleAction(booking.id, "attended")
                                                            }
                                                            disabled={isLoading}
                                                            title="Check In (they arrived late)"
                                                            className="w-8 h-8 flex items-center justify-center text-olive-300 hover:text-terra-400 hover:bg-terra-400/10 rounded transition-colors disabled:opacity-40"
                                                        >
                                                            {isLoading ? (
                                                                <RefreshCw className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <CheckCircle className="w-3.5 h-3.5" />
                                                            )}
                                                        </button>
                                                    </div>
                                                )}
                                            </li>
                                        );
                                    })}
                                </ul>
                            )}
                        </div>
                    </>
                )}
            </div>
        </div>
    );
}
