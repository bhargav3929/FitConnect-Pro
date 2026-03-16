"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import {
    MapPin,
    Clock,
    Phone,
    Mail,
    Filter,
    Star,
    ChevronLeft,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { ClassScheduleCard } from "@/components/user/ClassScheduleCard"
import { CalendarStrip } from "@/components/user/CalendarStrip"
import { SpotSelectionModal } from "@/components/user/SpotSelectionModal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Facility Data (single gym)
const FACILITY = {
    name: "SOL Pilates",
    address: "250 West 54th Street, New York, NY 10019",
    rating: 4.9,
    reviewCount: 128,
    description: "45,000 sq ft of dedicated training space with five distinct zones: Strength Floor, Heated Yoga Studio, Cycling Theater, Combat Zone, and Recovery Sanctuary.",
    amenities: ["Performance Floor", "Heated Yoga Studio", "Cycling Theater", "Olympic Lifting Platform", "Recovery Lounge", "Smoothie Bar", "Private Training Suites"],
    hours: {
        weekday: "05:00 - 23:00",
        weekend: "06:00 - 21:00"
    },
    contact: {
        phone: "(212) 555-0180",
        email: "hello@solpilates.com"
    },
}

// Mock Classes
const CLASSES = [
    {
        id: "c1",
        name: "Strength & Sculpt",
        time: "06:00",
        duration: "50 min",
        trainer: "Melinda H",
        trainerImage: "/trainer-1.jpg",
        capacity: 12,
        booked: 12,
        bookedSpots: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        type: "In-Studio",
        location: "Performance Floor",
        intensityLevel: 2 as 1 | 2 | 3
    },
    {
        id: "c2",
        name: "HIIT Burn",
        time: "07:00",
        duration: "45 min",
        trainer: "Mike J",
        trainerImage: "/trainer-3.jpg",
        capacity: 15,
        booked: 8,
        bookedSpots: [1, 3, 4, 5, 8, 9, 10, 12],
        type: "In-Studio",
        location: "Performance Floor",
        intensityLevel: 3 as 1 | 2 | 3
    },
    {
        id: "c3",
        name: "Morning Flow",
        time: "07:30",
        duration: "60 min",
        trainer: "Sarah C",
        trainerImage: "/trainer-2.jpg",
        capacity: 20,
        booked: 15,
        bookedSpots: [1, 2, 3, 5, 6, 7, 8, 10, 11, 12, 13, 15, 16, 18, 19],
        type: "In-Studio",
        location: "Heated Yoga Studio",
        intensityLevel: 1 as 1 | 2 | 3
    },
    {
        id: "c4",
        name: "Power Cycling",
        time: "09:00",
        duration: "45 min",
        trainer: "David R",
        trainerImage: "/trainer-1.jpg",
        capacity: 25,
        booked: 18,
        bookedSpots: [1, 2, 3, 4, 5, 7, 8, 9, 10, 12, 14, 15, 16, 18, 19, 20, 22, 24],
        type: "In-Studio",
        location: "Cycling Theater",
        intensityLevel: 2 as 1 | 2 | 3
    },
]

const TRAINERS = [
    { id: "t1", name: "Melinda H", role: "Head Coach", image: "/trainer-1.jpg" },
    { id: "t2", name: "Sarah Chen", role: "Yoga Lead", image: "/trainer-2.jpg" },
    { id: "t3", name: "Mike Johnson", role: "Boxing Coach", image: "/trainer-3.jpg" },
]

type FilterType = 'instructor' | 'classType' | 'rooms'

