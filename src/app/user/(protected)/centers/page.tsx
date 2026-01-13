"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Search, MapPin, Filter } from "lucide-react"
import { CenterCard } from "@/components/user/CenterCard"
import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"

// Updated mock data with more centers
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

export default function BrowseCentersPage() {
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

    return (
        <div className="space-y-8 pb-20">
            {/* Header */}
            <div>
                <h1 className="text-3xl font-black text-white tracking-tight">Browse Centers</h1>
                <p className="text-white/40 text-sm mt-1">
                    Find and book classes at fitness centers near you
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
                        className="h-12 pl-11 bg-[#0A0A0A] border-white/10 text-white placeholder:text-white/20 focus:border-[#7BA3A8]/50 focus:bg-[#0A0A0A] rounded-xl"
                    />
                </div>
                <div className="flex gap-2">
                    <Button
                        variant="outline"
                        onClick={() => setSortBy("distance")}
                        className={`h-12 px-6 rounded-xl border-white/10 font-bold ${sortBy === "distance" ? 'bg-white text-black hover:bg-white/90' : 'bg-[#0A0A0A] text-white hover:bg-white/5'
                            }`}
                    >
                        <MapPin className="w-4 h-4 mr-2" />
                        Nearest
                    </Button>
                    <Button
                        variant="outline"
                        onClick={() => setSortBy("rating")}
                        className={`h-12 px-6 rounded-xl border-white/10 font-bold ${sortBy === "rating" ? 'bg-white text-black hover:bg-white/90' : 'bg-[#0A0A0A] text-white hover:bg-white/5'
                            }`}
                    >
                        <Filter className="w-4 h-4 mr-2" />
                        Top Rated
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
                    >
                        <CenterCard {...center} />
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
    )
}
