"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import { Clock, Phone, Mail, MapPin, Dumbbell, Waves, Shield, Zap, Heart, ChevronRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import Image from "next/image"
import Link from "next/link"

const AMENITY_ZONES = [
    {
        id: "strength",
        name: "Strength Floor",
        description: "12,000 sq ft of free weights, power racks, and plate-loaded machines. Rubberized Olympic platforms and dedicated deadlift zones.",
        icon: Dumbbell,
        image: "/images/gyms/fitpro-downtown.png",
        features: ["Olympic Platforms", "Power Racks", "Cable Machines", "Free Weights"],
    },
    {
        id: "cardio",
        name: "Cardio Lab",
        description: "Performance-tracked treadmills, assault bikes, rowers, and SkiErgs. Every machine connects to your profile for real-time metrics.",
        icon: Zap,
        image: "/images/gyms/fitpro-midtown.png",
        features: ["Smart Treadmills", "Assault Bikes", "Rowing Machines", "SkiErgs"],
    },
    {
        id: "yoga",
        name: "Yoga & Pilates Studio",
        description: "Infrared-heated hardwood studio with floor-to-ceiling mirrors. Reformer Pilates equipment and aerial yoga rigging.",
        icon: Heart,
        image: "/images/gyms/fitpro-uptown.png",
        features: ["Heated Studio", "Reformer Pilates", "Aerial Yoga", "Meditation Room"],
    },
    {
        id: "boxing",
        name: "Combat Zone",
        description: "Competition-grade boxing ring, heavy bags, speed bags, and MMA cage. Coached sessions available daily.",
        icon: Shield,
        image: "/images/gyms/fitpro-brooklyn.png",
        features: ["Boxing Ring", "Heavy Bags", "MMA Cage", "Speed Bags"],
    },
    {
        id: "recovery",
        name: "Recovery Sanctuary",
        description: "Full-spectrum recovery with cryotherapy chambers, compression boots, infrared saunas, and cold plunge pools.",
        icon: Waves,
        image: "/images/gyms/fitpro-queens.png",
        features: ["Cryotherapy", "Infrared Sauna", "Cold Plunge", "Compression Boots"],
    },
]

const FACILITY_HOURS = [
    { day: "Monday - Friday", hours: "05:00 AM - 11:00 PM" },
    { day: "Saturday", hours: "06:00 AM - 10:00 PM" },
    { day: "Sunday", hours: "07:00 AM - 9:00 PM" },
]

