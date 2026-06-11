"use client"

import { useState, useEffect, useMemo, useRef, useCallback } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    Plus,
    ChevronLeft,
    ChevronRight,
    Users,
    MapPin,
    Trash2,
    Loader2,
    Dumbbell,
    CheckCircle2,
    CalendarDays,
    Sparkles,
    X,
    CalendarRange,
    CalendarPlus,
} from "lucide-react"
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription,
} from "@/components/ui/dialog"
import {
    callCreateClass,
    callDeleteClass,
    callUpdateClass,
    getClassStats,
    getAdminClassesInRange,
    getTrainers,
} from "@fitconnect/shared/firebase/firestore"
import { ClassSession, INTRO_CLASS_TYPE } from "@fitconnect/shared/types/class"
import { Trainer } from "@fitconnect/shared/types/trainer"
import { toast } from "sonner"

// ───────────────────────── constants ─────────────────────────

const DIFFICULTY_LEVELS = ["beginner", "intermediate", "advanced"] as const
const LOCATIONS = ["Main Studio", "Reformer Studio", "Mat Studio", "Private Suite", "Barre & Stretch", "Recovery Lounge"]

const CLASS_TYPES = [
    { name: "Sol Flow", description: "Strength meets movement in this smooth, continuous reformer class. No breaks, just flow.", duration: 50, timeSlots: ["08:00", "09:00", "10:00", "17:00", "18:00", "19:00"] },
    { name: "Sol Cardio", description: "Fast-paced movement that gets your heart rate up.", duration: 50, timeSlots: ["08:00", "09:00", "10:00", "17:00", "18:00", "19:00"] },
    { name: "Sol Stretch", description: "Hit reset on your body, one stretch at a time.", duration: 50, timeSlots: ["08:00", "09:00", "10:00", "17:00", "18:00", "19:00"] },
    { name: INTRO_CLASS_TYPE, description: "A focused 30-minute first session for clients who have paid for the intro class.", duration: 30, timeSlots: ["08:00", "09:00", "10:00", "17:00", "18:00", "19:00"] },
] as const

// Each class type gets a distinct, earthy accent that harmonises with the SOL palette.
interface TypeTheme { accent: string; soft: string; text: string }
const TYPE_THEME: Record<string, TypeTheme> = {
    "Sol Flow": { accent: "#FF6A3D", soft: "rgba(255,106,61,0.10)", text: "#B83A1F" },
    "Sol Cardio": { accent: "#E8924A", soft: "rgba(232,146,74,0.12)", text: "#9A5A1E" },
    "Sol Stretch": { accent: "#64704F", soft: "rgba(100,112,79,0.12)", text: "#4A5438" },
    [INTRO_CLASS_TYPE]: { accent: "#C2685A", soft: "rgba(194,104,90,0.12)", text: "#8A3F33" },
}
const DEFAULT_THEME: TypeTheme = { accent: "#8A947A", soft: "rgba(138,148,122,0.12)", text: "#566044" }
const typeTheme = (t?: string): TypeTheme => (t && TYPE_THEME[t]) || DEFAULT_THEME

// Day-agenda time grid (06:00 → 21:00)
const DAY_START_HOUR = 6
const DAY_END_HOUR = 21
const HOUR_PX = 60
const GRID_HEIGHT = (DAY_END_HOUR - DAY_START_HOUR) * HOUR_PX
const WEEKDAYS = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"]
const MONTHS = ["January", "February", "March", "April", "May", "June", "July", "August", "September", "October", "November", "December"]

// ───────────────────────── date / time helpers ─────────────────────────

const pad = (n: number) => String(n).padStart(2, "0")
const toYmd = (d: Date) => `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}`
const isSameDay = (a: Date, b: Date) => toYmd(a) === toYmd(b)
const startOfMonth = (d: Date) => new Date(d.getFullYear(), d.getMonth(), 1)
const addMonths = (d: Date, n: number) => new Date(d.getFullYear(), d.getMonth() + n, 1)

function gridRange(month: Date) {
    const first = startOfMonth(month)
    const start = new Date(first)
    start.setDate(first.getDate() - first.getDay()) // back to Sunday
    const end = new Date(start)
    end.setDate(start.getDate() + 41) // 6 full weeks
    return { start, end }
}

const timeToMinutes = (t: string) => {
    const [h, m] = (t || "0:0").split(":").map(Number)
    return (h || 0) * 60 + (m || 0)
}
const minutesToY = (min: number) => ((min - DAY_START_HOUR * 60) / 60) * HOUR_PX

function fmtClock(min: number, compact = false) {
    const h = Math.floor(min / 60)
    const m = min % 60
    const ampm = h >= 12 ? "PM" : "AM"
    const dh = h % 12 === 0 ? 12 : h % 12
    if (compact) return m === 0 ? `${dh}${ampm.toLowerCase()}` : `${dh}:${pad(m)}${ampm.toLowerCase()}`
    return m === 0 ? `${dh} ${ampm}` : `${dh}:${pad(m)} ${ampm}`
}

// ───────────────────────── overlap layout (column packing) ─────────────────────────

interface Positioned {
    cls: ClassSession
    start: number
    end: number
    lane: number
    lanes: number
}

function layoutDay(events: ClassSession[]): Positioned[] {
    const evs = events
        .map((c) => {
            const start = timeToMinutes(c.startTime)
            return { cls: c, start, end: start + (c.duration || 50) }
        })
        .sort((a, b) => a.start - b.start || a.end - b.end)

    const result: Positioned[] = []
    let cluster: { cls: ClassSession; start: number; end: number }[] = []
    let clusterEnd = -1

    const flush = () => {
        const laneEnds: number[] = []
        const placed = cluster.map((e) => {
            let lane = laneEnds.findIndex((end) => end <= e.start)
            if (lane === -1) {
                lane = laneEnds.length
                laneEnds.push(e.end)
            } else {
                laneEnds[lane] = e.end
            }
            return { ...e, lane }
        })
        const lanes = laneEnds.length
        placed.forEach((p) => result.push({ ...p, lanes }))
        cluster = []
        clusterEnd = -1
    }

    for (const e of evs) {
        if (cluster.length && e.start >= clusterEnd) flush()
        cluster.push(e)
        clusterEnd = Math.max(clusterEnd, e.end)
    }
    flush()
    return result
}

