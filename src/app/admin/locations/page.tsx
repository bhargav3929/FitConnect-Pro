"use client"

import { useState } from "react"
import { motion } from "framer-motion"
import {
    MapPin,
    Phone,
    Mail,
    Clock,
    Edit,
    Save,
    Dumbbell,
    Users,
    Calendar,
    Shield,
} from "lucide-react"
import { toast } from "sonner"

// Single facility data
const FACILITY_DATA = {
    name: "SOL Pilates",
    address: "250 West 54th Street, New York, NY 10019",
    phone: "(212) 555-0180",
    email: "hello@solpilates.com",
    hours: {
        weekday: "5:00 AM - 11:00 PM",
        saturday: "6:00 AM - 10:00 PM",
        sunday: "7:00 AM - 9:00 PM",
    },
    trainers: 8,
    activeClasses: 24,
    totalMembers: 2847,
    sqft: "45,000",
    zones: [
        "Performance Training Floor",
        "Heated Yoga Studio",
        "Indoor Cycling Theater",
        "Olympic Lifting Platform",
        "Recovery Lounge",
        "Private Training Suites",
        "Smoothie Bar",
        "Sauna & Steam Room",
    ],
    description:
        "SOL Pilates is a 45,000 sq ft premium fitness facility featuring five distinct training zones, each purpose-built and equipped with commercial-grade gear. Open 7 days a week with extended hours.",
}

