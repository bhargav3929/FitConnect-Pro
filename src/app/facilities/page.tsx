"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, Phone, Mail, MapPin, Dumbbell, Waves, Shield, Zap, Heart, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

const AMENITY_ZONES = [
    {
        id: "reformer",
        name: "Reformer Studio",
        description: "State-of-the-art Balanced Body reformers in a boutique setting. Precision-guided spring resistance for full-body sculpting and core activation.",
        icon: Dumbbell,
        image: "/images/gyms/fitpro-downtown.png",
        features: ["Balanced Body Reformers", "Spring Resistance", "Tower Attachments", "Jump Boards"],
    },
    {
        id: "mat",
        name: "Mat Studio",
        description: "A dedicated open-plan space for mat Pilates, floor work, and group sessions. Floor-to-ceiling mirrors with premium cushioned flooring.",
        icon: Heart,
        image: "/images/gyms/fitpro-midtown.png",
        features: ["Premium Mats", "Resistance Bands", "Pilates Rings", "Stability Balls"],
    },
    {
        id: "private",
        name: "Private Suite",
        description: "Intimate one-on-one training rooms equipped with reformer, Cadillac, and Wunda chair. Tailored sessions in a private, focused environment.",
        icon: Shield,
        image: "/images/gyms/fitpro-uptown.png",
        features: ["Private Reformer", "Cadillac/Trapeze", "Wunda Chair", "Spine Corrector"],
    },
    {
        id: "barre",
        name: "Barre & Stretch",
        description: "Barre-fusion studio with ballet barres, TRX suspension, and dedicated flexibility zones. A graceful blend of Pilates principles and dance conditioning.",
        icon: Zap,
        image: "/images/gyms/fitpro-brooklyn.png",
        features: ["Ballet Barres", "TRX Suspension", "Flexibility Zone", "Foam Rollers"],
    },
    {
        id: "recovery",
        name: "Recovery Lounge",
        description: "Post-session recovery with infrared sauna, relaxation seating, and self-massage tools. Designed to calm the body after every session.",
        icon: Waves,
        image: "/images/gyms/fitpro-queens.png",
        features: ["Infrared Sauna", "Relaxation Area", "Foam Rolling Zone", "Stretching Space"],
    },
]

const FACILITY_HOURS = [
    { day: "Monday - Friday", hours: "05:00 AM - 11:00 PM" },
    { day: "Saturday", hours: "06:00 AM - 10:00 PM" },
    { day: "Sunday", hours: "07:00 AM - 9:00 PM" },
]

