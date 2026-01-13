"use client"

import { motion } from "framer-motion"
import { MapPin, Star, Clock } from "lucide-react"
import Link from "next/link"
import Image from "next/image"

export interface CenterCardProps {
    id: string
    name: string
    address: string
    image: string
    rating: number
    distance: number
    openNow: boolean
    nextClassTime?: string
}

export function CenterCard({
    id,
    name,
    address,
    image,
    rating,
    distance,
    openNow,
    nextClassTime
}: CenterCardProps) {
    return (
        <Link href={`/user/centers/${id}`} className="block group">
            <motion.div
                whileHover={{ y: -5 }}
                className="bg-[#0A0A0A] border border-white/10 rounded-2xl overflow-hidden hover:border-white/30 transition-all"
            >
                {/* Image Section */}
                <div className="relative h-48 w-full">
                    {/* Placeholder image if no real image */}
                    <div className="absolute inset-0 bg-white/5 flex items-center justify-center">
                        <span className="text-white/20 font-bold tracking-widest uppercase">
                            {image ? 'Loading...' : 'No Image'}
                        </span>
                    </div>
                    {image && (
                        <Image
                            src={image}
                            alt={name}
                            fill
                            className="object-cover transition-transform duration-500 group-hover:scale-110"
                        />
                    )}
                    {/* Distance Badge */}
                    <div className="absolute top-4 right-4 bg-black/80 backdrop-blur-md px-3 py-1 rounded-full border border-white/10 z-10">
                        <span className="text-xs font-bold text-white flex items-center gap-1">
                            <MapPin className="w-3 h-3 text-[#7BA3A8]" />
                            {distance} km
                        </span>
                    </div>
                    {/* Status Badge */}
                    <div className="absolute top-4 left-4 z-10">
                        <span className={`px-2 py-1 rounded-full text-[10px] font-bold uppercase tracking-wider ${openNow ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'
                            }`}>
                            {openNow ? 'Open Now' : 'Closed'}
                        </span>
                    </div>
                </div>

                {/* Content Section */}
                <div className="p-5">
                    <div className="flex items-start justify-between mb-2">
                        <h3 className="text-lg font-bold text-white group-hover:text-[#7BA3A8] transition-colors line-clamp-1">
                            {name}
                        </h3>
                        <div className="flex items-center gap-1 bg-white/5 px-2 py-1 rounded-lg">
                            <Star className="w-3 h-3 text-yellow-400 fill-yellow-400" />
                            <span className="text-xs font-bold text-white">{rating}</span>
                        </div>
                    </div>

                    <p className="text-white/40 text-sm mb-4 line-clamp-1">{address}</p>

                    <div className="flex items-center justify-between pt-4 border-t border-white/5">
                        <div className="flex items-center gap-2 text-white/60 text-xs">
                            <Clock className="w-3 h-3" />
                            {nextClassTime ? `Next class: ${nextClassTime}` : 'No classes today'}
                        </div>
                        <span className="text-xs font-bold text-white group-hover:translate-x-1 transition-transform">
                            VIEW DETAILS →
                        </span>
                    </div>
                </div>
            </motion.div>
        </Link>
    )
}
