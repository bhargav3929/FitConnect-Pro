"use client"

import * as React from "react"
import { useParams } from "next/navigation"
import Image from "next/image"
import { motion } from "framer-motion"
import { MapPin, Clock, Phone, Mail, Star, Share2 } from "lucide-react"

import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Skeleton } from "@/components/ui/skeleton"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import ClassCard from "@/components/class/ClassCard"
import { useGymCenters } from "@/lib/hooks/useGymCenters"
import { useClasses } from "@/lib/hooks/useClasses"
import { GymCenter } from "@/types/gym"
import { ClassSession } from "@/types/class"

import { BookingModal } from "@/components/booking/BookingModal";
import { LoginModal } from "@/components/auth/LoginModal";
import { useAuth } from "@/lib/hooks/useAuth";

import { toast } from "sonner"

export default function GymDetailPage() {
    const params = useParams()
    const { user } = useAuth()
    const { gyms, loading: loadingGyms } = useGymCenters()
    const { classes, loading: loadingClasses } = useClasses(params.id as string)

    const gym = gyms.find(g => g.id === params.id)

    const [selectedSession, setSelectedSession] = React.useState<ClassSession | null>(null)
    const [showBooking, setShowBooking] = React.useState(false)
    const [showLogin, setShowLogin] = React.useState(false)

    const handleBook = (sessionId: string) => {
        if (!user) {
            setShowLogin(true)
            return
        }
        const session = classes.find(c => c.id === sessionId)
        if (session) {
            setSelectedSession(session)
            setShowBooking(true)
        }
    }

    if (loadingGyms) {
        return (
            <div className="container mx-auto px-4 py-8 space-y-8">
                <Skeleton className="w-full h-[400px] rounded-2xl" />
                <div className="space-y-4">
                    <Skeleton className="w-1/2 h-10" />
                    <Skeleton className="w-full h-24" />
                </div>
            </div>
        )
    }

    if (!gym) {
        return <div className="text-center py-20">Gym not found</div>
    }

    return (
        <div className="bg-background min-h-screen pb-20">
            {/* Hero Section */}
            <div className="relative h-[60vh] min-h-[400px] w-full">
                <Image
                    src={gym.photos[0]}
                    alt={gym.name}
                    fill
                    className="object-cover"
                    priority
                />
                <div className="absolute inset-0 bg-gradient-to-t from-background via-background/50 to-transparent" />

                <div className="absolute bottom-0 left-0 w-full p-8 md:p-16">
                    <div className="container mx-auto">
                        <motion.div
                            initial={{ opacity: 0, y: 30 }}
                            animate={{ opacity: 1, y: 0 }}
                            className="max-w-4xl"
                        >
                            <Badge className="mb-4 bg-primary text-white hover:bg-primary/90">Premium Partner</Badge>
                            <h1 className="text-4xl md:text-6xl font-bold text-foreground mb-4">{gym.name}</h1>
                            <div className="flex flex-wrap items-center gap-6 text-muted-foreground text-lg">
                                <div className="flex items-center gap-2">
                                    <MapPin className="w-5 h-5 text-primary" />
                                    {gym.address.street}, {gym.address.city}
                                </div>
                                <div className="flex items-center gap-2">
                                    <Star className="w-5 h-5 text-amber-500 fill-amber-500" />
                                    4.8 (120 reviews)
                                </div>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>

            <div className="container mx-auto px-4 -mt-12 relative z-10">
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                    {/* Main Content */}
                    <div className="lg:col-span-2 space-y-8">
                        {/* Info Card */}
                        <motion.div
                            initial={{ opacity: 0, y: 20 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.1 }}
                            className="bg-card border border-border rounded-xl p-8 shadow-lg"
                        >
                            <h2 className="text-2xl font-bold mb-4">About the Gym</h2>
                            <p className="text-muted-foreground leading-relaxed">
                                {gym.facilities} Experience state-of-the-art equipment, luxury amenities,
                                and expert trainers dedicated to helping you reach your fitness goals.
                                This location features spacious locker rooms, towel service, and a smoothie bar.
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-8">
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                                        <Clock className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Opening Hours</h4>
                                        <p className="text-sm text-muted-foreground">Mon - Fri: {gym.operatingHours.monday.open} - {gym.operatingHours.monday.close}</p>
                                        <p className="text-sm text-muted-foreground">Sat - Sun: 08:00 - 20:00</p>
                                    </div>
                                </div>
                                <div className="flex items-start gap-4">
                                    <div className="p-3 rounded-full bg-primary/10 text-primary">
                                        <Phone className="w-6 h-6" />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold">Contact</h4>
                                        <p className="text-sm text-muted-foreground">{gym.contactInfo.phone}</p>
                                        <p className="text-sm text-muted-foreground">{gym.contactInfo.email}</p>
                                    </div>
                                </div>
                            </div>
                        </motion.div>

                        {/* Classes Section */}
                        <div>
                            <h2 className="text-2xl font-bold mb-6">Upcoming Classes</h2>
                            <Tabs defaultValue="today" className="w-full">
                                <TabsList className="mb-6">
                                    <TabsTrigger value="today">Today</TabsTrigger>
                                    <TabsTrigger value="tomorrow">Tomorrow</TabsTrigger>
                                    <TabsTrigger value="week">This Week</TabsTrigger>
                                </TabsList>

                                <TabsContent value="today" className="space-y-4">
                                    {loadingClasses ? (
                                        <Skeleton className="h-32 w-full" />
                                    ) : classes.length > 0 ? (
                                        classes.map(session => (
                                            <ClassCard key={session.id} session={session} onBook={handleBook} />
                                        ))
                                    ) : (
                                        <p className="text-muted-foreground text-center py-8">No classes scheduled for today.</p>
                                    )}
                                </TabsContent>
                            </Tabs>
                        </div>
                    </div>

                    {/* Sidebar */}
                    <div className="space-y-6">
                        <div className="bg-card border border-border rounded-xl p-6 shadow-md sticky top-24">
                            <h3 className="font-bold text-lg mb-4">Location</h3>
                            <div className="aspect-square w-full bg-muted rounded-lg mb-4 relative overflow-hidden group">
                                {/* Mock Map */}
                                <Image
                                    src="/images/map-placeholder.jpg"
                                    alt="Map"
                                    fill
                                    className="object-cover opacity-80 group-hover:opacity-100 transition-opacity"
                                />
                                <div className="absolute inset-0 flex items-center justify-center">
                                    <Button variant="secondary" size="sm" className="shadow-lg">
                                        <MapPin className="w-4 h-4 mr-2" />
                                        Get Directions
                                    </Button>
                                </div>
                            </div>
                            <Button variant="outline" className="w-full" size="lg">
                                <Share2 className="w-4 h-4 mr-2" />
                                Share Location
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
            <BookingModal
                isOpen={showBooking}
                onClose={() => setShowBooking(false)}
                session={selectedSession}
                gymName={gym.name}
            />

            <LoginModal
                isOpenOverride={showLogin}
                onCloseOverride={() => setShowLogin(false)}
            />
        </div>
    )
}