// ───────────────────────── form ─────────────────────────

interface ClassFormData {
    trainerId: string
    date: string
    startTime: string
    duration: number
    capacity: number
    classType: string
    difficultyLevel: "beginner" | "intermediate" | "advanced"
    location: string
    description: string
}

const defaultFormData: ClassFormData = {
    trainerId: "",
    date: "",
    startTime: "08:00",
    duration: 50,
    capacity: 10,
    classType: "Sol Flow",
    difficultyLevel: "intermediate",
    location: "Main Studio",
    description: "",
}

// ───────────────────────── multi-date picker (bulk scheduling) ─────────────────────────

const fmtChip = (ymd: string) => {
    const [, m, d] = ymd.split("-").map(Number)
    return `${MONTHS[m - 1].slice(0, 3)} ${d}`
}

function MultiDatePicker({
    value,
    onChange,
    month,
    onMonthChange,
    existingDays,
}: {
    value: string[]
    onChange: (v: string[]) => void
    month: Date
    onMonthChange: (d: Date) => void
    existingDays: Set<string>
}) {
    const todayStr = toYmd(new Date())
    const selected = useMemo(() => new Set(value), [value])
    const cells = useMemo(() => {
        const { start } = gridRange(month)
        return Array.from({ length: 42 }, (_, i) => {
            const d = new Date(start)
            d.setDate(start.getDate() + i)
            return d
        })
    }, [month])

    const commit = (set: Set<string>) => onChange(Array.from(set).sort())

    const toggle = (d: Date) => {
        const k = toYmd(d)
        if (k < todayStr) return
        const next = new Set(selected)
        if (next.has(k)) next.delete(k)
        else next.add(k)
        commit(next)
    }

    const addNextDays = (n: number) => {
        const base = new Date()
        base.setHours(0, 0, 0, 0)
        const next = new Set(selected)
        for (let i = 0; i < n; i++) {
            const d = new Date(base)
            d.setDate(base.getDate() + i)
            next.add(toYmd(d))
        }
        commit(next)
        onMonthChange(startOfMonth(base))
    }

    const addWeekdayInMonth = (dow: number) => {
        const next = new Set(selected)
        const first = startOfMonth(month)
        const cursor = new Date(first)
        while (cursor.getMonth() === month.getMonth()) {
            if (cursor.getDay() === dow) {
                const k = toYmd(cursor)
                if (k >= todayStr) next.add(k)
            }
            cursor.setDate(cursor.getDate() + 1)
        }
        commit(next)
    }

    const QUICK = [
        { label: "Next 7 days", fn: () => addNextDays(7) },
        { label: "Next 14 days", fn: () => addNextDays(14) },
        { label: "Next 30 days", fn: () => addNextDays(30) },
    ]

    return (
        <div className="border border-peach-400/20 bg-peach-50" style={{ width: "100%", maxWidth: "100%", overflow: "hidden", boxSizing: "border-box" }}>

            {/* quick-range buttons + weekday shortcuts */}
            <div className="px-2.5 pt-2.5 pb-2 space-y-2 border-b border-peach-400/12">
                <div className="flex flex-wrap items-center gap-1.5">
                    {QUICK.map((q) => (
                        <button key={q.label} type="button" onClick={q.fn}
                            className="px-2.5 py-1 bg-peach-100 border border-peach-400/20 text-[10px] font-bold uppercase tracking-[0.06em] text-olive-500 hover:border-terra-400/40 hover:text-terra-500 transition-all">
                            {q.label}
                        </button>
                    ))}
                    {value.length > 0 && (
                        <button type="button" onClick={() => onChange([])}
                            className="ml-auto text-[10px] font-bold uppercase tracking-[0.06em] text-olive-300 hover:text-red-500 transition-colors">
                            Clear
                        </button>
                    )}
                </div>
                <div className="flex items-center gap-1">
                    <span className="text-[9px] font-bold uppercase tracking-[0.1em] text-olive-300 mr-0.5">Every</span>
                    {WEEKDAYS.map((w, dow) => (
                        <button key={w} type="button" onClick={() => addWeekdayInMonth(dow)}
                            title={`Add every ${w} in ${MONTHS[month.getMonth()]}`}
                            className="w-6 h-6 flex items-center justify-center text-[10px] font-bold text-olive-400 hover:bg-terra-400 hover:text-peach-50 transition-all">
                            {w[0]}
                        </button>
                    ))}
                </div>
            </div>

            {/* month nav */}
            <div className="flex items-center justify-between px-2.5 py-1.5">
                <span className="text-xs font-bold text-olive-600">
                    {MONTHS[month.getMonth()]} {month.getFullYear()}
                </span>
                <div className="flex items-center gap-0.5">
                    <button type="button" onClick={() => onMonthChange(addMonths(month, -1))} aria-label="Previous month"
                        className="w-6 h-6 flex items-center justify-center text-olive-400 hover:text-terra-400 hover:bg-peach-200/50 transition-all">
                        <ChevronLeft className="w-3 h-3" />
                    </button>
                    <button type="button" onClick={() => onMonthChange(addMonths(month, 1))} aria-label="Next month"
                        className="w-6 h-6 flex items-center justify-center text-olive-400 hover:text-terra-400 hover:bg-peach-200/50 transition-all">
                        <ChevronRight className="w-3 h-3" />
                    </button>
                </div>
            </div>

            {/* weekday header */}
            <div className="grid grid-cols-7 px-2">
                {WEEKDAYS.map((d) => (
                    <div key={d} className="text-center text-[9px] font-bold uppercase tracking-wide text-olive-300/50 pb-1">
                        {d[0]}
                    </div>
                ))}
            </div>

            {/* day grid — grid-cols-7 always fills its container; container is overflow:hidden above */}
            <div className="grid grid-cols-7 gap-px px-2 pb-2.5">
                {cells.map((d, i) => {
                    const k = toYmd(d)
                    const inMonth = d.getMonth() === month.getMonth()
                    const isPast = k < todayStr
                    const isSel = selected.has(k)
                    const hasClass = existingDays.has(k)
                    return (
                        <button key={i} type="button" disabled={isPast} onClick={() => toggle(d)}
                            className={`relative h-8 flex items-center justify-center text-[11px] transition-all duration-150
                                ${isSel
                                    ? "bg-terra-400 text-peach-50 font-bold"
                                    : isPast
                                        ? "text-olive-300/25 cursor-not-allowed"
                                        : inMonth
                                            ? "text-olive-600 hover:bg-peach-200/70 font-medium"
                                            : "text-olive-300/30 hover:bg-peach-100"}`}>
                            {d.getDate()}
                            {hasClass && !isSel && (
                                <span className="absolute bottom-0.5 w-1 h-1 rounded-full bg-olive-300/50" />
                            )}
                        </button>
                    )
                })}
            </div>

            {/* selected summary — fixed 40px, chip scroll uses block overflow not flex */}
            <div className="border-t border-peach-400/15" style={{ height: 40, display: "flex", alignItems: "center", padding: "0 10px", gap: 8, overflow: "hidden" }}>
                {value.length === 0 ? (
                    <p className="text-[11px] text-olive-300 w-full text-center">
                        Tap days or use a quick range to choose when this class runs.
                    </p>
                ) : (
                    <>
                        <span style={{ flexShrink: 0, whiteSpace: "nowrap" }} className="text-[10px] font-bold uppercase tracking-[0.1em] text-olive-500">
                            {value.length} {value.length === 1 ? "day" : "days"}
                        </span>
                        {/* outer: flex-1 with minWidth:0 hard-caps the available space */}
                        <div style={{ flex: "1 1 0px", minWidth: 0, overflow: "hidden" }}>
                            {/* inner: scrolls within that capped space, chips in a nowrap row */}
                            <div style={{ overflowX: "auto", overflowY: "hidden" }}
                                className="[scrollbar-width:none] [&::-webkit-scrollbar]:hidden">
                                <div style={{ display: "flex", gap: 4, width: "max-content" }}>
                                    {value.map((k) => (
                                        <span key={k} style={{ whiteSpace: "nowrap" }}
                                            className="inline-flex items-center gap-0.5 pl-1.5 pr-0.5 py-0.5 bg-terra-400/10 text-terra-500 text-[10px] font-semibold">
                                            {fmtChip(k)}
                                            <button type="button"
                                                onClick={() => onChange(value.filter((v) => v !== k))}
                                                className="w-3.5 h-3.5 flex items-center justify-center hover:bg-terra-400/20"
                                                aria-label={`Remove ${fmtChip(k)}`}>
                                                <X className="w-2.5 h-2.5" />
                                            </button>
                                        </span>
                                    ))}
                                </div>
                            </div>
                        </div>
                    </>
                )}
            </div>
        </div>
    )
}

