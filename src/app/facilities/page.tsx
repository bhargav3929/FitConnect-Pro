"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, MapPin, Filter, Star, Clock } from "lucide-react"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import { useRouter } from "next/navigation"

// Mock Data (Shared/Cloned from centers/page.tsx to avoid dependency issues)
const ALL_CENTERS = [
    {
        id: "1",
        name: "FitPro Downtown",
        address: "123 Main St, New York, NY",
        image: "/images/gyms/fitpro-downtown.png",
        rating: 4.9,
        distance: 0.8,
        openNow: true,
        nextClassTime: "In 30 mins"
    },
    {
        id: "2",
        name: "FitPro Midtown",
        address: "456 Park Ave, New York, NY",
        image: "/images/gyms/fitpro-midtown.png",
        rating: 4.8,
        distance: 1.2,
        openNow: true,
        nextClassTime: "In 1 hour"
    },
    {
        id: "3",
        name: "FitPro Uptown",
        address: "789 Broadway, New York, NY",
        image: "/images/gyms/fitpro-uptown.png",
        rating: 4.7,
        distance: 3.5,
        openNow: false,
        nextClassTime: "Tomorrow"
    },
    {
        id: "4",
        name: "FitPro Brooklyn",
        address: "321 Atlantic Ave, Brooklyn, NY",
        image: "/images/gyms/fitpro-brooklyn.png",
        rating: 4.6,
        distance: 5.2,
        openNow: true,
        nextClassTime: "In 15 mins"
    },
    {
        id: "5",
        name: "FitPro Queens",
        address: "12 Queens Blvd, Queens, NY",
        image: "/images/gyms/fitpro-queens.png",
        rating: 4.5,
        distance: 8.4,
        openNow: true,
        nextClassTime: "In 45 mins"
    },
    {
        id: "6",
        name: "FitPro Chelsea",
        address: "234 W 23rd St, New York, NY",
        image: "/images/gyms/fitpro-chelsea.png",
        rating: 4.9,
        distance: 2.1,
        openNow: false,
        nextClassTime: "Tomorrow"
    }
]

export default function FacilitiesPage() {
    const router = useRouter();
    const [searchQuery, setSearchQuery] = useState("")
    const [sortBy, setSortBy] = useState<"distance" | "rating">("distance")

    // Filter and Sort Logic
    const filteredCenters = ALL_CENTERS
        .filter(center =>
            center.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
            center.address.toLowerCase().includes(searchQuery.toLowerCase())
        )
        .sort((a, b) => {
            if (sortBy === "distance") return a.distance - b.distance
            if (sortBy === "rating") return b.rating - a.rating
            return 0
        })

    const handleAction = () => {
        router.push("/subscription");
    }

    return (
        <div className="min-h-screen bg-black pt-28 pb-20 px-4 md:px-8">
            <div className="container mx-auto space-y-8">
                {/* Header */}
                <div className="text-center md:text-left">
                    <h1 className="text-3xl md:text-5xl font-black text-white tracking-tight mb-2">BROWSE FACILITIES</h1>
                    <p className="text-white/40 text-sm md:text-base max-w-2xl">
                        Discover our world-class training centers. Unlock unlimited access with our FitPro subscription.
                    </p>
                </div>

                {/* Controls */}
                <div className="flex flex-col md:flex-row gap-4">
                    <div className="relative flex-1">
                        <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-white/40" />
                        <Input
                            placeholder="Search by name or location..."
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            className="h-12 pl-11 bg-[#0A0A0A] border-white/10 text-white placeholder:text-white/20 focus:border-white/30 focus:bg-[#111] rounded-xl transition-all"
                        />
                    </div>
                    <div className="flex gap-2">
                        <Button
                            variant="outline"
                            onClick={() => setSortBy("distance")}
                            className={`h-12 px-6 rounded-xl border-white/10 font-bold tracking-wide ${sortBy === "distance" ? 'bg-white text-black hover:bg-white/90' : 'bg-[#0A0A0A] text-white hover:bg-white/5'
                                }`}
                        >
                            <MapPin className="w-4 h-4 mr-2" />
                            NEAREST
                        </Button>
                        <Button
                            variant="outline"
                            onClick={() => setSortBy("rating")}
                            className={`h-12 px-6 rounded-xl border-white/10 font-bold tracking-wide ${sortBy === "rating" ? 'bg-white text-black hover:bg-white/90' : 'bg-[#0A0A0A] text-white hover:bg-white/5'
                                }`}
                        >
                            <Filter className="w-4 h-4 mr-2" />
                            TOP RATED
                        </Button>
                    </div>
                </div>

                {/* Results Grid */}
                <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
                    {filteredCenters.map((center, idx) => (
                        <motion.div
                            key={center.id}
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: idx * 0.05 }}
                            onClick={handleAction}
                            className="group cursor-pointer"
                        >
                            <div className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden hover:border-white/30 transition-all group-hover:-translate-y-1">
                                {/* Image Section */}
                                <div className="relative h-48 w-full overflow-hidden">
                                    <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
                                        <span className="text-white/20 font-bold tracking-widest uppercase">
                                            {center.image ? 'Loading...' : 'No Image'}
                                        </span>
                                    </div>
                                    {center.image && (
                                        <Image
                                            src={center.image}
                                            alt={center.name}
                                            fill
                                            className="object-cover transition-transform duration-700 group-hover:scale-110"
                                        />
                                    )}
                                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-10">
                                        <span className="text-xs font-bold text-white flex items-center gap-1">
                                            <MapPin className="w-3 h-3 text-white" />
                                            {center.distance} km
                                        </span>
                                    </div>
                                    <div className="absolute top-4 left-4 z-10">
                                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${center.openNow ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                                            {center.openNow ? 'Open Now' : 'Closed'}
                                        </span>
                                    </div>
                                </div>

                                {/* Content Section */}
                                <div className="p-5">
                                    <div className="flex items-start justify-between mb-2">
                                        <h3 className="text-lg font-black text-white group-hover:text-white/80 transition-colors line-clamp-1 uppercase tracking-tight">
                                            {center.name}
                                        </h3>
                                        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                                            <Star className="w-3 h-3 text-white fill-white" />
                                            <span className="text-xs font-bold text-white">{center.rating}</span>
                                        </div>
                                    </div>

                                    <p className="text-white/40 text-sm mb-4 line-clamp-1 font-medium">{center.address}</p>

                                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                                        <div className="flex items-center gap-2 text-white/60 text-xs font-medium">
                                            <Clock className="w-3 h-3" />
                                            {center.nextClassTime ? `Next class: ${center.nextClassTime}` : 'No classes today'}
                                        </div>
                                        <span className="text-xs font-bold text-white group-hover:translate-x-1 transition-transform tracking-wider">
                                            BOOK CLASS →
                                        </span>
                                    </div>
                                </div>
                            </div>
                        </motion.div>
                    ))}
                </div>

                {filteredCenters.length === 0 && (
                    <div className="text-center py-20">
                        <div className="w-16 h-16 bg-white/5 rounded-full flex items-center justify-center mx-auto mb-4">
                            <MapPin className="w-8 h-8 text-white/20" />
                        </div>
                        <h3 className="text-lg font-bold text-white">No centers found</h3>
                        <p className="text-white/40 text-sm">Try adjusting your search or filters</p>
                    </div>
                )}
            </div>
        </div>
    )
}
