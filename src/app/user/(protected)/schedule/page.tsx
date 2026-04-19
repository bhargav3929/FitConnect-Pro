"use client"

import { useState, useEffect } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    MapPin,
    Clock,
    Phone,
    Mail,
    Filter,
    Star,
    ChevronLeft,
    Calendar,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { CalendarStrip } from "@/components/user/CalendarStrip"
import { SpotSelectionModal } from "@/components/user/SpotSelectionModal"
import { SubscriptionPromptModal } from "@/components/user/SubscriptionPromptModal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { subscribeToClassesByDate, getTrainers, callBookClass } from "@fitconnect/shared/firebase/firestore"
import { useClientAuthStore } from "@fitconnect/shared/stores/clientAuthStore"
import { ClassSession } from "@fitconnect/shared/types/class"
import { Trainer } from "@fitconnect/shared/types/trainer"
import { toast } from "sonner"

const FACILITY = {
    name: "SOL Pilates Studio",
    address: "250 West 54th Street, New York, NY 10019",
    rating: 4.9,
    reviewCount: 128,
    description: "A sophisticated Pilates studio blending strength, mindfulness, and elegance. Five dedicated disciplines — Reformer, Mat, Private Sessions, Barre, and Prenatal — each designed to transform your body and mind.",
    amenities: ["Reformer Studio", "Mat Studio", "Private Suite", "Barre & Stretch", "Recovery Lounge", "Prenatal Room", "Changing Rooms"],
    hours: {
        weekday: "06:00 - 21:00",
        weekend: "07:00 - 18:00"
    },
    contact: {
        phone: "(212) 555-0180",
        email: "solpilatesstudio.in@gmail.com"
    },
}

type FilterType = 'instructor' | 'classType' | 'rooms'

function hasValidSubscription(sub: { planId: unknown; status: string; endDate: unknown; classesRemaining: unknown } | undefined): boolean {
    if (!sub) return false
    if (!sub.planId) return false
    if (sub.status !== 'active') return false
    // Safe date parse — handles Date, Timestamp { seconds }, string
    let end: Date
    const raw = sub.endDate
    if (raw instanceof Date) { end = raw }
    else if (raw && typeof raw === 'object' && 'seconds' in (raw as Record<string, unknown>)) {
        end = new Date((raw as unknown as { seconds: number }).seconds * 1000)
    } else {
        end = raw ? new Date(raw as string) : new Date(0)
    }
    if (isNaN(end.getTime()) || end < new Date()) return false
    // classesRemaining === null means unlimited
    if (sub.classesRemaining !== null && (sub.classesRemaining as number) <= 0) return false
    return true
}

