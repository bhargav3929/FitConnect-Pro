"use client"

import * as React from "react"
import { Clock, Users, Dumbbell } from "lucide-react"

import { Card, CardContent } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { ClassSession } from "@/types/class"
import { cn } from "@/lib/utils"

interface ClassCardProps {
    session: ClassSession
    onBook?: (sessionId: string) => void
}

export default function ClassCard({ session, onBook }: ClassCardProps) {
    const isFull = session.bookedCount >= session.capacity;
    const spotsLeft = session.capacity - session.bookedCount;

    return (
        <Card className="overflow-hidden border-l-4 border-l-primary hover:shadow-lg transition-all duration-300">
            <CardContent className="p-0 flex flex-col sm:flex-row">
                {/* Time Column */}
                <div className="bg-primary/5 p-6 flex flex-col justify-center items-center min-w-[120px] border-r border-dashed border-border/60">
                    <span className="text-2xl font-bold text-primary">{session.startTime}</span>
                    <span className="text-sm text-muted-foreground">{session.duration} min</span>
                </div>

                {/* Content Column */}
                <div className="p-6 flex-1 flex flex-col justify-center">
                    <div className="flex justify-between items-start mb-2">
                        <div>
                            <h3 className="text-lg font-bold flex items-center gap-2">
                                {session.classType}
                                <Badge variant="outline" className="text-[10px] uppercase tracking-wider text-muted-foreground">
                                    {session.difficultyLevel}
                                </Badge>
                            </h3>
                            <p className="text-sm text-muted-foreground line-clamp-1">{session.description}</p>
                        </div>
                    </div>

                    <div className="flex items-center gap-4 text-sm text-muted-foreground mt-2">
                        <div className="flex items-center gap-1">
                            <Users className="w-4 h-4" />
                            <span>
                                {isFull ? "Full" : `${spotsLeft} spots left`}
                            </span>
                        </div>
                        <div className="flex items-center gap-1">
                            <Dumbbell className="w-4 h-4" />
                            <span>Trainer TBD</span>
                        </div>
                    </div>
                </div>

                {/* Action Column */}
                <div className="p-6 flex items-center justify-end">
                    <Button
                        disabled={isFull}
                        onClick={() => onBook?.(session.id)}
                        className={cn(
                            "min-w-[100px] font-semibold transition-all shadow-glow hover:shadow-glow-lg",
                            isFull && "bg-muted text-muted-foreground shadow-none"
                        )}
                    >
                        {isFull ? "Waitlist" : "Book Now"}
                    </Button>
                </div>
            </CardContent>
        </Card>
    )
}
