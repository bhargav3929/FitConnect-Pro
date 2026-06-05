"use client"

import { useState, useRef, useEffect } from "react"
import { motion } from "framer-motion"
import { ChevronLeft, ChevronRight } from "lucide-react"

interface CalendarStripProps {
    selectedDate: Date
    onDateSelect: (date: Date) => void
    disabledAfter?: Date | null
}

export function CalendarStrip({ selectedDate, onDateSelect, disabledAfter }: CalendarStripProps) {
    const [dates, setDates] = useState<Date[]>([])
    const scrollRef = useRef<HTMLDivElement>(null)

    useEffect(() => {
        // Generate next 14 days
        const days = []
        const today = new Date()
        for (let i = 0; i < 90; i++) {
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

    const isAfterDisabledDate = (date: Date) => {
        if (!disabledAfter) return false
        const day = new Date(date)
        day.setHours(0, 0, 0, 0)
        const limit = new Date(disabledAfter)
        limit.setHours(0, 0, 0, 0)
        return day > limit
    }

    return (
        <div className="w-full">
            {/* Days Strip */}
            <div className="relative flex items-center mb-6">
                <button
                    onClick={() => scrollRef.current?.scrollBy({ left: -200, behavior: 'smooth' })}
                    className="w-8 h-8 flex items-center justify-center text-olive-400 hover:text-olive-600 transition-colors"
                >
                    <ChevronLeft className="w-5 h-5" />
                </button>

                <div
                    ref={scrollRef}
                    className="flex-1 flex overflow-x-auto scrollbar-none gap-2 px-2 snap-x"
                >
                    {dates.map((date, i) => {
                        const isSelected = isSameDate(date, selectedDate)
                        const isToday = isSameDate(date, new Date())
                        const isDisabled = isAfterDisabledDate(date)

                        return (
                            <button
                                key={i}
                                onClick={() => {
                                    if (!isDisabled) onDateSelect(date)
                                }}
                                disabled={isDisabled}
                                aria-disabled={isDisabled}
                                className={`
                                    flex flex-col items-center justify-center min-w-[56px] min-h-[72px] py-3 px-1 rounded-2xl transition-all snap-center active:scale-95
                                    ${isDisabled
                                        ? 'cursor-not-allowed bg-peach-100/40 text-olive-200 opacity-45'
                                        : isSelected
                                        ? 'bg-terra-400 text-peach-50 shadow-lg shadow-terra-400/20'
                                        : isToday
                                            ? 'bg-peach-200/60 text-olive-600'
                                            : 'bg-transparent text-olive-400 hover:bg-peach-200/40'
                                    }
                                `}
                            >
                                <span className={`text-[10px] font-bold uppercase tracking-wider mb-1 ${isDisabled ? 'text-olive-200' : isSelected ? 'text-peach-50/70' : 'text-olive-300'}`}>
                                    {isToday && isSelected ? 'Today' : date.toLocaleDateString('en-US', { weekday: 'short' })}
                                </span>
                                <span className="text-xl font-black leading-none">
                                    {date.getDate()}
                                </span>
                                {isToday && !isSelected && (
                                    <div className="w-1 h-1 bg-terra-400 rounded-full mt-1.5" />
                                )}
                            </button>
                        )
                    })}
                </div>

                <button
                    onClick={() => scrollRef.current?.scrollBy({ left: 200, behavior: 'smooth' })}
                    className="w-8 h-8 flex items-center justify-center text-olive-400 hover:text-olive-600 transition-colors"
                >
                    <ChevronRight className="w-5 h-5" />
                </button>
            </div>

            {/* Date Header */}
            <div className="flex items-center justify-between px-4 pb-4 border-b border-peach-400/20">
                <h2 className="text-olive-600 font-bold text-sm sm:text-base">
                    {formatDateFull(selectedDate)}
                </h2>
                <button
                    onClick={() => onDateSelect(new Date())}
                    className="px-4 py-1.5 rounded-md border border-terra-400/30 text-xs font-bold text-terra-400 hover:bg-terra-400 hover:text-peach-50 transition-colors"
                >
                    Today
                </button>
            </div>
        </div>
    )
}
