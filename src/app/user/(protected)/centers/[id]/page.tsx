"use client"

import { useState } from "react"
import { motion, AnimatePresence } from "framer-motion"
import { useParams } from "next/navigation"
import {
    MapPin,
    Clock,
    Phone,
    Mail,
    Dumbbell,
    Calendar as CalendarIcon,
    ChevronLeft,
    CheckCircle2,
    Filter,
    Star,
    Share2,
    Heart
} from "lucide-react"
import { Button } from "@/components/ui/button"
import Link from "next/link"
import { ClassScheduleCard } from "@/components/user/ClassScheduleCard"
import { CalendarStrip } from "@/components/user/CalendarStrip"
import { SpotSelectionModal } from "@/components/user/SpotSelectionModal"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

// Mock Center Data
const CENTER_DATA = {
    id: "1",
    name: "Cedar Park",
    fullName: "FitPro Cedar Park",
    address: "123 Main St, Cedar Park, TX 78613",
    rating: 4.9,
    reviewCount: 128,
    description: "Experience the pinnacle of urban fitness in our flagship location. Featuring a rooftop studio, professional boxing ring, and recovery sanctuary.",
    facilities: ["Rooftop Studio", "Boxing Ring", "Cryotherapy", "Juice Bar", "Valet Parking"],
    hours: {
        weekday: "05:00 - 23:00",
        weekend: "06:00 - 21:00"
    },
    contact: {
        phone: "+1 (555) 123-4567",
        email: "cedarpark@fitpro.com"
    },
    image: "/center-hero.jpg" // Assuming this image exists or I'd use a placeholder color
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
        location: "Studio A",
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
        location: "Studio B",
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
        location: "Rooftop",
        intensityLevel: 1 as 1 | 2 | 3
    },
    {
        id: "c4",
        name: "Strength & Sculpt",
        time: "08:00",
        duration: "50 min",
        trainer: "Melinda H",
        trainerImage: "/trainer-1.jpg",
        capacity: 12,
        booked: 12,
        bookedSpots: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12],
        type: "In-Studio",
        location: "Studio A",
        intensityLevel: 2 as 1 | 2 | 3
    },
]

const TRAINERS = [
    { id: "t1", name: "Melinda H", role: "Head Coach", image: "/trainer-1.jpg" },
    { id: "t2", name: "Sarah Chen", role: "Yoga Lead", image: "/trainer-2.jpg" },
    { id: "t3", name: "Mike Johnson", role: "Boxing Coach", image: "/trainer-3.jpg" },
]

type FilterType = 'instructor' | 'classType' | 'rooms'