export default function SchedulePage() {
    const [selectedTab, setSelectedTab] = useState<'classes' | 'trainers' | 'info'>('classes')
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [spotModalOpen, setSpotModalOpen] = useState(false)
    const [subscriptionPromptOpen, setSubscriptionPromptOpen] = useState(false)
    const [pendingClassId, setPendingClassId] = useState<string | undefined>()
    const [selectedClass, setSelectedClass] = useState<{
        id: string
        name: string
        date: string
        time: string
        duration: string
        location: string
        instructor: string
        totalSpots: number
        bookedSpots: number[]
    } | null>(null)
    const [activeFilters, setActiveFilters] = useState<FilterType[]>([])
    const [selectedFilterValues, setSelectedFilterValues] = useState<Record<FilterType, string>>({
        instructor: '',
        classType: '',
        rooms: '',
    })
    const [classes, setClasses] = useState<ClassSession[]>([])
    const [trainers, setTrainers] = useState<Trainer[]>([])
    const [isLoadingClasses, setIsLoadingClasses] = useState(true)
    const [isLoadingTrainers, setIsLoadingTrainers] = useState(true)

    const clientUser = useClientAuthStore(state => state.clientUser)

    const formatDate = (date: Date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return `${date.getDate()} ${months[date.getMonth()]}`
    }

    useEffect(() => {
        setIsLoadingClasses(true)
        const unsub = subscribeToClassesByDate(selectedDate, (result) => {
            setClasses(result)
            setIsLoadingClasses(false)
        })
        return unsub
    }, [selectedDate])

    useEffect(() => {
        async function loadTrainers() {
            setIsLoadingTrainers(true)
            try {
                const result = await getTrainers()
                setTrainers(result)
            } catch {
                setTrainers([])
            } finally {
                setIsLoadingTrainers(false)
            }
        }
        loadTrainers()
    }, [])

    const handleBook = (cls: ClassSession) => {
        // Subscription gate — check BEFORE opening spot selection
        if (!hasValidSubscription(clientUser?.subscription)) {
            setPendingClassId(cls.id)
            setSubscriptionPromptOpen(true)
            return
        }

        const totalSpots = cls.totalSpots || cls.capacity || 12
        setSelectedClass({
            id: cls.id,
            name: cls.classType || 'Pilates Class',
            date: formatDate(selectedDate),
            time: cls.startTime,
            duration: `${cls.duration} min`,
            location: cls.location || 'Main Studio',
            instructor: trainers.find(t => t.id === cls.trainerId)?.name || 'Instructor',
            totalSpots,
            bookedSpots: cls.bookedSpots || []
        })
        setSpotModalOpen(true)
    }

    const refreshSubscription = useClientAuthStore(state => state.refreshSubscription)

    const handleSpotConfirm = async (spotNumber: number, isGuest: boolean) => {
        if (!selectedClass) return
        try {
            await callBookClass(selectedClass.id, spotNumber, isGuest)
            toast.success("Booking confirmed!", {
                description: `Spot ${spotNumber} reserved for ${selectedClass.name}`,
            })
            // subscribeToClassesByDate auto-refreshes spot counts; just refresh user credits.
            refreshSubscription()
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : "Failed to book class"
            toast.error("Booking failed", { description: message })
            throw err // Re-throw so SpotSelectionModal catches it and doesn't show success
        }
    }

    const toggleFilter = (filter: FilterType) => {
        setActiveFilters(prev => {
            if (prev.includes(filter)) {
                setSelectedFilterValues(v => ({ ...v, [filter]: '' }))
                return prev.filter(f => f !== filter)
            }
            return [...prev, filter]
        })
    }

    const selectFilterValue = (filter: FilterType, value: string) => {
        setSelectedFilterValues(prev => ({
            ...prev,
            [filter]: prev[filter] === value ? '' : value,
        }))
    }

    // Derive unique filter options from classes
    const uniqueClassTypes = [...new Set(classes.map(c => c.classType).filter(Boolean))] as string[]
    const uniqueRooms = [...new Set(classes.map(c => c.location).filter(Boolean))] as string[]
    const uniqueInstructors = [...new Set(classes.map(c => {
        const t = trainers.find(t => t.id === c.trainerId)
        return t ? t.name : null
    }).filter(Boolean))] as string[]

    // Apply filters to classes
    const filteredClasses = classes.filter(cls => {
        if (selectedFilterValues.classType && cls.classType !== selectedFilterValues.classType) return false
        if (selectedFilterValues.rooms && cls.location !== selectedFilterValues.rooms) return false
        if (selectedFilterValues.instructor) {
            const trainerName = trainers.find(t => t.id === cls.trainerId)?.name
            if (trainerName !== selectedFilterValues.instructor) return false
        }
        return true
    })

    const getTrainerName = (trainerId: string) => {
        return trainers.find(t => t.id === trainerId)?.name || 'Instructor'
    }

    const getTrainerImage = (trainerId: string) => {
        return trainers.find(t => t.id === trainerId)?.profilePictureUrl || ''
    }

    return (
        <div className="pb-24 min-h-screen">
            <SpotSelectionModal
                isOpen={spotModalOpen}
                onClose={() => setSpotModalOpen(false)}
                classDetails={selectedClass}
                onConfirm={handleSpotConfirm}
            />

            <SubscriptionPromptModal
                isOpen={subscriptionPromptOpen}
                onClose={() => setSubscriptionPromptOpen(false)}
                classId={pendingClassId}
            />

            {/* Facility Header */}
            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 rounded-md bg-terra-400 text-peach-50 text-[10px] font-black uppercase tracking-wider">
                            FLAGSHIP
                        </span>
                        <div className="flex items-center gap-1 text-terra-300">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs font-bold">{FACILITY.rating}</span>
                            <span className="text-olive-400 text-xs">({FACILITY.reviewCount})</span>
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-olive-600 tracking-tighter mb-2 font-display">
                        Class Schedule
                    </h1>
                    <p className="text-olive-300 text-sm flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-terra-400" />
                        {FACILITY.address}
                    </p>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className="sticky top-0 z-30 bg-peach-100/80 backdrop-blur-xl border-b border-peach-400/20 -mx-4 lg:-mx-8 px-4 lg:px-8 py-4 overflow-x-auto mb-6">
                <div className="flex gap-2 min-w-max">
                    {[
                        { id: 'classes', label: 'Schedule' },
                        { id: 'trainers', label: 'Trainers' },
                        { id: 'info', label: 'Facility Info' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id as 'classes' | 'trainers' | 'info')}
                            className={`px-6 py-3 rounded-full text-sm font-bold transition-all relative overflow-hidden ${selectedTab === tab.id
                                    ? 'bg-terra-400 text-peach-50 shadow-glow'
                                    : 'bg-peach-200/50 text-olive-400 hover:text-olive-600 hover:bg-peach-200/80'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="min-h-[500px]">
                <AnimatePresence mode="wait">
                    {selectedTab === 'classes' && (
                        <motion.div
                            key="classes"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Calendar Strip */}
                            <div className="mb-6">
                                <CalendarStrip
                                    selectedDate={selectedDate}
                                    onDateSelect={setSelectedDate}
                                />
                            </div>

                            {/* Filters */}
                            <div className="space-y-2">
                                <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                    <Filter className="w-4 h-4 text-olive-400 shrink-0" />
                                    {[
                                        { id: 'instructor', label: 'Instructor' },
                                        { id: 'classType', label: 'Class Type' },
                                        { id: 'rooms', label: 'Room' },
                                    ].map(filter => (
                                        <button
                                            key={filter.id}
                                            onClick={() => toggleFilter(filter.id as FilterType)}
                                            className={`px-4 py-2.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${activeFilters.includes(filter.id as FilterType)
                                                    ? 'bg-terra-400/20 border-terra-400 text-terra-400'
                                                    : 'bg-transparent border-peach-400/20 text-olive-400 hover:border-olive-300/30'
                                                }`}
                                        >
                                            {filter.label}
                                        </button>
                                    ))}
                                </div>

                                {/* Active filter value pills */}
                                {activeFilters.includes('instructor') && uniqueInstructors.length > 0 && (
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pl-6">
                                        {uniqueInstructors.map(name => (
                                            <button
                                                key={name}
                                                onClick={() => selectFilterValue('instructor', name)}
                                                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${selectedFilterValues.instructor === name
                                                        ? 'bg-terra-400 text-peach-50'
                                                        : 'bg-peach-200/50 text-olive-400 hover:bg-peach-200/80'
                                                    }`}
                                            >
                                                {name}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {activeFilters.includes('classType') && uniqueClassTypes.length > 0 && (
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pl-6">
                                        {uniqueClassTypes.map(type => (
                                            <button
                                                key={type}
                                                onClick={() => selectFilterValue('classType', type)}
                                                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${selectedFilterValues.classType === type
                                                        ? 'bg-terra-400 text-peach-50'
                                                        : 'bg-peach-200/50 text-olive-400 hover:bg-peach-200/80'
                                                    }`}
                                            >
                                                {type}
                                            </button>
                                        ))}
                                    </div>
                                )}
                                {activeFilters.includes('rooms') && uniqueRooms.length > 0 && (
                                    <div className="flex items-center gap-2 overflow-x-auto pb-1 scrollbar-none pl-6">
                                        {uniqueRooms.map(room => (
                                            <button
                                                key={room}
                                                onClick={() => selectFilterValue('rooms', room)}
                                                className={`px-3 py-1 rounded-full text-[11px] font-bold whitespace-nowrap transition-all ${selectedFilterValues.rooms === room
                                                        ? 'bg-terra-400 text-peach-50'
                                                        : 'bg-peach-200/50 text-olive-400 hover:bg-peach-200/80'
                                                    }`}
                                            >
                                                {room}
                                            </button>
                                        ))}
                                    </div>
                                )}
                            </div>

                            {/* Loading Skeletons */}
                            {isLoadingClasses && (
                                <div className="space-y-3">
                                    {[1, 2, 3, 4].map(i => (
                                        <div key={i} className="bg-peach-50 border border-peach-400/20 p-4 animate-pulse">
                                            <div className="flex justify-between items-start mb-3">
                                                <div className="flex gap-4">
                                                    <div className="flex flex-col items-center">
                                                        <div className="h-5 w-12 bg-peach-300/40 rounded" />
                                                        <div className="h-3 w-10 bg-peach-200/60 rounded mt-1" />
                                                    </div>
                                                    <div className="w-px h-10 bg-peach-400/20" />
                                                    <div>
                                                        <div className="h-5 w-32 bg-peach-300/40 rounded" />
                                                        <div className="h-3 w-40 bg-peach-200/60 rounded mt-1.5" />
                                                    </div>
                                                </div>
                                            </div>
                                            <div className="flex items-center justify-between pt-3 border-t border-peach-400/20">
                                                <div className="flex items-center gap-2">
                                                    <div className="w-6 h-6 rounded-full bg-peach-300/40" />
                                                    <div className="h-3 w-20 bg-peach-200/60 rounded" />
                                                </div>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Classes List */}
                            {!isLoadingClasses && filteredClasses.length > 0 && (
                                <div className="space-y-3">
                                    {filteredClasses.map((cls, idx) => {
                                        const totalSpots = cls.totalSpots || cls.capacity || 12
                                        const bookedCount = cls.bookedCount || 0
                                        const spotsLeft = totalSpots - bookedCount
                                        const trainerName = getTrainerName(cls.trainerId)
                                        const trainerImage = getTrainerImage(cls.trainerId)

                                        return (
                                            <motion.div
                                                key={cls.id}
                                                initial={{ opacity: 0, y: 20 }}
                                                animate={{ opacity: 1, y: 0 }}
                                                transition={{ delay: idx * 0.05 }}
                                                onClick={() => handleBook(cls)}
                                                className="bg-peach-50 border border-peach-400/20 p-4 active:scale-[0.98] transition-all cursor-pointer hover:border-terra-400/30 group"
                                            >
                                                <div className="flex justify-between items-start mb-3">
                                                    <div className="flex gap-4">
                                                        <div className="flex flex-col items-center">
                                                            <span className="text-lg font-black text-olive-600 leading-none">{cls.startTime}</span>
                                                            <span className="text-[10px] text-olive-300 font-medium mt-1">{cls.duration} min</span>
                                                        </div>
                                                        <div className="w-px h-10 bg-peach-400/20" />
                                                        <div>
                                                            <h3 className="text-olive-600 font-bold group-hover:text-terra-400 transition-colors">
                                                                {cls.classType || 'Pilates Class'}
                                                            </h3>
                                                            <p className="text-olive-300 text-xs flex items-center gap-1 mt-0.5">
                                                                {cls.location || 'Main Studio'} · In-Studio
                                                            </p>
                                                        </div>
                                                    </div>
                                                    <div className="flex flex-col items-end">
                                                        {spotsLeft === 0 ? (
                                                            <span className="text-xs font-bold text-olive-300/40 uppercase tracking-wider">Full</span>
                                                        ) : (
                                                            <span className="w-8 h-8 rounded-full bg-terra-400/20 flex items-center justify-center text-terra-400">
                                                                <ChevronLeft className="w-4 h-4 rotate-180" />
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>

                                                <div className="flex items-center justify-between pt-3 border-t border-peach-400/20">
                                                    <div className="flex items-center gap-2">
                                                        <Avatar className="w-6 h-6 border border-peach-400/20">
                                                            <AvatarImage src={trainerImage} />
                                                            <AvatarFallback className="text-[8px] bg-peach-200/50 text-olive-400">{trainerName.charAt(0)}</AvatarFallback>
                                                        </Avatar>
                                                        <span className="text-xs text-olive-400 font-medium">{trainerName}</span>
                                                    </div>
                                                    {spotsLeft < 3 && spotsLeft > 0 && (
                                                        <span className="text-[10px] text-terra-400 font-bold uppercase tracking-wider">
                                                            Only {spotsLeft} spots left
                                                        </span>
                                                    )}
                                                </div>
                                            </motion.div>
                                        )
                                    })}
                                </div>
                            )}

                            {/* Empty State */}
                            {!isLoadingClasses && filteredClasses.length === 0 && (
                                <div className="text-center py-20">
                                    <div className="w-16 h-16 bg-peach-200/50 rounded-full flex items-center justify-center mx-auto mb-4">
                                        <Calendar className="w-8 h-8 text-olive-300/40" />
                                    </div>
                                    <h3 className="text-lg font-bold text-olive-600">No classes scheduled</h3>
                                    <p className="text-olive-300 text-sm mt-2 max-w-xs mx-auto">
                                        There are no classes available on this date. Try selecting a different day.
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {selectedTab === 'trainers' && (
                        <motion.div
                            key="trainers"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="grid grid-cols-2 gap-4"
                        >
                            {isLoadingTrainers ? (
                                [1, 2, 3].map(i => (
                                    <div key={i} className="relative aspect-[3/4] rounded-2xl overflow-hidden bg-peach-50 border border-peach-400/20 animate-pulse">
                                        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                                            <div className="h-5 w-24 bg-peach-300/40 rounded" />
                                            <div className="h-3 w-16 bg-peach-200/60 rounded mt-2" />
                                        </div>
                                    </div>
                                ))
                            ) : trainers.length > 0 ? (
                                trainers.map((trainer) => (
                                    <div key={trainer.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden group">
                                        <div className="absolute inset-0 bg-gradient-to-t from-warmDark-900/80 via-transparent to-transparent z-10" />
                                        <div className="absolute inset-0 bg-peach-200/50 flex items-center justify-center text-olive-300 font-bold text-4xl">
                                            {trainer.profilePictureUrl ? (
                                                <Image src={trainer.profilePictureUrl} alt={trainer.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                            ) : trainer.name.charAt(0)}
                                        </div>
                                        <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                                            <h3 className="text-peach-50 font-bold leading-none mb-1">{trainer.name}</h3>
                                            <p className="text-terra-400 text-xs font-bold uppercase tracking-wider">
                                                {trainer.specialties?.[0] || 'Trainer'}
                                            </p>
                                        </div>
                                    </div>
                                ))
                            ) : (
                                <div className="col-span-2 text-center py-20">
                                    <p className="text-olive-300 text-sm">No trainers found</p>
                                </div>
                            )}
                        </motion.div>
                    )}

                    {selectedTab === 'info' && (
                        <motion.div
                            key="info"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            <div className="bg-peach-50 border border-peach-400/20 p-6">
                                <h3 className="text-olive-600 font-bold mb-3">About Our Facility</h3>
                                <p className="text-olive-300 text-sm leading-relaxed mb-4">{FACILITY.description}</p>
                                <h4 className="text-olive-600 font-bold mb-3 text-sm">Amenities</h4>
                                <div className="flex flex-wrap gap-2">
                                    {FACILITY.amenities.map(item => (
                                        <span key={item} className="px-3 py-1.5 bg-peach-200/50 text-olive-400 text-xs font-medium border border-peach-400/20">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-peach-50 border border-peach-400/20 p-6">
                                <h3 className="text-olive-600 font-bold mb-4">Contact & Hours</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-terra-400/20 flex items-center justify-center text-terra-400">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-olive-400">{FACILITY.contact.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-terra-400/20 flex items-center justify-center text-terra-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-olive-400">{FACILITY.contact.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 bg-terra-400/20 flex items-center justify-center text-terra-400">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col text-sm">
                                            <span className="text-olive-400">Mon-Fri: {FACILITY.hours.weekday}</span>
                                            <span className="text-olive-400">Sat-Sun: {FACILITY.hours.weekend}</span>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    )}
                </AnimatePresence>
            </div>
        </div>
    )
}