// ═══════════════════════════════════════════════════════════════════════════
//  PAGE
// ═══════════════════════════════════════════════════════════════════════════

export default function ClassesPage() {
    const today = useMemo(() => new Date(), [])
    const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(new Date()))
    const [selectedDate, setSelectedDate] = useState<Date>(() => new Date())

    const [monthClasses, setMonthClasses] = useState<ClassSession[]>([])
    const [trainers, setTrainers] = useState<Trainer[]>([])
    const [classStats, setClassStats] = useState({ totalClasses: 0, scheduledClasses: 0, completedClasses: 0, totalCapacity: 0 })
    const [isLoading, setIsLoading] = useState(true)
    const [deletingId, setDeletingId] = useState<string | null>(null)

    // Dialog
    const [dialogOpen, setDialogOpen] = useState(false)
    const [editingClass, setEditingClass] = useState<ClassSession | null>(null)
    const [formData, setFormData] = useState<ClassFormData>(defaultFormData)
    const [isSaving, setIsSaving] = useState(false)

    // Bulk scheduling
    const [scheduleMode, setScheduleMode] = useState<"single" | "multi">("single")
    const [bulkDates, setBulkDates] = useState<string[]>([])
    const [pickerMonth, setPickerMonth] = useState<Date>(() => startOfMonth(new Date()))
    const [bulkProgress, setBulkProgress] = useState<{ done: number; total: number } | null>(null)

    const agendaScrollRef = useRef<HTMLDivElement>(null)

    // ── data loading ──
    const loadMonth = useCallback(async (month: Date, withStats = false) => {
        const { start, end } = gridRange(month)
        try {
            const [items, stats] = await Promise.all([
                getAdminClassesInRange(start, end),
                withStats ? getClassStats() : Promise.resolve(null),
            ])
            setMonthClasses(items)
            if (stats) setClassStats(stats)
        } catch {
            toast.error("Failed to load classes")
        } finally {
            setIsLoading(false)
        }
    }, [])

    useEffect(() => {
        getTrainers().then(setTrainers).catch(() => {})
        getClassStats().then(setClassStats).catch(() => {})
    }, [])

    useEffect(() => {
        setIsLoading(true)
        loadMonth(viewMonth)
    }, [viewMonth, loadMonth])

    // group by day for the mini-calendar + agenda
    const classesByDay = useMemo(() => {
        const map = new Map<string, ClassSession[]>()
        for (const c of monthClasses) {
            const key = toYmd(new Date(c.date))
            const arr = map.get(key)
            if (arr) arr.push(c)
            else map.set(key, [c])
        }
        return map
    }, [monthClasses])

    const selectedDayClasses = useMemo(() => {
        const list = classesByDay.get(toYmd(selectedDate)) || []
        return [...list].sort((a, b) => (a.startTime || "").localeCompare(b.startTime || ""))
    }, [classesByDay, selectedDate])

    const positioned = useMemo(() => layoutDay(selectedDayClasses), [selectedDayClasses])

    // auto-scroll agenda to the first class (or 7:30am) whenever the day changes
    useEffect(() => {
        const el = agendaScrollRef.current
        if (!el) return
        const firstStart = selectedDayClasses.length ? timeToMinutes(selectedDayClasses[0].startTime) : 7.5 * 60
        el.scrollTo({ top: Math.max(0, minutesToY(firstStart) - 24), behavior: "smooth" })
    }, [selectedDate, selectedDayClasses])

    const cells = useMemo(() => {
        const { start } = gridRange(viewMonth)
        return Array.from({ length: 42 }, (_, i) => {
            const d = new Date(start)
            d.setDate(start.getDate() + i)
            return d
        })
    }, [viewMonth])

    const hours = useMemo(
        () => Array.from({ length: DAY_END_HOUR - DAY_START_HOUR + 1 }, (_, i) => DAY_START_HOUR + i),
        [],
    )

    const nowMinutes = today.getHours() * 60 + today.getMinutes()
    const showNowLine = isSameDay(selectedDate, today) && nowMinutes >= DAY_START_HOUR * 60 && nowMinutes <= DAY_END_HOUR * 60

    // ── CRUD ──
    const refresh = async () => {
        await loadMonth(viewMonth, true)
    }

    const openAddDialog = (date: Date = selectedDate) => {
        setEditingClass(null)
        setFormData({ ...defaultFormData, date: toYmd(date), trainerId: trainers[0]?.id || "" })
        setScheduleMode("single")
        setBulkDates([toYmd(date)])
        setPickerMonth(startOfMonth(date))
        setDialogOpen(true)
    }

    const openEditDialog = (cls: ClassSession) => {
        setEditingClass(cls)
        setScheduleMode("single") // editing is always single-day
        setFormData({
            trainerId: cls.trainerId || "",
            date: toYmd(new Date(cls.date)),
            startTime: cls.startTime || "09:00",
            duration: cls.duration || 50,
            capacity: cls.totalSpots || cls.capacity || 10,
            classType: cls.classType || "Sol Flow",
            difficultyLevel: cls.difficultyLevel || "intermediate",
            location: cls.location || "Main Studio",
            description: cls.description || "",
        })
        setDialogOpen(true)
    }

    const handleDelete = async (classId: string) => {
        setDeletingId(classId)
        try {
            await callDeleteClass(classId, "Canceled by admin")
            await refresh()
            toast.success("Class removed")
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to delete class")
        } finally {
            setDeletingId(null)
        }
    }

    const basePayload = () => ({
        trainerId: formData.trainerId,
        startTime: formData.startTime,
        duration: formData.duration,
        capacity: formData.capacity,
        classType: formData.classType,
        difficultyLevel: formData.difficultyLevel,
        location: formData.location,
        description: formData.description,
        totalSpots: formData.capacity,
    })

    const jumpTo = (ymd: string) => {
        const d = new Date(ymd + "T00:00:00")
        setViewMonth(startOfMonth(d))
        setSelectedDate(d)
    }

    const handleSave = async () => {
        if (!formData.trainerId) return toast.error("Please select a trainer")

        const isBulk = !editingClass && scheduleMode === "multi"

        if (isBulk) {
            if (bulkDates.length === 0) return toast.error("Select at least one day")
            const dates = [...bulkDates].sort()
            setIsSaving(true)
            let ok = 0
            const failed: string[] = []
            for (let i = 0; i < dates.length; i++) {
                setBulkProgress({ done: i, total: dates.length })
                try {
                    await callCreateClass({ ...basePayload(), date: dates[i] })
                    ok++
                } catch {
                    failed.push(fmtChip(dates[i]))
                }
            }
            setBulkProgress(null)
            setIsSaving(false)

            if (ok > 0) {
                toast.success(`${ok} ${ok === 1 ? "class" : "classes"} scheduled`, {
                    description: failed.length ? `Skipped ${failed.length}: ${failed.join(", ")}` : undefined,
                })
                setDialogOpen(false)
                jumpTo(dates[0])
                await refresh()
            } else {
                toast.error("Could not schedule any classes. Please try again.")
            }
            return
        }

        // ── single create / edit ──
        if (!formData.date) return toast.error("Please select a date")
        setIsSaving(true)
        try {
            if (editingClass) {
                await callUpdateClass({ classId: editingClass.id, date: formData.date, ...basePayload() })
                toast.success("Class updated")
            } else {
                await callCreateClass({ ...basePayload(), date: formData.date })
                toast.success("Class created")
                jumpTo(formData.date)
            }
            setDialogOpen(false)
            await refresh()
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : "Failed to save class")
        } finally {
            setIsSaving(false)
        }
    }

    const getTrainerName = (id: string) => trainers.find((t) => t.id === id)?.name || "Unassigned"

    const monthClassCount = monthClasses.filter((c) => new Date(c.date).getMonth() === viewMonth.getMonth()).length

    const isBulkMode = !editingClass && scheduleMode === "multi"
    const submitLabel = bulkProgress
        ? `Creating ${bulkProgress.done + 1} of ${bulkProgress.total}…`
        : editingClass
            ? "Update Class"
            : isBulkMode
                ? `Create ${bulkDates.length || ""} ${bulkDates.length === 1 ? "Class" : "Classes"}`.replace(/\s+/g, " ").trim()
                : "Create Class"

    // ═══════════════════════════════════════════════════════════════════════
    return (
        <div className="space-y-7 max-w-[1600px] mx-auto pb-20 lg:pb-0">
            {/* ── Header ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-peach-400/20"
            >
                <div>
                    <h2 className="app-page-title mb-2">Schedule</h2>
                    <p className="app-page-subtitle">
                        Your studio&rsquo;s calendar. Pick a day to see its run of classes, hour by hour.
                    </p>
                </div>
                <button
                    onClick={() => openAddDialog()}
                    className="px-6 py-3.5 bg-terra-400 text-peach-50 font-bold text-xs tracking-[0.2em] uppercase hover:bg-terra-300 transition-all flex items-center gap-2.5 w-fit hover:shadow-lg hover:shadow-terra-400/15 active:scale-[0.98]"
                >
                    <Plus className="w-4 h-4" />
                    Add Class
                </button>
            </motion.div>

            {/* ── Stats ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
                className="grid grid-cols-2 lg:grid-cols-4 gap-4"
            >
                {[
                    { label: "Total Classes", value: classStats.totalClasses, icon: Dumbbell },
                    { label: "Scheduled", value: classStats.scheduledClasses, icon: CalendarDays },
                    { label: "Completed", value: classStats.completedClasses, icon: CheckCircle2 },
                    { label: "Total Capacity", value: classStats.totalCapacity, icon: Users },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="group relative overflow-hidden bg-peach-50 border border-peach-400/20 p-5 hover:border-terra-400/30 transition-all duration-500"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-terra-400/5 rounded-full blur-2xl -mr-12 -mt-12 opacity-0 group-hover:opacity-100 transition-opacity duration-500" />
                        <stat.icon className="w-5 h-5 text-olive-300 mb-3 group-hover:text-terra-400 transition-colors" />
                        <p className="app-stat-value">{stat.value.toLocaleString()}</p>
                        <p className="app-stat-label mt-1">{stat.label}</p>
                    </div>
                ))}
            </motion.div>

            {/* ── Calendar workspace ── */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.16 }}
                className="flex flex-col lg:flex-row gap-6 items-start"
            >
                {/* ───── LEFT: month mini-calendar ───── */}
                <div className="w-full lg:w-[336px] flex-shrink-0 bg-peach-50 border border-peach-400/20">
                    {/* month nav */}
                    <div className="flex items-center justify-between px-5 pt-5 pb-4">
                        <div>
                            <p className="app-kicker mb-1">{viewMonth.getFullYear()}</p>
                            <h3 className="font-display text-2xl font-black text-olive-600 leading-none">
                                {MONTHS[viewMonth.getMonth()]}
                            </h3>
                        </div>
                        <div className="flex items-center gap-1">
                            <button
                                onClick={() => setViewMonth(addMonths(viewMonth, -1))}
                                className="w-9 h-9 flex items-center justify-center text-olive-400 hover:text-terra-400 hover:bg-peach-200/50 transition-all"
                                aria-label="Previous month"
                            >
                                <ChevronLeft className="w-4 h-4" />
                            </button>
                            <button
                                onClick={() => setViewMonth(addMonths(viewMonth, 1))}
                                className="w-9 h-9 flex items-center justify-center text-olive-400 hover:text-terra-400 hover:bg-peach-200/50 transition-all"
                                aria-label="Next month"
                            >
                                <ChevronRight className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* weekday header */}
                    <div className="grid grid-cols-7 px-3">
                        {WEEKDAYS.map((d) => (
                            <div key={d} className="text-center text-[10px] font-bold uppercase tracking-[0.1em] text-olive-300/70 py-2">
                                {d[0]}
                            </div>
                        ))}
                    </div>

                    {/* day grid */}
                    <div className="grid grid-cols-7 px-3 pb-3 gap-0.5">
                        {cells.map((d, i) => {
                            const inMonth = d.getMonth() === viewMonth.getMonth()
                            const dayClasses = classesByDay.get(toYmd(d)) || []
                            const selected = isSameDay(d, selectedDate)
                            const isToday = isSameDay(d, today)
                            const types = Array.from(new Set(dayClasses.map((c) => c.classType))).slice(0, 3)
                            return (
                                <button
                                    key={i}
                                    onClick={() => setSelectedDate(new Date(d))}
                                    className={`relative aspect-square flex flex-col items-center justify-center gap-1 transition-all duration-200
                                        ${selected
                                            ? "bg-terra-400 text-peach-50"
                                            : inMonth
                                                ? "text-olive-600 hover:bg-peach-200/60"
                                                : "text-olive-300/35 hover:bg-peach-100"}`}
                                >
                                    <span
                                        className={`text-sm leading-none font-semibold
                                            ${selected ? "" : isToday ? "text-terra-400 font-black" : ""}`}
                                    >
                                        {d.getDate()}
                                    </span>
                                    {/* class indicators */}
                                    <div className="flex items-center gap-0.5 h-1.5">
                                        {types.map((t) => (
                                            <span
                                                key={t}
                                                className="w-1.5 h-1.5 rounded-full"
                                                style={{ backgroundColor: selected ? "rgba(250,243,235,0.9)" : typeTheme(t).accent }}
                                            />
                                        ))}
                                    </div>
                                    {/* today ring */}
                                    {isToday && !selected && (
                                        <span className="absolute inset-1 ring-1 ring-terra-400/40 pointer-events-none" />
                                    )}
                                </button>
                            )
                        })}
                    </div>

                    {/* footer: today + month summary */}
                    <div className="px-5 py-4 border-t border-peach-400/15 flex items-center justify-between">
                        <button
                            onClick={() => {
                                const now = new Date()
                                setViewMonth(startOfMonth(now))
                                setSelectedDate(now)
                            }}
                            className="text-[11px] font-bold uppercase tracking-[0.15em] text-terra-400 hover:text-terra-500 transition-colors flex items-center gap-1.5"
                        >
                            <Sparkles className="w-3.5 h-3.5" />
                            Today
                        </button>
                        <span className="text-[11px] text-olive-300 tracking-wide">
                            {monthClassCount} {monthClassCount === 1 ? "class" : "classes"} this month
                        </span>
                    </div>

                    {/* legend */}
                    <div className="px-5 py-4 border-t border-peach-400/15 space-y-2.5">
                        <p className="app-label">Class Types</p>
                        <div className="grid grid-cols-2 gap-y-2 gap-x-3">
                            {Object.entries(TYPE_THEME).map(([name, theme]) => (
                                <div key={name} className="flex items-center gap-2">
                                    <span className="w-2.5 h-2.5 rounded-full flex-shrink-0" style={{ backgroundColor: theme.accent }} />
                                    <span className="text-xs text-olive-400 truncate">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ───── RIGHT: day agenda ───── */}
                <div className="flex-1 min-w-0 w-full bg-peach-50 border border-peach-400/20 flex flex-col">
                    {/* agenda header */}
                    <div className="flex items-center justify-between px-6 py-5 border-b border-peach-400/15">
                        <div className="min-w-0">
                            <p className="app-kicker mb-1.5">
                                {selectedDate.toLocaleDateString("en-US", { weekday: "long" })}
                                {isSameDay(selectedDate, today) && <span className="text-olive-300 ml-2 normal-case tracking-normal font-medium">· Today</span>}
                            </p>
                            <h3 className="font-display text-2xl md:text-3xl font-black text-olive-600 leading-none truncate">
                                {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}
                            </h3>
                        </div>
                        <div className="flex items-center gap-4 flex-shrink-0">
                            <div className="text-right hidden sm:block">
                                <p className="app-stat-value text-terra-400">{selectedDayClasses.length}</p>
                                <p className="app-stat-label">{selectedDayClasses.length === 1 ? "Class" : "Classes"}</p>
                            </div>
                            <button
                                onClick={() => openAddDialog(selectedDate)}
                                className="w-10 h-10 flex items-center justify-center bg-terra-400 text-peach-50 hover:bg-terra-300 transition-all active:scale-95"
                                aria-label="Add class on this day"
                            >
                                <Plus className="w-4 h-4" />
                            </button>
                        </div>
                    </div>

                    {/* agenda body */}
                    <div ref={agendaScrollRef} className="relative overflow-y-auto" style={{ maxHeight: 620 }}>
                        {isLoading ? (
                            <div className="flex items-center justify-center" style={{ height: 360 }}>
                                <Loader2 className="w-6 h-6 text-terra-400 animate-spin" />
                            </div>
                        ) : (
                            <AnimatePresence mode="wait">
                                <motion.div
                                    key={toYmd(selectedDate)}
                                    initial={{ opacity: 0, y: 8 }}
                                    animate={{ opacity: 1, y: 0 }}
                                    exit={{ opacity: 0 }}
                                    transition={{ duration: 0.2 }}
                                    className="relative px-4 py-3"
                                    style={{ height: GRID_HEIGHT + 24 }}
                                >
                                    {/* hour lines + labels */}
                                    {hours.map((h) => (
                                        <div key={h} className="absolute left-0 right-0 flex items-start" style={{ top: minutesToY(h * 60) + 12 }}>
                                            <span className="w-14 -translate-y-1/2 pr-3 text-right text-[10px] font-semibold uppercase tracking-wide text-olive-300/70">
                                                {fmtClock(h * 60, true)}
                                            </span>
                                            <div className="flex-1 border-t border-peach-400/12" />
                                        </div>
                                    ))}

                                    {/* now line */}
                                    {showNowLine && (
                                        <div className="absolute left-14 right-3 z-20 pointer-events-none" style={{ top: minutesToY(nowMinutes) + 12 }}>
                                            <div className="relative">
                                                <span className="absolute -left-1 -top-[3px] w-2 h-2 rounded-full bg-terra-500" />
                                                <div className="border-t-[1.5px] border-terra-500/70" />
                                            </div>
                                        </div>
                                    )}

                                    {/* events track */}
                                    <div className="absolute z-10" style={{ left: 56, right: 12, top: 12, bottom: 12 }}>
                                        {positioned.map((p) => {
                                            const theme = typeTheme(p.cls.classType)
                                            const top = minutesToY(p.start)
                                            const rawH = ((p.end - p.start) / 60) * HOUR_PX
                                            const height = Math.max(rawH - 4, 44)
                                            const canceled = p.cls.status === "canceled"
                                            const completed = p.cls.status === "completed"
                                            const widthPct = 100 / p.lanes
                                            const cap = p.cls.totalSpots || p.cls.capacity || 0
                                            const booked = p.cls.bookedCount || 0
                                            const isTight = height < 64
                                            return (
                                                <div
                                                    key={p.cls.id}
                                                    className="absolute"
                                                    style={{
                                                        top,
                                                        height,
                                                        left: `${p.lane * widthPct}%`,
                                                        width: `calc(${widthPct}% - 6px)`,
                                                    }}
                                                >
                                                    <button
                                                        onClick={() => openEditDialog(p.cls)}
                                                        className={`group relative h-full w-full text-left overflow-hidden transition-all duration-200 hover:shadow-md hover:-translate-y-px ${canceled ? "opacity-55" : ""}`}
                                                        style={{
                                                            background: completed ? "rgba(138,148,122,0.10)" : theme.soft,
                                                            borderLeft: `3px solid ${completed ? "#8A947A" : theme.accent}`,
                                                        }}
                                                    >
                                                        <div className={`h-full ${isTight ? "px-2.5 py-1.5" : "p-2.5"} flex flex-col`}>
                                                            <div className="flex items-start justify-between gap-2">
                                                                <div className="min-w-0">
                                                                    <p
                                                                        className={`font-bold text-[13px] leading-tight truncate ${canceled ? "line-through" : ""}`}
                                                                        style={{ color: completed ? "#566044" : theme.text }}
                                                                    >
                                                                        {p.cls.classType || "Class"}
                                                                    </p>
                                                                    <p className="text-[11px] text-olive-400 leading-tight mt-0.5 truncate">
                                                                        {fmtClock(p.start)} – {fmtClock(p.end)}
                                                                    </p>
                                                                </div>
                                                                {!isTight && (
                                                                    <span
                                                                        className="flex-shrink-0 text-[10px] font-bold tabular-nums px-1.5 py-0.5"
                                                                        style={{ color: theme.text, background: "rgba(255,255,255,0.5)" }}
                                                                    >
                                                                        {booked}/{cap}
                                                                    </span>
                                                                )}
                                                            </div>

                                                            {!isTight && (
                                                                <div className="mt-auto flex items-center justify-between gap-2 pt-1">
                                                                    <span className="text-[11px] text-olive-400 truncate flex items-center gap-1.5">
                                                                        <span className="w-1 h-1 rounded-full bg-olive-300" />
                                                                        {getTrainerName(p.cls.trainerId)}
                                                                    </span>
                                                                    {p.cls.location && height >= 84 && (
                                                                        <span className="text-[10px] text-olive-300 truncate hidden sm:flex items-center gap-1">
                                                                            <MapPin className="w-2.5 h-2.5" />
                                                                            {p.cls.location}
                                                                        </span>
                                                                    )}
                                                                </div>
                                                            )}
                                                        </div>

                                                        {/* hover quick-delete */}
                                                        <span
                                                            role="button"
                                                            tabIndex={0}
                                                            onClick={(e) => {
                                                                e.stopPropagation()
                                                                handleDelete(p.cls.id)
                                                            }}
                                                            className="absolute top-1 right-1 w-6 h-6 hidden group-hover:flex items-center justify-center bg-peach-50/90 text-olive-300 hover:text-red-500 transition-colors"
                                                            aria-label="Delete class"
                                                        >
                                                            {deletingId === p.cls.id ? (
                                                                <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                                            ) : (
                                                                <Trash2 className="w-3.5 h-3.5" />
                                                            )}
                                                        </span>
                                                    </button>
                                                </div>
                                            )
                                        })}
                                    </div>

                                    {/* empty state */}
                                    {selectedDayClasses.length === 0 && (
                                        <div className="absolute inset-x-0 z-10 flex flex-col items-center justify-center text-center px-6" style={{ top: 120 }}>
                                            <div className="w-14 h-14 bg-peach-200/50 flex items-center justify-center mb-4">
                                                <CalendarDays className="w-7 h-7 text-olive-300/40" />
                                            </div>
                                            <p className="text-olive-600 font-bold mb-1">A clear day</p>
                                            <p className="text-olive-300 text-sm mb-5 max-w-xs">
                                                No classes scheduled for {MONTHS[selectedDate.getMonth()]} {selectedDate.getDate()}.
                                            </p>
                                            <button
                                                onClick={() => openAddDialog(selectedDate)}
                                                className="px-5 py-2.5 bg-terra-400/10 text-terra-500 font-bold text-xs tracking-[0.15em] uppercase hover:bg-terra-400/20 transition-all flex items-center gap-2"
                                            >
                                                <Plus className="w-3.5 h-3.5" />
                                                Schedule a class
                                            </button>
                                        </div>
                                    )}
                                </motion.div>
                            </AnimatePresence>
                        )}
                    </div>
                </div>
            </motion.div>

            {/* ═══════════ ADD / EDIT CLASS DIALOG ═══════════ */}
            <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
                <DialogContent className="bg-peach-50 border-peach-400/20 max-w-xl max-h-[90vh] overflow-y-auto overflow-x-hidden">
                    <DialogHeader>
                        <DialogTitle className="app-section-title">
                            {editingClass ? "Edit Class" : "Add New Class"}
                        </DialogTitle>
                        <DialogDescription className="text-olive-300 text-sm">
                            {editingClass ? "Update the class details below." : "Fill in the details to schedule a new class."}
                        </DialogDescription>
                    </DialogHeader>

                    <div className="space-y-5 mt-2">
                        {/* Class Type */}
                        <div>
                            <label className="block app-label mb-2">Class Type</label>
                            <select
                                value={formData.classType}
                                onChange={(e) => {
                                    const selected = CLASS_TYPES.find((ct) => ct.name === e.target.value)
                                    setFormData((prev) => ({
                                        ...prev,
                                        classType: e.target.value,
                                        description: selected?.description || prev.description,
                                        duration: selected?.duration || prev.duration,
                                        startTime: selected?.timeSlots[0] || prev.startTime,
                                    }))
                                }}
                                className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:bg-peach-50 focus:outline-none appearance-none cursor-pointer transition-all text-sm"
                            >
                                {CLASS_TYPES.map((ct) => (
                                    <option key={ct.name} value={ct.name}>{ct.name}</option>
                                ))}
                            </select>
                            <p className="mt-1.5 text-xs text-olive-300/60 italic">
                                {CLASS_TYPES.find((ct) => ct.name === formData.classType)?.description}
                            </p>
                        </div>

                        {/* Trainer */}
                        <div>
                            <label className="block app-label mb-2">Trainer</label>
                            <select
                                value={formData.trainerId}
                                onChange={(e) => setFormData((prev) => ({ ...prev, trainerId: e.target.value }))}
                                className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none appearance-none cursor-pointer transition-all text-sm"
                            >
                                <option value="">Select a trainer...</option>
                                {trainers.map((t) => (
                                    <option key={t.id} value={t.id}>{t.name}</option>
                                ))}
                            </select>
                        </div>

                        {/* Schedule mode toggle (new classes only) */}
                        {!editingClass && (
                            <div>
                                <label className="block app-label mb-2">Schedule</label>
                                <div className="inline-flex w-full bg-peach-200/40 p-1 border border-peach-400/15">
                                    <button
                                        type="button"
                                        onClick={() => setScheduleMode("single")}
                                        className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-all flex items-center justify-center gap-2 ${scheduleMode === "single" ? "bg-peach-50 text-olive-600 shadow-sm" : "text-olive-400 hover:text-olive-600"}`}
                                    >
                                        <CalendarPlus className="w-3.5 h-3.5" />
                                        Single day
                                    </button>
                                    <button
                                        type="button"
                                        onClick={() => {
                                            setScheduleMode("multi")
                                            if (bulkDates.length === 0 && formData.date) setBulkDates([formData.date])
                                        }}
                                        className={`flex-1 py-2 text-[11px] font-bold uppercase tracking-[0.12em] transition-all flex items-center justify-center gap-2 ${scheduleMode === "multi" ? "bg-peach-50 text-olive-600 shadow-sm" : "text-olive-400 hover:text-olive-600"}`}
                                    >
                                        <CalendarRange className="w-3.5 h-3.5" />
                                        Multiple days
                                    </button>
                                </div>
                            </div>
                        )}

                        {/* Date + Time — single mode */}
                        {!isBulkMode ? (
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <label className="block app-label mb-2">Date</label>
                                    <input
                                        type="date"
                                        value={formData.date}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, date: e.target.value }))}
                                        className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none transition-all text-sm"
                                    />
                                </div>
                                <div>
                                    <label className="block app-label mb-2">Start Time</label>
                                    <select
                                        value={formData.startTime}
                                        onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                                        className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none appearance-none cursor-pointer transition-all text-sm"
                                    >
                                        {(CLASS_TYPES.find((ct) => ct.name === formData.classType)?.timeSlots ?? []).map((slot) => {
                                            const [h, m] = slot.split(":")
                                            const hour = parseInt(h, 10)
                                            const ampm = hour >= 12 ? "PM" : "AM"
                                            const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                                            return <option key={slot} value={slot}>{`${displayHour}:${m} ${ampm}`}</option>
                                        })}
                                    </select>
                                </div>
                            </div>
                        ) : (
                            /* Date + Time — bulk mode */
                            <div className="space-y-4">
                                <div className="grid grid-cols-2 gap-4 items-end">
                                    <div>
                                        <label className="block app-label mb-2">Start Time</label>
                                        <select
                                            value={formData.startTime}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, startTime: e.target.value }))}
                                            className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none appearance-none cursor-pointer transition-all text-sm"
                                        >
                                            {(CLASS_TYPES.find((ct) => ct.name === formData.classType)?.timeSlots ?? []).map((slot) => {
                                                const [h, m] = slot.split(":")
                                                const hour = parseInt(h, 10)
                                                const ampm = hour >= 12 ? "PM" : "AM"
                                                const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour
                                                return <option key={slot} value={slot}>{`${displayHour}:${m} ${ampm}`}</option>
                                            })}
                                        </select>
                                    </div>
                                    <p className="text-xs text-olive-300 leading-relaxed pb-3">
                                        This time, trainer &amp; type apply to <span className="text-olive-500 font-semibold">every</span> selected day.
                                    </p>
                                </div>
                                <div>
                                    <label className="block app-label mb-2">Select Days</label>
                                    <MultiDatePicker
                                        value={bulkDates}
                                        onChange={setBulkDates}
                                        month={pickerMonth}
                                        onMonthChange={setPickerMonth}
                                        existingDays={new Set(classesByDay.keys())}
                                    />
                                </div>
                            </div>
                        )}

                        {/* Duration + Capacity */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block app-label mb-2">Duration (min)</label>
                                <input
                                    type="number"
                                    value={formData.duration}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, duration: parseInt(e.target.value) || 50 }))}
                                    min={15}
                                    max={180}
                                    className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none transition-all text-sm"
                                />
                            </div>
                            <div>
                                <label className="block app-label mb-2">Capacity (spots)</label>
                                <input
                                    type="number"
                                    value={formData.capacity}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, capacity: parseInt(e.target.value) || 10 }))}
                                    min={1}
                                    max={10}
                                    className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none transition-all text-sm"
                                />
                            </div>
                        </div>

                        {/* Difficulty + Location */}
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="block app-label mb-2">Difficulty</label>
                                <select
                                    value={formData.difficultyLevel}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, difficultyLevel: e.target.value as ClassFormData["difficultyLevel"] }))}
                                    className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none appearance-none cursor-pointer transition-all text-sm capitalize"
                                >
                                    {DIFFICULTY_LEVELS.map((level) => (
                                        <option key={level} value={level} className="capitalize">{level}</option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="block app-label mb-2">Location</label>
                                <select
                                    value={formData.location}
                                    onChange={(e) => setFormData((prev) => ({ ...prev, location: e.target.value }))}
                                    className="w-full h-11 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:outline-none appearance-none cursor-pointer transition-all text-sm"
                                >
                                    {LOCATIONS.map((loc) => (
                                        <option key={loc} value={loc}>{loc}</option>
                                    ))}
                                </select>
                            </div>
                        </div>

                        {/* Description */}
                        <div>
                            <label className="block app-label mb-2">Description (optional)</label>
                            <textarea
                                value={formData.description}
                                onChange={(e) => setFormData((prev) => ({ ...prev, description: e.target.value }))}
                                placeholder="Brief description of the class..."
                                rows={3}
                                className="w-full px-4 py-3 bg-peach-200/30 border border-peach-400/15 text-olive-600 placeholder:text-olive-300/40 focus:border-terra-400/50 focus:outline-none transition-all text-sm resize-none"
                            />
                        </div>

                        {/* Actions */}
                        <div className="flex items-center justify-end gap-3 pt-2">
                            <button
                                onClick={() => setDialogOpen(false)}
                                className="px-5 py-2.5 text-olive-400 font-bold text-xs tracking-[0.15em] uppercase hover:bg-peach-200/50 transition-all"
                            >
                                Cancel
                            </button>
                            <button
                                onClick={handleSave}
                                disabled={isSaving || (isBulkMode && bulkDates.length === 0)}
                                className="px-6 py-2.5 bg-terra-400 text-peach-50 font-bold text-xs tracking-[0.15em] uppercase hover:bg-terra-300 transition-all flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed hover:shadow-lg hover:shadow-terra-400/15"
                            >
                                {isSaving && <Loader2 className="w-3.5 h-3.5 animate-spin" />}
                                {submitLabel}
                            </button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    )
}
