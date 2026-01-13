"use client"

import { motion } from "framer-motion"
import { MapPin, Clock, User, ChevronRight, Flame } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"

interface ClassScheduleCardProps {
    id: string
    name: string
    time: string
    duration: string
    trainer: string
    trainerImage?: string
    location: string
    type: string
    capacity: number
    booked: number
    intensityLevel?: 1 | 2 | 3
    onBook: () => void
}

export function ClassScheduleCard({
    id,
    name,
    time,
    duration,
    trainer,
    trainerImage,
    location,
    type,
    capacity,
    booked,
    intensityLevel = 1,
    onBook
}: ClassScheduleCardProps) {
    const isFull = booked >= capacity
    const spotsLeft = capacity - booked

    return (
        <div className="flex bg-[#161618] border border-white/5 rounded-none sm:rounded-xl p-6 relative overflow-hidden group hover:bg-[#1C1C1E] transition-colors">
            {/* Left Column: Time & Avatar */}
            <div className="flex flex-col items-center mr-6 min-w-[60px] pt-1">
                <span className="text-xl font-black text-white leading-none mb-1">{time}</span>
                <span className="text-xs text-white/40 font-medium mb-4">{duration}</span>

                <Avatar className="w-12 h-12 border-2 border-[#2C2C2E]">
                    <AvatarImage src={trainerImage} className="object-cover" />
                    <AvatarFallback className="bg-[#2C2C2E] text-white/40 text-xs">
                        {trainer.charAt(0)}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Right Column: Details & Action */}
            <div className="flex-1 flex flex-col justify-between">
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-white leading-tight">
                            {name.replace('Class: ', '')}
                        </h3>
                        {intensityLevel > 1 && (
                            <Flame className={`w-4 h-4 ${intensityLevel === 3 ? 'text-red-500 fill-red-500' : 'text-orange-400 fill-orange-400'}`} />
                        )}
                    </div>

                    <p className="text-[#AAAAAA] text-sm font-medium mb-1">{trainer}</p>
                    <p className="text-white/40 text-xs mb-1">{type}</p>
                    <p className="text-white/40 text-xs">{location}</p>
                </div>

                <div className="mt-2">
                    {isFull ? (
                        <div className="space-y-2">
                            <span className="text-xs text-white/40 font-medium">Waitlist Only</span>
                            <Button
                                variant="outline"
                                className="w-full h-10 border-white/20 bg-transparent text-white hover:bg-white/5 hover:text-white uppercase tracking-wider text-xs font-bold rounded-sm"
                                onClick={onBook}
                            >
                                Join Waitlist
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {spotsLeft <= 5 && (
                                <span className="text-xs text-[#d4b065] font-medium">Only {spotsLeft} spots left</span>
                            )}
                            <Button
                                className="w-full h-10 bg-white text-black hover:bg-gray-200 uppercase tracking-wider text-xs font-bold rounded-sm"
                                onClick={onBook}
                            >
                                Book Class
                            </Button>
                        </div>
                    )}
                </div>
            </div>
        </div>
    )
}