export default function CenterDetailPage() {
    const params = useParams()
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
        console.log(`Reserved spot ${spotNumber}`)
    }

    const toggleFilter = (filter: FilterType) => {
        setActiveFilters(prev =>
            prev.includes(filter) ? prev.filter(f => f !== filter) : [...prev, filter]
        )
    }

    return (
        <div className="pb-24 bg-[#0A0A0A] min-h-screen">
            <SpotSelectionModal
                isOpen={spotModalOpen}
                onClose={() => setSpotModalOpen(false)}
                classDetails={selectedClass}
                onConfirm={handleSpotConfirm}
            />

            {/* Premium Header with Parallax Feel (simulated with absolute) */}
            <div className="relative h-[40vh] min-h-[300px] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-b from-transparent via-[#0A0A0A]/50 to-[#0A0A0A] z-10" />
                {/* Background Image Placeholder or Real Image */}
                <div className="absolute inset-0 bg-[#1a1a1a] z-0">
                    <div className="absolute inset-0 bg-[url('/gym-bg-dark.jpg')] bg-cover bg-center opacity-50" />
                </div>

                {/* Top Nav */}
                <div className="absolute top-0 left-0 right-0 p-6 z-20 flex justify-between items-center">
                    <Link href="/user/centers" className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all">
                        <ChevronLeft className="w-5 h-5" />
                    </Link>
                    <div className="flex gap-3">
                        <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all">
                            <Share2 className="w-5 h-5" />
                        </button>
                        <button className="w-10 h-10 rounded-full bg-white/10 backdrop-blur-md flex items-center justify-center text-white hover:bg-white/20 transition-all">
                            <Heart className="w-5 h-5" />
                        </button>
                    </div>
                </div>

                {/* Hero Content */}
                <div className="absolute bottom-0 left-0 right-0 p-6 z-20">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <div className="flex items-center gap-2 mb-2">
                            <span className="px-2 py-1 rounded-md bg-[#7BA3A8] text-black text-[10px] font-black uppercase tracking-wider">
                                FLAGSHIP
                            </span>
                            <div className="flex items-center gap-1 text-[#F59E0B]">
                                <Star className="w-3 h-3 fill-current" />
                                <span className="text-xs font-bold">{CENTER_DATA.rating}</span>
                                <span className="text-white/40 text-xs">({CENTER_DATA.reviewCount})</span>
                            </div>
                        </div>
                        <h1 className="text-4xl md:text-5xl font-black text-white italic tracking-tighter mb-2">
                            {CENTER_DATA.name}
                        </h1>
                        <p className="text-white/60 text-sm flex items-center gap-2">
                            <MapPin className="w-3 h-3 text-[#7BA3A8]" />
                            {CENTER_DATA.address}
                        </p>
                    </motion.div>
                </div>
            </div>

            {/* Floating Tabs */}
            <div className="sticky top-0 z-30 bg-[#0A0A0A]/80 backdrop-blur-xl border-b border-white/5 px-6 py-4 overflow-x-auto">
                <div className="flex gap-2 min-w-max">
                    {[
                        { id: 'classes', label: 'Schedule' },
                        { id: 'trainers', label: 'Trainers' },
                        { id: 'info', label: 'Details' },
                    ].map((tab) => (
                        <button
                            key={tab.id}
                            onClick={() => setSelectedTab(tab.id as any)}
                            className={`px-6 py-2.5 rounded-full text-sm font-bold transition-all relative overflow-hidden ${selectedTab === tab.id
                                    ? 'bg-white text-black shadow-[0_0_20px_rgba(255,255,255,0.2)]'
                                    : 'bg-white/5 text-white/40 hover:text-white hover:bg-white/10'
                                }`}
                        >
                            {tab.label}
                        </button>
                    ))}
                </div>
            </div>

            <div className="px-4 lg:px-6 pt-6 min-h-[500px]">
                <AnimatePresence mode="wait">
                    {selectedTab === 'classes' && (
                        <motion.div
                            key="classes"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            className="space-y-6"
                        >
                            {/* Calendar Strip - Re-styled */}
                            <div className="mb-6">
                                <CalendarStrip
                                    selectedDate={selectedDate}
                                    onDateSelect={setSelectedDate}
                                />
                            </div>

                            {/* Filters */}
                            <div className="flex items-center gap-2 overflow-x-auto pb-2 scrollbar-none">
                                <Filter className="w-4 h-4 text-white/40 shrink-0" />
                                {[
                                    { id: 'instructor', label: 'Instructor' },
                                    { id: 'classType', label: 'Class Type' },
                                    { id: 'rooms', label: 'Room' },
                                ].map(filter => (
                                    <button
                                        key={filter.id}
                                        onClick={() => toggleFilter(filter.id as FilterType)}
                                        className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap border transition-all ${activeFilters.includes(filter.id as FilterType)
                                                ? 'bg-[#7BA3A8]/20 border-[#7BA3A8] text-[#7BA3A8]'
                                                : 'bg-transparent border-white/10 text-white/40 hover:border-white/20'
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
                                        className="bg-white/5 border border-white/5 rounded-2xl p-4 active:scale-[0.98] transition-all cursor-pointer hover:bg-white/10 group"
                                    >
                                        <div className="flex justify-between items-start mb-3">
                                            <div className="flex gap-4">
                                                <div className="flex flex-col items-center">
                                                    <span className="text-lg font-black text-white leading-none">{cls.time}</span>
                                                    <span className="text-[10px] text-white/40 font-medium mt-1">{cls.duration}</span>
                                                </div>
                                                <div className="w-px h-10 bg-white/10" />
                                                <div>
                                                    <h3 className="text-white font-bold group-hover:text-[#7BA3A8] transition-colors">{cls.name}</h3>
                                                    <p className="text-white/40 text-xs flex items-center gap-1 mt-0.5">
                                                        {cls.location} • {cls.type}
                                                    </p>
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end">
                                                {cls.capacity - cls.booked === 0 ? (
                                                    <span className="text-xs font-bold text-white/20 uppercase tracking-wider">Full</span>
                                                ) : (
                                                    <span className="w-8 h-8 rounded-full bg-[#7BA3A8]/20 flex items-center justify-center text-[#7BA3A8]">
                                                        <ChevronLeft className="w-4 h-4 rotate-180" />
                                                    </span>
                                                )}
                                            </div>
                                        </div>

                                        <div className="flex items-center justify-between pt-3 border-t border-white/5">
                                            <div className="flex items-center gap-2">
                                                <Avatar className="w-6 h-6 border border-white/10">
                                                    <AvatarImage src={cls.trainerImage} />
                                                    <AvatarFallback className="text-[8px] bg-white/10 text-white">{cls.trainer.charAt(0)}</AvatarFallback>
                                                </Avatar>
                                                <span className="text-xs text-white/60 font-medium">{cls.trainer}</span>
                                            </div>
                                            {cls.capacity - cls.booked < 3 && cls.capacity - cls.booked > 0 && (
                                                <span className="text-[10px] text-[#F59E0B] font-bold uppercase tracking-wider">
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
                                    <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-transparent z-10" />
                                    {/* Placeholder styling since no real image */}
                                    <div className="absolute inset-0 bg-white/10 flex items-center justify-center text-white/20 font-bold text-4xl">
                                        {trainer.image ? (
                                            // eslint-disable-next-line @next/next/no-img-element
                                            <img src={trainer.image} alt={trainer.name} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
                                        ) : trainer.name.charAt(0)}
                                    </div>
                                    <div className="absolute bottom-0 left-0 right-0 p-4 z-20">
                                        <h3 className="text-white font-bold leading-none mb-1">{trainer.name}</h3>
                                        <p className="text-[#7BA3A8] text-xs font-bold uppercase tracking-wider">{trainer.role}</p>
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
                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                <h3 className="text-white font-bold mb-4">Amenities</h3>
                                <div className="flex flex-wrap gap-2">
                                    {CENTER_DATA.facilities.map(item => (
                                        <span key={item} className="px-3 py-1.5 rounded-lg bg-white/5 text-white/70 text-xs font-medium border border-white/5">
                                            {item}
                                        </span>
                                    ))}
                                </div>
                            </div>

                            <div className="bg-white/5 rounded-2xl p-6 border border-white/5">
                                <h3 className="text-white font-bold mb-4">Contact & Hours</h3>
                                <div className="space-y-4">
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#7BA3A8]/20 flex items-center justify-center text-[#7BA3A8]">
                                            <Phone className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-white/80">{CENTER_DATA.contact.phone}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#7BA3A8]/20 flex items-center justify-center text-[#7BA3A8]">
                                            <Mail className="w-4 h-4" />
                                        </div>
                                        <span className="text-sm text-white/80">{CENTER_DATA.contact.email}</span>
                                    </div>
                                    <div className="flex items-center gap-3">
                                        <div className="w-8 h-8 rounded-lg bg-[#7BA3A8]/20 flex items-center justify-center text-[#7BA3A8]">
                                            <Clock className="w-4 h-4" />
                                        </div>
                                        <div className="flex flex-col text-sm">
                                            <span className="text-white/80">Mon-Fri: {CENTER_DATA.hours.weekday}</span>
                                            <span className="text-white/80">Sat-Sun: {CENTER_DATA.hours.weekend}</span>
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