export default function FacilityPage() {
    const [activeZone, setActiveZone] = useState<string>("strength")

    const selectedZone = AMENITY_ZONES.find(z => z.id === activeZone)

    return (
        <div className="min-h-screen bg-[#0B0F19] pt-28 pb-20 px-4 md:px-8">
            <div className="container mx-auto space-y-16">
                {/* Hero Header */}
                <div className="max-w-3xl">
                    <motion.div
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                    >
                        <span className="text-coral-400/60 text-sm font-bold tracking-[0.3em] uppercase block mb-4">Our Facility</span>
                        <h1 className="text-4xl md:text-6xl font-black text-white tracking-tighter leading-[0.95] mb-6">
                            45,000 SQ FT OF<br />
                            DEDICATED<br />
                            TRAINING SPACE
                        </h1>
                        <p className="text-[#8892A4] text-lg max-w-xl leading-relaxed">
                            Five distinct training zones, each purpose-built and equipped with commercial-grade gear. Open 7 days a week with extended hours for early risers and night owls.
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
                                    className={`flex items-center gap-2 px-5 py-3 rounded-full text-sm font-bold whitespace-nowrap transition-all duration-200 border ${
                                        activeZone === zone.id
                                            ? "bg-coral-400 text-[#0B0F19] border-coral-400 shadow-[0_0_20px_rgba(255,106,61,0.3)]"
                                            : "bg-transparent text-[#8892A4] border-[#1A2238] hover:border-[#F0F2F5]/20 hover:text-[#F0F2F5]"
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
                            <div className="relative h-[320px] lg:h-[420px] overflow-hidden rounded-2xl border border-[#1A2238]">
                                <Image
                                    src={selectedZone.image}
                                    alt={selectedZone.name}
                                    fill
                                    className="object-cover"
                                />
                                <div className="absolute inset-0 bg-gradient-to-t from-[#0B0F19]/70 via-transparent to-transparent" />
                                <div className="absolute bottom-6 left-6">
                                    <span className="px-3 py-1.5 bg-coral-400 text-[#0B0F19] text-xs font-bold uppercase tracking-wider rounded-full">
                                        {selectedZone.name}
                                    </span>
                                </div>
                            </div>

                            {/* Content */}
                            <div className="flex flex-col justify-center space-y-6">
                                <div>
                                    <h3 className="text-3xl font-black text-white tracking-tight mb-4">{selectedZone.name}</h3>
                                    <p className="text-[#8892A4] text-base leading-relaxed">{selectedZone.description}</p>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    {selectedZone.features.map((feature) => (
                                        <div
                                            key={feature}
                                            className="flex items-center gap-3 bg-[#F0F2F5]/5 border border-[#1A2238] px-4 py-3 rounded-xl"
                                        >
                                            <div className="w-2 h-2 bg-coral-400 rounded-full flex-shrink-0" />
                                            <span className="text-sm text-[#F0F2F5]/80 font-medium">{feature}</span>
                                        </div>
                                    ))}
                                </div>

                                <Link href="/user/schedule">
                                    <Button className="bg-coral-400 text-[#0B0F19] hover:bg-coral-300 font-bold px-8 h-12 rounded-xl w-fit transition-all duration-200">
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
                        className="bg-[#131A2B] border border-[#1A2238] p-6 rounded-2xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-coral-400/10 rounded-xl flex items-center justify-center">
                                <Clock className="w-5 h-5 text-coral-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Operating Hours</h3>
                        </div>
                        <div className="space-y-4">
                            {FACILITY_HOURS.map((slot) => (
                                <div key={slot.day} className="flex items-center justify-between">
                                    <span className="text-[#8892A4] text-sm font-medium">{slot.day}</span>
                                    <span className="text-white text-sm font-bold">{slot.hours}</span>
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
                        className="bg-[#131A2B] border border-[#1A2238] p-6 rounded-2xl"
                    >
                        <div className="flex items-center gap-3 mb-6">
                            <div className="w-10 h-10 bg-coral-400/10 rounded-xl flex items-center justify-center">
                                <Phone className="w-5 h-5 text-coral-400" />
                            </div>
                            <h3 className="text-lg font-bold text-white">Contact</h3>
                        </div>
                        <div className="space-y-4">
                            <div className="flex items-center gap-3 text-[#8892A4]">
                                <Phone className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">(212) 555-0180</span>
                            </div>
                            <div className="flex items-center gap-3 text-[#8892A4]">
                                <Mail className="w-4 h-4 flex-shrink-0" />
                                <span className="text-sm">hello@fitconnectpro.com</span>
                            </div>
                            <div className="flex items-start gap-3 text-[#8892A4]">
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
                        className="bg-gradient-to-br from-coral-400/20 to-coral-400/5 border border-coral-400/20 p-6 rounded-2xl flex flex-col justify-between"
                    >
                        <div>
                            <h3 className="text-lg font-bold text-white mb-3">Ready to Train?</h3>
                            <p className="text-[#8892A4] text-sm leading-relaxed mb-6">
                                Book your first class and experience what 45,000 sq ft of dedicated training space feels like.
                            </p>
                        </div>
                        <div className="space-y-3">
                            <Link href="/subscription" className="block">
                                <Button className="w-full bg-coral-400 text-[#0B0F19] hover:bg-coral-300 font-bold h-12 rounded-xl transition-all duration-200">
                                    View Membership Plans
                                </Button>
                            </Link>
                            <Link href="/user/schedule" className="block">
                                <Button variant="outline" className="w-full border-[#1A2238] text-[#F0F2F5] hover:bg-[#F0F2F5]/5 font-bold h-12 rounded-xl transition-all duration-200">
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
