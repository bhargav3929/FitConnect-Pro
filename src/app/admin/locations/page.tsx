"use client"

import { useState, useEffect, useRef } from "react"
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
    Building2,
    Loader2,
} from "lucide-react"
import { toast } from "sonner"
import { getFacility, callUpdateFacility, getTrainers } from "@fitconnect/shared/firebase/firestore"
import { GymCenter } from "@fitconnect/shared/types/gym"

export default function FacilitySettingsPage() {
    const [isLoading, setIsLoading] = useState(true)
    const [isEditing, setIsEditing] = useState(false)
    const [isSaving, setIsSaving] = useState(false)
    const [facility, setFacility] = useState<GymCenter | null>(null)
    const [trainerCount, setTrainerCount] = useState(0)

    // Form refs for editable fields
    const nameRef = useRef<HTMLInputElement>(null)
    const streetRef = useRef<HTMLInputElement>(null)
    const cityRef = useRef<HTMLInputElement>(null)
    const stateRef = useRef<HTMLInputElement>(null)
    const zipRef = useRef<HTMLInputElement>(null)
    const countryRef = useRef<HTMLInputElement>(null)
    const phoneRef = useRef<HTMLInputElement>(null)
    const emailRef = useRef<HTMLInputElement>(null)
    const facilitiesRef = useRef<HTMLTextAreaElement>(null)

    useEffect(() => {
        async function load() {
            try {
                const [facilityData, trainers] = await Promise.all([
                    getFacility(),
                    getTrainers(),
                ])
                if (facilityData) {
                    // Ensure nested objects exist to prevent runtime errors
                    facilityData.address = facilityData.address || { street: '', city: '', state: '', zip: '', country: '' }
                    facilityData.contactInfo = facilityData.contactInfo || { phone: '', email: '' }
                    facilityData.operatingHours = facilityData.operatingHours || {}
                    facilityData.coordinates = facilityData.coordinates || { lat: 0, lng: 0 }
                }
                setFacility(facilityData)
                setTrainerCount(trainers.length)
            } catch {
                toast.error("Failed to load facility data")
            } finally {
                setIsLoading(false)
            }
        }
        load()
    }, [])

    const handleSave = async () => {
        if (!facility) return
        setIsSaving(true)
        try {
            await callUpdateFacility({
                facilityId: facility.id,
                name: nameRef.current?.value ?? facility.name,
                address: {
                    street: streetRef.current?.value ?? facility.address.street,
                    city: cityRef.current?.value ?? facility.address.city,
                    state: stateRef.current?.value ?? facility.address.state,
                    zip: zipRef.current?.value ?? facility.address.zip,
                    country: countryRef.current?.value ?? facility.address.country,
                },
                contactInfo: {
                    phone: phoneRef.current?.value ?? facility.contactInfo.phone,
                    email: emailRef.current?.value ?? facility.contactInfo.email,
                },
                facilities: facilitiesRef.current?.value ?? facility.facilities,
            })
            // Reload to get updated data
            const updated = await getFacility()
            setFacility(updated)
            setIsEditing(false)
            toast.success("Facility details updated successfully")
        } catch {
            toast.error("Failed to save facility details")
        } finally {
            setIsSaving(false)
        }
    }

    const fullAddress = facility
        ? [
            facility.address.street,
            facility.address.city,
            [facility.address.state, facility.address.zip].filter(Boolean).join(" "),
            facility.address.country,
        ].filter(Boolean).join(", ")
        : ""

    // Parse facilities into zones array (may be string or array)
    const zones = facility?.facilities
        ? Array.isArray(facility.facilities)
            ? facility.facilities
            : typeof facility.facilities === 'string'
                ? facility.facilities.split(/[,\n]/).map((s: string) => s.trim()).filter(Boolean)
                : []
        : []

    if (isLoading) {
        return (
            <div className="space-y-8 pb-20 lg:pb-0 max-w-5xl">
                <div className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-peach-400/20">
                    <div>
                        <div className="h-12 w-48 bg-peach-300/30 rounded animate-pulse mb-2" />
                        <div className="h-5 w-80 bg-peach-300/20 rounded animate-pulse" />
                    </div>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    {[1, 2, 3, 4].map(i => (
                        <div key={i} className="bg-peach-50 border border-peach-400/20 p-5">
                            <div className="w-5 h-5 bg-peach-300/30 rounded animate-pulse mb-3" />
                            <div className="h-8 w-16 bg-peach-300/30 rounded animate-pulse mb-1" />
                            <div className="h-3 w-24 bg-peach-300/20 rounded animate-pulse" />
                        </div>
                    ))}
                </div>
                <div className="bg-peach-50 border border-peach-400/20 p-8">
                    <div className="h-6 w-48 bg-peach-300/30 rounded animate-pulse mb-6" />
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {[1, 2, 3, 4].map(i => (
                            <div key={i}>
                                <div className="h-3 w-24 bg-peach-300/20 rounded animate-pulse mb-2.5" />
                                <div className="h-12 bg-peach-200/30 rounded animate-pulse" />
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        )
    }

    if (!facility) {
        return (
            <div className="space-y-8 pb-20 lg:pb-0 max-w-5xl">
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="pb-6 border-b border-peach-400/20"
                >
                    <h2 className="app-page-title mb-2">Facility</h2>
                    <p className="text-olive-300 text-sm tracking-wide">No facility has been configured yet.</p>
                </motion.div>
                <div className="bg-peach-50 border border-peach-400/20 p-12 text-center">
                    <Building2 className="w-12 h-12 text-olive-300/40 mx-auto mb-4" />
                    <p className="text-olive-400 font-medium mb-1">No Facility Found</p>
                    <p className="text-olive-300 text-sm">Add a gym center in Firestore to manage facility details here.</p>
                </div>
            </div>
        )
    }

    return (
        <div className="space-y-8 pb-20 lg:pb-0 max-w-5xl">
            {/* Header */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="flex flex-col md:flex-row md:items-end justify-between gap-6 pb-6 border-b border-peach-400/20"
            >
                <div>
                    <h2 className="app-page-title mb-2">
                        Facility
                    </h2>
                    <p className="app-page-subtitle">
                        Manage your facility details, operating hours, training zones, and amenities.
                    </p>
                </div>
                <button
                    onClick={() => isEditing ? handleSave() : setIsEditing(true)}
                    disabled={isSaving}
                    className="px-6 py-3.5 bg-terra-400 text-peach-50 font-bold text-xs tracking-[0.2em] uppercase hover:bg-terra-300 transition-all flex items-center gap-2.5 w-fit hover:shadow-lg hover:shadow-terra-400/15 active:scale-[0.98] disabled:opacity-60"
                >
                    {isSaving ? (
                        <>
                            <Loader2 className="w-4 h-4 animate-spin" />
                            Saving...
                        </>
                    ) : isEditing ? (
                        <>
                            <Save className="w-4 h-4" />
                            Save Changes
                        </>
                    ) : (
                        <>
                            <Edit className="w-4 h-4" />
                            Edit Details
                        </>
                    )}
                </button>
            </motion.div>

            {/* Quick Stats */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 md:grid-cols-4 gap-4"
            >
                {[
                    { label: "Active Trainers", value: trainerCount, icon: Users },
                    { label: "Training Zones", value: zones.length, icon: Calendar },
                    { label: "Status", value: facility.isActive ? "Active" : "Inactive", icon: Shield },
                    { label: "Location", value: facility.address.city, icon: Building2 },
                ].map((stat) => (
                    <div
                        key={stat.label}
                        className="group relative overflow-hidden bg-peach-50 border border-peach-400/20 p-5 hover:border-terra-400/30 transition-all duration-500"
                    >
                        <div className="absolute top-0 right-0 w-24 h-24 bg-terra-400/5 rounded-full blur-2xl -mr-12 -mt-12 transition-opacity opacity-0 group-hover:opacity-100 duration-500" />
                        <stat.icon className="w-5 h-5 text-olive-300 mb-3 group-hover:text-terra-400 transition-colors" />
                        <p className="app-stat-value">{stat.value}</p>
                        <p className="app-stat-label mt-1">{stat.label}</p>
                    </div>
                ))}
            </motion.div>

            {/* General Information */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
                className="bg-peach-50 border border-peach-400/20 p-6 sm:p-8 hover:border-peach-400/30 transition-colors"
            >
                <div className="mb-8">
                    <h3 className="app-section-title mb-1">General Information</h3>
                    <p className="text-olive-300 text-xs tracking-wider uppercase">Core facility details</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                        <label className="block app-label mb-2.5">
                            Facility Name
                        </label>
                        <input
                            ref={nameRef}
                            type="text"
                            defaultValue={facility.name}
                            disabled={!isEditing}
                            className={`w-full h-12 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:bg-peach-50 focus:outline-none transition-all duration-300 ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                        />
                    </div>
                    <div>
                        <label className="block app-label mb-2.5">
                            Street Address
                        </label>
                        <input
                            ref={streetRef}
                            type="text"
                            defaultValue={facility.address.street}
                            disabled={!isEditing}
                            className={`w-full h-12 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:bg-peach-50 focus:outline-none transition-all duration-300 ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                        />
                    </div>
                    <div className="grid grid-cols-3 gap-3">
                        <div>
                            <label className="block app-label mb-2.5">City</label>
                            <input
                                ref={cityRef}
                                type="text"
                                defaultValue={facility.address.city}
                                disabled={!isEditing}
                                className={`w-full h-12 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:bg-peach-50 focus:outline-none transition-all duration-300 ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                            />
                        </div>
                        <div>
                            <label className="block app-label mb-2.5">State</label>
                            <input
                                ref={stateRef}
                                type="text"
                                defaultValue={facility.address.state}
                                disabled={!isEditing}
                                className={`w-full h-12 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:bg-peach-50 focus:outline-none transition-all duration-300 ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                            />
                        </div>
                        <div>
                            <label className="block app-label mb-2.5">ZIP</label>
                            <input
                                ref={zipRef}
                                type="text"
                                defaultValue={facility.address.zip}
                                disabled={!isEditing}
                                className={`w-full h-12 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:bg-peach-50 focus:outline-none transition-all duration-300 ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                            />
                        </div>
                    </div>
                    <div>
                        <label className="block app-label mb-2.5">Country</label>
                        <input
                            ref={countryRef}
                            type="text"
                            defaultValue={facility.address.country}
                            disabled={!isEditing}
                            className={`w-full h-12 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:bg-peach-50 focus:outline-none transition-all duration-300 ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div>
                            <label className="block app-label mb-2.5">Phone</label>
                            <input
                                ref={phoneRef}
                                type="text"
                                defaultValue={facility.contactInfo.phone}
                                disabled={!isEditing}
                                className={`w-full h-12 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:bg-peach-50 focus:outline-none transition-all duration-300 ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                            />
                        </div>
                        <div>
                            <label className="block app-label mb-2.5">Email</label>
                            <input
                                ref={emailRef}
                                type="text"
                                defaultValue={facility.contactInfo.email}
                                disabled={!isEditing}
                                className={`w-full h-12 px-4 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:bg-peach-50 focus:outline-none transition-all duration-300 ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                            />
                        </div>
                    </div>
                </div>

                {/* Facilities / Description */}
                <div className="mt-6">
                    <label className="block app-label mb-2.5">
                        Facilities & Description
                    </label>
                    <textarea
                        ref={facilitiesRef}
                        defaultValue={facility.facilities}
                        disabled={!isEditing}
                        rows={3}
                        className={`w-full px-4 py-3 bg-peach-200/30 border border-peach-400/15 text-olive-600 focus:border-terra-400/50 focus:bg-peach-50 focus:outline-none transition-all duration-300 resize-none ${!isEditing && 'opacity-60 cursor-not-allowed'}`}
                    />
                </div>
            </motion.div>

            {/* Operating Hours */}
            {facility.operatingHours && Object.keys(facility.operatingHours).length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.3 }}
                    className="bg-peach-50 border border-peach-400/20 p-6 sm:p-8 hover:border-peach-400/30 transition-colors"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-peach-200/60 flex items-center justify-center">
                            <Clock className="w-5 h-5 text-olive-400" />
                        </div>
                        <div>
                            <h3 className="app-card-title">Operating Hours</h3>
                            <p className="text-olive-300 text-xs tracking-wider uppercase">Weekly schedule</p>
                        </div>
                    </div>
                    <div className="space-y-1">
                        {Object.entries(facility.operatingHours).map(([day, hours], idx) => (
                            <motion.div
                                key={day}
                                initial={{ opacity: 0, x: -10 }}
                                animate={{ opacity: 1, x: 0 }}
                                transition={{ delay: 0.35 + idx * 0.05 }}
                                className="flex items-center justify-between py-4 border-b border-peach-400/8 last:border-0 hover:bg-peach-100/40 -mx-2 px-2 transition-colors rounded-sm"
                            >
                                <span className="text-olive-400 font-medium text-sm capitalize">{day}</span>
                                <span className="text-olive-600 font-bold text-sm">
                                    {hours.open} - {hours.close}
                                </span>
                            </motion.div>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Training Zones & Amenities */}
            {zones.length > 0 && (
                <motion.div
                    initial={{ opacity: 0, y: 20 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ delay: 0.4 }}
                    className="bg-peach-50 border border-peach-400/20 p-6 sm:p-8 hover:border-peach-400/30 transition-colors"
                >
                    <div className="flex items-center gap-3 mb-8">
                        <div className="w-10 h-10 bg-peach-200/60 flex items-center justify-center">
                            <Dumbbell className="w-5 h-5 text-olive-400" />
                        </div>
                        <div>
                            <h3 className="app-card-title">Training Zones & Amenities</h3>
                            <p className="text-olive-300 text-xs tracking-wider uppercase">{zones.length} areas configured</p>
                        </div>
                    </div>
                    <div className="flex flex-wrap gap-3">
                        {zones.map((zone, idx) => (
                            <motion.span
                                key={zone}
                                initial={{ opacity: 0, scale: 0.9 }}
                                animate={{ opacity: 1, scale: 1 }}
                                transition={{ delay: 0.45 + idx * 0.04 }}
                                className="px-4 py-2.5 bg-peach-200/40 app-body font-medium border border-peach-400/15 hover:border-terra-400/30 hover:bg-peach-200/60 transition-all cursor-default"
                            >
                                {zone}
                            </motion.span>
                        ))}
                    </div>
                </motion.div>
            )}

            {/* Contact Reference */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.5 }}
                className="bg-peach-50 border border-peach-400/20 p-6 sm:p-8 hover:border-peach-400/30 transition-colors"
            >
                <div className="mb-8">
                    <h3 className="app-section-title mb-1">Quick Contact Reference</h3>
                    <p className="text-olive-300 text-xs tracking-wider uppercase">Facility contact details at a glance</p>
                </div>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {[
                        { icon: MapPin, value: fullAddress, label: "Address" },
                        { icon: Phone, value: facility.contactInfo.phone, label: "Phone" },
                        { icon: Mail, value: facility.contactInfo.email, label: "Email" },
                    ].map((item, idx) => (
                        <motion.div
                            key={item.label}
                            initial={{ opacity: 0, y: 10 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ delay: 0.55 + idx * 0.05 }}
                            className="flex items-start gap-3 group"
                        >
                            <div className="w-8 h-8 bg-peach-200/50 flex items-center justify-center flex-shrink-0 group-hover:bg-terra-400/10 transition-colors">
                                <item.icon className="w-4 h-4 text-olive-300 group-hover:text-terra-400 transition-colors" />
                            </div>
                            <div>
                                <p className="app-stat-label mb-1">{item.label}</p>
                                <p className="app-body font-medium">{item.value}</p>
                            </div>
                        </motion.div>
                    ))}
                </div>
            </motion.div>
        </div>
    )
}
