"use client"

import * as React from "react"
import { Search, MapPin, Filter } from "lucide-react"
import { motion } from "framer-motion"

import { Input } from "@/components/ui/input"
import { Button } from "@/components/ui/button"
import { Skeleton } from "@/components/ui/skeleton"
import GymCard from "@/components/gym/GymCard"
import { useGymCenters } from "@/lib/hooks/useGymCenters"

export default function GymsPage() {
    const { gyms, loading } = useGymCenters()
    const [search, setSearch] = React.useState("")

    const filteredGyms = gyms.filter(gym =>
        gym.name.toLowerCase().includes(search.toLowerCase()) ||
        gym.address.city.toLowerCase().includes(search.toLowerCase())
    )

    return (
        <div className="min-h-screen bg-background pb-20">
            {/* Hero Search Section */}
            <div className="bg-primary/5 py-12 md:py-20">
                <div className="container mx-auto px-4 max-w-4xl text-center space-y-6">
                    <motion.h1
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        className="text-4xl md:text-5xl font-bold tracking-tight text-foreground"
                    >
                        Find Your <span className="text-primary">Fitness Sanctuary</span>
                    </motion.h1>
                    <motion.p
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.1 }}
                        className="text-lg text-muted-foreground"
                    >
                        Access the city's top gym centers with one membership.
                    </motion.p>

                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: 0.2 }}
                        className="flex items-center w-full max-w-2xl mx-auto space-x-2 bg-white p-2 rounded-full shadow-lg border border-border/50"
                    >
                        <Search className="ml-3 w-5 h-5 text-muted-foreground" />
                        <Input
                            className="border-0 focus-visible:ring-0 focus-visible:ring-offset-0 bg-transparent text-lg h-12"
                            placeholder="Search by name or location..."
                            value={search}
                            onChange={(e) => setSearch(e.target.value)}
                        />
                        <Button size="lg" className="rounded-full px-8 font-semibold shadow-glow">
                            Search
                        </Button>
                    </motion.div>
                </div>
            </div>

            {/* Main Content */}
            <div className="container mx-auto px-4 py-12">
                {/* Filters and Stats */}
                <div className="flex flex-col md:flex-row justify-between items-center mb-8 gap-4">
                    <h2 className="text-2xl font-bold flex items-center">
                        <MapPin className="mr-2 h-6 w-6 text-primary" />
                        Nearby Gyms
                        <span className="ml-2 text-sm font-normal text-muted-foreground bg-secondary/10 text-secondary px-2 py-1 rounded-full">
                            {filteredGyms.length} Active
                        </span>
                    </h2>
                    <div className="flex gap-2">
                        <Button variant="outline" size="sm" className="hidden md:flex">
                            <Filter className="mr-2 h-4 w-4" /> Filters
                        </Button>
                    </div>
                </div>

                {/* Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
                    {loading ? (
                        Array.from({ length: 6 }).map((_, i) => (
                            <div key={i} className="space-y-4">
                                <Skeleton className="aspect-video w-full rounded-xl" />
                                <div className="space-y-2">
                                    <Skeleton className="h-6 w-2/3" />
                                    <Skeleton className="h-4 w-1/2" />
                                </div>
                                <Skeleton className="h-20 w-full rounded-lg" />
                            </div>
                        ))
                    ) : (
                        filteredGyms.map((gym, index) => (
                            <motion.div
                                key={gym.id}
                                initial={{ opacity: 0, y: 20 }}
                                animate={{ opacity: 1, y: 0 }}
                                transition={{ delay: index * 0.1 }}
                            >
                                <GymCard gym={gym} />
                            </motion.div>
                        ))
                    )}
                </div>

                {!loading && filteredGyms.length === 0 && (
                    <div className="text-center py-20 text-muted-foreground">
                        <p className="text-xl">No gyms found matching your search.</p>
                        <Button variant="link" onClick={() => setSearch("")} className="mt-2">
                            Clear Search
                        </Button>
                    </div>
                )}
            </div>
        </div>
    )
}
