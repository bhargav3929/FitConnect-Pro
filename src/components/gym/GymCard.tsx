"use client"

import * as React from "react"
import Link from "next/link"
import Image from "next/image"
import { motion } from "framer-motion"
import { MapPin, Star, Users } from "lucide-react"

import { Card, CardContent, CardFooter, CardHeader } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { GymCenter } from "@/types/gym"

interface GymCardProps {
    gym: GymCenter
}

export default function GymCard({ gym }: GymCardProps) {
    return (
        <motion.div
            whileHover={{ y: -5 }}
            transition={{ type: "spring", stiffness: 300 }}
        >
            <Card className="h-full overflow-hidden border-border bg-card shadow-md hover:shadow-xl transition-shadow duration-300 rounded-xl group cursor-pointer">
                <div className="relative aspect-video w-full overflow-hidden">
                    <Image
                        src={gym.photos[0] || "/images/placeholder-gym.jpg"}
                        alt={gym.name}
                        fill
                        className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                    <div className="absolute top-4 right-4">
                        <Badge variant="secondary" className="backdrop-blur-md bg-white/90 text-primary font-semibold shadow-sm">
                            Open Now
                        </Badge>
                    </div>
                    <div className="absolute inset-0 bg-gradient-to-t from-black/60 to-transparent opacity-60" />
                    <div className="absolute bottom-4 left-4 text-white">
                        <span className="flex items-center text-sm font-medium">
                            <Users className="w-4 h-4 mr-1" /> 12 Active Classes
                        </span>
                    </div>
                </div>

                <CardHeader className="p-6 pb-2">
                    <h3 className="text-xl font-bold tracking-tight text-foreground">{gym.name}</h3>
                    <div className="flex items-center text-muted-foreground text-sm space-x-1">
                        <MapPin className="w-4 h-4 text-primary" />
                        <span>{gym.address.city}, {gym.address.state}</span>
                    </div>
                </CardHeader>

                <CardContent className="p-6 pt-2">
                    <p className="text-sm text-muted-foreground line-clamp-2">
                        {gym.facilities}
                    </p>
                </CardContent>

                <CardFooter className="p-6 pt-0 flex justify-between items-center">
                    <div className="flex items-center space-x-1 text-sm font-medium">
                        <Star className="w-4 h-4 text-amber-500 fill-amber-500" />
                        <span>4.8</span>
                        <span className="text-muted-foreground">(120)</span>
                    </div>
                    <Link href={`/gyms/${gym.id}`}>
                        <Button size="sm" className="font-semibold shadow-glow hover:shadow-glow-lg transition-all">
                            View Details
                        </Button>
                    </Link>
                </CardFooter>
            </Card>
        </motion.div>
    )
}
