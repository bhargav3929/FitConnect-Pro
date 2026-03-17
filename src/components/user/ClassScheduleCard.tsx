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
        <div className="flex bg-peach-50 border border-peach-400/20 rounded-none sm:rounded-xl p-6 relative overflow-hidden group hover:border-terra-400/30 transition-colors">
            {/* Left Column: Time & Avatar */}
            <div className="flex flex-col items-center mr-6 min-w-[60px] pt-1">
                <span className="text-xl font-black text-olive-600 leading-none mb-1">{time}</span>
                <span className="text-xs text-olive-300 font-medium mb-4">{duration}</span>

                <Avatar className="w-12 h-12 border-2 border-peach-400/20">
                    <AvatarImage src={trainerImage} className="object-cover" />
                    <AvatarFallback className="bg-peach-200/50 text-olive-400 text-xs">
                        {trainer.charAt(0)}
                    </AvatarFallback>
                </Avatar>
            </div>

            {/* Right Column: Details & Action */}
            <div className="flex-1 flex flex-col justify-between">
                <div className="mb-4">
                    <div className="flex items-center gap-2 mb-1">
                        <h3 className="text-lg font-bold text-olive-600 leading-tight">
                            {name.replace('Class: ', '')}
                        </h3>
                        {intensityLevel > 1 && (
                            <Flame className={`w-4 h-4 ${intensityLevel === 3 ? 'text-red-500 fill-red-500' : 'text-orange-400 fill-orange-400'}`} />
                        )}
                    </div>

                    <p className="text-olive-400 text-sm font-medium mb-1">{trainer}</p>
                    <p className="text-olive-400 text-xs mb-1">{type}</p>
                    <p className="text-olive-400 text-xs">{location}</p>
                </div>

                <div className="mt-2">
                    {isFull ? (
                        <div className="space-y-2">
                            <span className="text-xs text-olive-400 font-medium">Waitlist Only</span>
                            <Button
                                variant="outline"
                                className="w-full h-10 border-peach-400/20 bg-transparent text-olive-600 hover:bg-peach-200/50 hover:text-olive-600 uppercase tracking-wider text-xs font-bold rounded-sm"
                                onClick={onBook}
                            >
                                Join Waitlist
                            </Button>
                        </div>
                    ) : (
                        <div className="space-y-2">
                            {spotsLeft <= 5 && (
                                <span className="text-xs text-terra-300 font-medium">Only {spotsLeft} spots left</span>
                            )}
                            <Button
                                className="w-full h-10 bg-terra-400 text-peach-50 hover:bg-terra-300 uppercase tracking-wider text-xs font-bold rounded-sm"
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