export default function FacilityPage() {
    const [activeZone, setActiveZone] = useState<string>("reformer")

    const selectedZone = AMENITY_ZONES.find(z => z.id === activeZone)

    return (
        <div className="min-h-screen bg-peach-200 pt-28 pb-20 px-4 md:px-8">
            <div className="container mx-auto space-y-16">
                {/* Hero Header */}
                <div className="max-w-3xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className="text-terra-400/60 text-sm font-bold tracking-[0.3em] uppercase block mb-4">Our Facility</span>
                        <h1 className="text-4xl md:text-6xl font-black text-olive-600 tracking-tighter leading-[0.95] mb-6 font-display">
                            SPACES DESIGNED<br />
                            FOR STRENGTH,<br />
                            CONTROL & CALM
                        </h1>
                        <p className="text-olive-300 text-lg max-w-xl leading-relaxed">
                            Five dedicated studios, each crafted for a specific Pilates discipline. Premium equipment, expert instruction, and an atmosphere built for focused, intentional movement.
                        </p>
                    </motion.div>
                </div>

                {/* Zone Explorer */}
                <div className="space-y-8">
                    {/* Zone Tabs */}
                    <div className="flex overflow-x-auto gap-2 pb-2 scrollbar-hide -mx-4 px-4 md:mx-0 md:px-0">
                        {AMENITY_ZONES.map((zone) => {
                            const IconComp = zone.icon
                            return (
                                <button
                                    key={zone.id}
                                    onClick={() => setActiveZone(zone.id)}
                                    className={`flex items-center gap-2 px-5 py-3 text-sm font-bold whitespace-nowrap transition-all duration-200 border ${
                                        activeZone === zone.id
                                            ? "bg-terra-400 text-peach-50 border-terra-400"
                                            : "bg-transparent text-olive-400 border-peach-400/20 hover:border-olive-300/30 hover:text-olive-600"
                                    }`}
                                >
                                    <IconComp className="w-4 h-4" />
                                    {zone.name}
                                </button>
                            )
                        })}
                    </div>

                    {/* Active Zone Detail */}
                    {selectedZone && (
                        <motion.div
                            key={selectedZone.id}
                            initial={{ opacity: 0, y: 12 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 0.3 }}
                            className="grid grid-cols-1 lg:grid-cols-2 gap-8"
                        >
                            {/* Image */}
                            <div className="relative h-[320px] lg:h-[420px] overflow-hidden border border-peach-400/20">
                                <Image
                                    src={selectedZone.image}
                                    alt={selectedZone.name}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-warmDark-900/70 via-transparent to-transparent" />
                                <div className="absolute bottom-6 left-6">
                                    <span className="px-3 py-1.5 bg-terra-400 text-peach-50 text-xs font-bold uppercase tracking-wider">
                                        {selectedZone.name}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex flex-col justify-center space-y-6">
                                <div>
                                    <h3 className="text-3xl font-black text-olive-600 tracking-tight mb-4 font-display">{selectedZone.name}</h3>
                                    <p className="text-olive-300 text-base leading-relaxed">{selectedZone.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {selectedZone.features.map((feature) => (
                                        <div
                                            key={feature}
                                            className="flex items-center gap-3 bg-peach-50 border border-peach-400/20 px-4 py-3"
                                        >
                                            <div className="w-2 h-2 bg-terra-400 flex-shrink-0" />
                                            <span className="text-sm text-olive-400 font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link href="/user/schedule">
                                    <Button className="bg-terra-400 text-peach-50 hover:bg-terra-300 font-bold px-8 h-12 w-fit transition-all duration-200">
                                        Book a Class
                                        <ChevronRight className="w-4 h-4 ml-1" />
                                    </Button>
                                </Link>
                            </div>
                        </motion.div>
                    )}
                </div>

                {/* Facility Info Grid */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* Hours */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        className="bg-peach-50 border border-peach-400/20 p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-terra-400/10 flex items-center justify-center">
                                <Clock className="w-5 h-5 text-terra-400" />
                            </div>
                            <h3 className="text-lg font-bold text-olive-600">Operating Hours</h3>
                        </div>
                        <div className="space-y-4">
                            {FACILITY_HOURS.map((slot) => (
                                <div key={slot.day} className="flex items-center justify-between">
                                    <span className="text-olive-300 text-sm font-medium">{slot.day}</span>
                                    <span className="text-olive-600 text-sm font-bold">{slot.hours}</span>
                                </div>
                            ))}
                        </div>
                    </motion.div>

                    {/* Contact */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.1 }}
                        className="bg-peach-50 border border-peach-400/20 p-6"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-terra-400/10 flex items-center justify-center">
                                <Phone className="w-5 h-5 text-terra-400" />
                            </div>
                            <h3 className="text-lg font-bold text-olive-600">Contact</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-olive-300">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">(212) 555-0180</span>
                            </div>
                            <div className="flex items-center gap-3 text-olive-300">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">hello@solpilates.com</span>
                            </div>
                            <div className="flex items-start gap-3 text-olive-300">
                                <MapPin className="w-4 h-4 flex-shrink-0 mt-0.5" />
                                <span className="text-sm">250 West 54th Street<br />New York, NY 10019</span>
                            </div>
                        </div>
                    </motion.div>

                    {/* Quick Booking CTA */}
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ delay: 0.2 }}
                        className="bg-gradient-to-br from-terra-400/10 to-terra-400/5 border border-terra-400/20 p-6 flex flex-col justify-between"
                    >
                        <div>
                            <h3 className="text-lg font-bold text-olive-600 mb-3">Ready to Move?</h3>
                            <p className="text-olive-300 text-sm leading-relaxed mb-6">
                                Book your first session and experience what intentional movement in a purpose-built Pilates studio feels like.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <Link href="/subscription" className="block">
                                <Button className="w-full bg-terra-400 text-peach-50 hover:bg-terra-300 font-bold h-12 transition-all duration-200">
                                    View Membership Plans
                                </Button>
                            </Link>
                            <Link href="/user/schedule" className="block">
                                <Button variant="outline" className="w-full border-peach-400/20 text-olive-600 hover:bg-peach-200/50 font-bold h-12 transition-all duration-200">
                                    Browse Class Schedule
                                </Button>
                            </Link>
                        </div>
                    </motion.div>
                </div>
            </div>
        </div>
    )
}