export default function SchedulePage() {
    const [selectedTab, setSelectedTab] = useState<'classes' | 'trainers' | 'info'>('classes')
    const [selectedDate, setSelectedDate] = useState(new Date())
    const [spotModalOpen, setSpotModalOpen] = useState(false)
    const [selectedClass, setSelectedClass] = useState<any>(null)
    const [activeFilters, setActiveFilters] = useState<FilterType[]>([])

    const formatDate = (date: Date) => {
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
        return `${date.getDate()} ${months[date.getMonth()]}`
    }

    const handleBook = (cls: any) => {
        setSelectedClass({
            id: cls.id,
            name: cls.name,
            date: formatDate(selectedDate),
            time: cls.time,
            duration: cls.duration,
            location: cls.location,
            instructor: cls.trainer,
            totalSpots: cls.capacity,
            bookedSpots: cls.bookedSpots || []
        })
        setSpotModalOpen(true)
    }

    const handleSpotConfirm = (spotNumber: number, isGuest: boolean) => {
        // Spot reservation handled by SpotSelectionModal
    }

    const toggleFilter = (filter: FilterType) => {
        setActiveFilters(prev =>
            prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
        )
    }

    return (
        <div className="pb-24 min-h-screen">
            <SpotSelectionModal
                isOpen={spotModalOpen}
                onClose={() => setSpotModalOpen(false)}
                classDetails={selectedClass}
                onConfirm={handleSpotConfirm}
            />

            {/* Facility Header */}
            <div className="mb-8">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                >
                    <div className="flex items-center gap-2 mb-3">
                        <span className="px-2 py-1 rounded-md bg-gold-400 text-forest-700 text-[10px] font-black uppercase tracking-wider">
                            FLAGSHIP
                        </span>
                        <div className="flex items-center gap-1 text-gold-300">
                            <Star className="w-3 h-3 fill-current" />
                            <span className="text-xs font-bold">{FACILITY.rating}</span>
                            <span className="text-sage-500 text-xs">({FACILITY.reviewCount})</span>
                        </div>
                    </div>
                    <h1 className="text-3xl md:text-4xl font-black text-sand-200 tracking-tighter mb-2 font-display">
                        Class Schedule
                    </h1>
                    <p className="text-sage-400 text-sm flex items-center gap-2">
                        <MapPin className="w-3 h-3 text-gold-400" />
                        {FACILITY.address}
                    </p>
                </motion.div>
            </div>

            {/* Tabs */}
            <div className="sticky top-0 z-30 bg-forest-700/80 backdrop-blur-xl border-b border-forest-600 -mx-4 lg:-mx-8 px-4 lg:px-8 py-4 overflow-x-auto mb-6">
                <div className="flex gap-2 min-w-max">
                    {[
                        { id: 'classes', label: 'Schedule' },
                        { id: 'trainers', label: 'Trainers' },
                        { id: 'info', label: 'Facility Info' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id as any)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all relative overflow-hidden ${selectedTab === tab.id
                                    ? 'bg-gold-400 text-forest-700 shadow-glow'
                                    : 'bg-sand-200/5 text-sage-500 hover:text-sand-200 hover:bg-sand-200/10'
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
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                <Filter className="w-4 h-4 text-sage-500 shrink-0" />
                                {[
                                    { id: 'instructor', label: 'Instructor' },
                                    { id: 'classType', label: 'Class Type' },
                                    { id: 'rooms', label: 'Room' },
                                ].map(filter => (
                                    <button
                                        key={filter.id}
                                        onClick={() => toggleFilter(filter.id as FilterType)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${activeFilters.includes(filter.id as FilterType)
                                                ? 'bg-gold-400/20 border-gold-400 text-gold-400'
                                                : 'bg-transparent border-forest-600 text-sage-500 hover:border-sand-200/20'
                                            }`}
                                    >
                                        {filter.label}
                                    </button>
                                ))}
                            </div>

                            {/* Classes List */}
                            <div className="space-y-3">
                                {CLASSES.map((cls, idx) => (
                                    <motion.div
                                        key={cls.id}
                                        initial={{ opacity: 0, y: 20 }}
                                        animate={{ opacity: 1, y: 0 }}
                                        transition={{ delay: idx * 0.1 }}
                                        onClick={() => handleBook(cls)}
                                        className="bg-forest-800 border border-forest-600 rounded-2xl p-4 active:scale-[0.98] transition-all cursor-pointer hover:bg-forest-800/80 group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-lg font-black text-sand-200 leading-none">{cls.time}</span>
                                                    <span className="text-[10px] text-sage-500 font-medium mt-1">{cls.duration}</span>
                                                </div>
                                                <div className="w-px h-10 bg-sand-200/10" />
                                                <div>
                                                    <h3 className="text-sand-200 font-bold group-hover:text-gold-400 transition-colors">{cls.name}</h3>
                                                    <p className="text-sage-500 text-xs flex items-center gap-1 mt-0.5">
                                                        {cls.location} · {cls.type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                {cls.capacity - cls.booked === 0 ? (
                                                    <span className="text-xs font-bold text-sand-200/20 uppercase tracking-wider">Full</span>
                                                ) : (
                                                    <span className="w-8 h-8 rounded-full bg-gold-400/20 flex items-center justify-center text-gold-400">
                                                        <ChevronLeft className="w-4 h-4 rotate-180" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-forest-600">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-6 h-6 border border-forest-600">
                                                    <AvatarImage src={cls.trainerImage} />
                                                    <AvatarFallback className="text-[8px] bg-sand-200/10 text-sand-200">{cls.trainer.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-sage-400 font-medium">{cls.trainer}</span>
                                            </div>
                                            {cls.capacity - cls.booked < 3 && cls.capacity - cls.booked > 0 && (
                                                <span className="text-[10px] text-gold-300 font-bold uppercase tracking-wider">
                                                    Only {cls.capacity - cls.booked} spots left
                                                </span>
                                            )}
                                        </div>
                                    </motion.div>
                                ))}
                            </div>
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
                            {TRAINERS.map((trainer) => (
                                <div key={trainer.id} className="relative aspect-[3/4] rounded-2xl overflow-hidden group">
                                    <div className="absolute inset-0 bg-gradient-to-t from-forest-950/80 via-transparent to-transparent z-10" />
                                    <div className="absolute inset-0 bg-sand-200/10 flex items-center justify-center text-sand-200/20 font-bold text-4xl">
                                        {trainer.image ? (
                                            <Image src={trainer.image} alt={trainer.name} fill className="object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : trainer.name.charAt(0)}
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                                        <h3 className="text-sand-200 font-bold leading-none mb-1">{trainer.name}</h3>
                                        <p className="text-gold-400 text-xs font-bold uppercase tracking-wider">{trainer.role}</p>
                                    </div>
                                </div>
                            ))}
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
                            <div className="bg-forest-800 rounded-2xl p-6 border border-forest-600">
                                <h3 className="text-sand-200 font-bold mb-3">About Our Facility</h3>
                                <p className="text-sage-400 text-sm leading-relaxed mb-4">{FACILITY.description}</p>
                                <h4 className="text-sand-200 font-bold mb-3 text-sm">Amenities</h4>
                                <div className="flex flex-wrap gap-2">
                                    {FACILITY.amenities.map(item => (
                                        <span key={item} className="px-3 py-1.5 rounded-lg bg-sand-200/5 text-sand-200/70 text-xs font-medium border border-forest-600">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-forest-800 rounded-2xl p-6 border border-forest-600">
                                <h3 className="text-sand-200 font-bold mb-4">Contact & Hours</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gold-400/20 flex items-center justify-center text-gold-400">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-sand-200/80">{FACILITY.contact.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gold-400/20 flex items-center justify-center text-gold-400">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-sand-200/80">{FACILITY.contact.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-gold-400/20 flex items-center justify-center text-gold-400">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col text-sm">
                                            <span className="text-sand-200/80">Mon-Fri: {FACILITY.hours.weekday}</span>
                                            <span className="text-sand-200/80">Sat-Sun: {FACILITY.hours.weekend}</span>
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