export default function FacilitySettingsPage() {
    const [isEditing, setIsEditing] = useState(false)

    const handleSave = () => {
        setIsEditing(false)
        toast.success("Facility details updated successfully")
    }

    return (
        <div className="space-y-6 pb-20 lg:pb-0 max-w-5xl">
            {/* Header */}
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                <div>
                    <h2 className="text-2xl font-black text-sand-200 font-display">Facility Settings</h2>
                    <p className="text-sage-500 text-sm mt-1">
                        Manage your facility details, hours, and amenities
                    </p>
                </div>
                <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    className="px-6 py-3 bg-gold-400 text-forest-700 font-bold text-sm tracking-wider hover:bg-gold-300 transition-all flex items-center gap-2 w-fit"
                >
                    {isEditing ? (
                        <>
                            <Save className="w-4 h-4" />
                            SAVE CHANGES
                        </>
                    ) : (
                        <>
                            <Edit className="w-4 h-4" />
                            EDIT DETAILS
                        </>
                    )}
                </button>
            </div>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                {[
                    { label: "Active Trainers", value: FACILITY_DATA.trainers, icon: Users },
                    { label: "Weekly Classes", value: FACILITY_DATA.activeClasses, icon: Calendar },
                    { label: "Active Members", value: FACILITY_DATA.totalMembers.toLocaleString(), icon: Shield },
                    { label: "Facility Size", value: `${FACILITY_DATA.sqft} sqft`, icon: Dumbbell },
                ].map((stat, idx) => (
                    <motion.div
                        key={stat.label}
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.1 }}
                        className="bg-forest-800 border border-forest-600 p-5"
                    >
                        <stat.icon className="w-5 h-5 text-sage-400 mb-3" />
                        <p className="text-2xl font-black text-sand-200">{stat.value}</p>
                        <p className="text-xs text-sage-500 tracking-wider uppercase mt-1">{stat.label}</p>
                    </motion.div>
                ))}
            </div>

            {/* Facility Details */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-forest-700 border border-forest-600 p-6"
            >
                <h3 className="text-lg font-bold text-sand-200 mb-6">General Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block text-xs font-bold text-sage-400 tracking-wider mb-2">
                            FACILITY NAME
                        </label>
                        <input
                            type="text"
                            defaultValue={FACILITY_DATA.name}
                            disabled={!isEditing}
                            className={`w-full h-12 px-4 bg-sand-200/5 border border-forest-600 text-sand-200 focus:border-gold-400/50 focus:outline-none ${!isEditing && 'opacity-70 cursor-not-allowed'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-sage-400 tracking-wider mb-2">
                            ADDRESS
                        </label>
                        <input
                            type="text"
                            defaultValue={FACILITY_DATA.address}
                            disabled={!isEditing}
                            className={`w-full h-12 px-4 bg-sand-200/5 border border-forest-600 text-sand-200 focus:border-gold-400/50 focus:outline-none ${!isEditing && 'opacity-70 cursor-not-allowed'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-sage-400 tracking-wider mb-2">
                            PHONE
                        </label>
                        <input
                            type="text"
                            defaultValue={FACILITY_DATA.phone}
                            disabled={!isEditing}
                            className={`w-full h-12 px-4 bg-sand-200/5 border border-forest-600 text-sand-200 focus:border-gold-400/50 focus:outline-none ${!isEditing && 'opacity-70 cursor-not-allowed'}`}
                        />
                    </div>
                    <div>
                        <label className="block text-xs font-bold text-sage-400 tracking-wider mb-2">
                            EMAIL
                        </label>
                        <input
                            type="text"
                            defaultValue={FACILITY_DATA.email}
                            disabled={!isEditing}
                            className={`w-full h-12 px-4 bg-sand-200/5 border border-forest-600 text-sand-200 focus:border-gold-400/50 focus:outline-none ${!isEditing && 'opacity-70 cursor-not-allowed'}`}
                        />
                    </div>
                </div>

                {/* Description */}
                <div className="mt-6">
                    <label className="block text-xs font-bold text-sage-400 tracking-wider mb-2">
                        DESCRIPTION
                    </label>
                    <textarea
                        defaultValue={FACILITY_DATA.description}
                        disabled={!isEditing}
                        rows={3}
                        className={`w-full px-4 py-3 bg-sand-200/5 border border-forest-600 text-sand-200 focus:border-gold-400/50 focus:outline-none resize-none ${!isEditing && 'opacity-70 cursor-not-allowed'}`}
                    />
                </div>
            </motion.div>

            {/* Operating Hours */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.3 }}
                className="bg-forest-700 border border-forest-600 p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Clock className="w-5 h-5 text-sage-400" />
                    <h3 className="text-lg font-bold text-sand-200">Operating Hours</h3>
                </div>
                <div className="space-y-4">
                    {[
                        { label: "Monday - Friday", value: FACILITY_DATA.hours.weekday },
                        { label: "Saturday", value: FACILITY_DATA.hours.saturday },
                        { label: "Sunday", value: FACILITY_DATA.hours.sunday },
                    ].map((slot) => (
                        <div key={slot.label} className="flex items-center justify-between py-3 border-b border-forest-600/50 last:border-0">
                            <span className="text-sage-400 font-medium">{slot.label}</span>
                            {isEditing ? (
                                <input
                                    type="text"
                                    defaultValue={slot.value}
                                    className="w-48 h-10 px-4 bg-sand-200/5 border border-forest-600 text-sand-200 text-right focus:border-gold-400/50 focus:outline-none"
                                />
                            ) : (
                                <span className="text-sand-200 font-bold">{slot.value}</span>
                            )}
                        </div>
                    ))}
                </div>
            </motion.div>

            {/* Amenities & Zones */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 }}
                className="bg-forest-700 border border-forest-600 p-6"
            >
                <div className="flex items-center gap-3 mb-6">
                    <Dumbbell className="w-5 h-5 text-sage-400" />
                    <h3 className="text-lg font-bold text-sand-200">Training Zones & Amenities</h3>
                </div>
                <div className="flex flex-wrap gap-3">
                    {FACILITY_DATA.zones.map((zone) => (
                        <span
                            key={zone}
                            className="px-4 py-2 bg-sand-200/5 text-sand-200/80 text-sm font-medium border border-forest-600 hover:border-gold-400/30 transition-colors"
                        >
                            {zone}
                        </span>
                    ))}
                    {isEditing && (
                        <button className="px-4 py-2 border border-dashed border-forest-600 text-sage-500 text-sm font-medium hover:border-gold-400/50 hover:text-gold-400 transition-colors">
                            + Add Zone
                        </button>
                    )}
                </div>
            </motion.div>

            {/* Contact Information */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-forest-700 border border-forest-600 p-6"
            >
                <h3 className="text-lg font-bold text-sand-200 mb-6">Quick Contact Reference</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div className="flex items-start gap-3 text-sage-400">
                        <MapPin className="w-4 h-4 mt-0.5 flex-shrink-0" />
                        <span className="text-sm">{FACILITY_DATA.address}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sage-400">
                        <Phone className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{FACILITY_DATA.phone}</span>
                    </div>
                    <div className="flex items-center gap-3 text-sage-400">
                        <Mail className="w-4 h-4 flex-shrink-0" />
                        <span className="text-sm">{FACILITY_DATA.email}</span>
                    </div>
                </div>
            </motion.div>
        </div>
    )
}
