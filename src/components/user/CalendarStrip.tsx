"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarStripProps {
    selectedDate: Date
    onDateSelect: (date: Date) => void
}

export function CalendarStrip({ selectedDate, onDateSelect }: CalendarStripProps) {
    const [dates, setDates] = useState<Date[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Generate next 14 days
        const days = []
        const today = new Date()
        for (let i = 0; i < 14; i++) {
            const date = new Date(today)
            date.setDate(today.getDate() + i)
            days.push(date)
        }
        setDates(days)
    }, [])

    const isSameDate = (d1: Date, d2: Date) => {
        return d1.getDate() === d2.getDate() &&
            d1.getMonth() === d2.getMonth() &&
            d1.getFullYear() === d2.getFullYear()
    }

    const formatDateFull = (date: Date) => {
        return date.toLocaleDateString('en-GB', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' })
    }

    return (
        <div className="w-full">
            {/* Days Strip */}
            <div className="relative flex items-center mb-6">
                <button className="w-8 h-8 flex items-center justify-center text-white/40">
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex-1 flex overflow-x-auto scrollbar-none gap-2 px-2 snap-x"
                >
                    {dates.map((date, i) => {
                        const isSelected = isSameDate(date, selectedDate)
                        const isToday = isSameDate(date, new Date())

                        return (
                            <button
                                key={i}
                                onClick={() => onDateSelect(date)}
                                className={`
                                    flex flex-col items-center justify-center min-w-[50px] py-3 rounded-xl transition-all snap-center
                                    ${isSelected
                                        ? 'bg-white text-black shadow-lg scale-105'
                                        : 'bg-transparent text-white/40 hover:text-white'
                                    }
                                `}
                            >
                                {isToday && isSelected && (
                                    <span className="text-[10px] font-bold uppercase tracking-wider mb-1">Today</span>
                                )}
                                <span className={`text-xs font-medium mb-1 ${isSelected ? 'opacity-100' : 'opacity-60'}`}>
                                    {date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <span className="text-xl font-bold leading-none">
                                    {date.getDate()}
                                </span>
                                {isSelected && (
                                    <div className="w-1 h-1 bg-black rounded-full mt-2" />
                                )}
                            </button>
                        )
                    })}
                </div>

                <button className="w-8 h-8 flex items-center justify-center text-white/40">
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Date Header */}
            <div className="flex items-center justify-between px-4 pb-4 border-b border-white/10">
                <h2 className="text-white font-bold text-sm sm:text-base">
                    {formatDateFull(selectedDate)}
                </h2>
                <button
                    onClick={() => onDateSelect(new Date())}
                    className="px-4 py-1.5 rounded-md border border-white/20 text-xs font-bold text-white hover:bg-white hover:text-black transition-colors"
                >
                    Today
                </button>
            </div>
        </div>
    )
}
