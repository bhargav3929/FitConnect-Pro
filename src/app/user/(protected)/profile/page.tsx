"use client"

import { useState, useRef } from "react"
import { useClientAuthStore } from "@fitconnect/shared/stores/clientAuthStore"
import { motion } from "framer-motion"
import {
    Mail,
    CreditCard,
    LogOut,
    ChevronRight,
    Flame,
    Trophy,
    Target,
    HelpCircle,
    Shield,
    Lock,
    ArrowRight,
    Calendar,
    Star,
    Eye,
    EyeOff,
    Loader2,
    Camera,
    CheckCircle2,
    XCircle,
    AlertTriangle,
    Trash2,
    MapPin,
} from "lucide-react"
import { Button } from "@/components/ui/button"
import { useRouter } from "next/navigation"
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar"
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth"
import { doc, updateDoc } from "firebase/firestore"
import { auth, db } from "@fitconnect/shared/firebase/config"

import { callCancelSubscription } from "@fitconnect/shared/firebase/firestore"
import { getPlanById } from "@fitconnect/shared/types/subscription"
import { toast } from "sonner"
import Link from "next/link"
import { AnimatePresence, motion as m } from "framer-motion"

export default function ProfilePage() {
    const { clientUser, firebaseUser, logoutClient, refreshSubscription } = useClientAuthStore()
    const router = useRouter()
    const [showPasswordSection, setShowPasswordSection] = useState(false)
    const [showCancelConfirm, setShowCancelConfirm] = useState(false)
    const [isCancelling, setIsCancelling] = useState(false)
    const [showDeleteConfirm, setShowDeleteConfirm] = useState(false)
    const [isDeleting, setIsDeleting] = useState(false)
    const [currentPassword, setCurrentPassword] = useState('')
    const [newPassword, setNewPassword] = useState('')
    const [confirmPassword, setConfirmPassword] = useState('')
    const [showCurrent, setShowCurrent] = useState(false)
    const [showNew, setShowNew] = useState(false)
    const [isChangingPassword, setIsChangingPassword] = useState(false)
    const [isUploadingAvatar, setIsUploadingAvatar] = useState(false)
    const [avatarCacheBust, setAvatarCacheBust] = useState('')
    const [showPersonalDetails, setShowPersonalDetails] = useState(false)
    const [isSavingPersonalDetails, setIsSavingPersonalDetails] = useState(false)
    const [addrLine1, setAddrLine1] = useState('')
    const [addrLine2, setAddrLine2] = useState('')
    const [addrCity, setAddrCity] = useState('')
    const [addrState, setAddrState] = useState('')
    const [addrPincode, setAddrPincode] = useState('')
    const [ecName, setEcName] = useState('')
    const [ecPhone, setEcPhone] = useState('')
    const [ecRelationship, setEcRelationship] = useState('')
    const avatarInputRef = useRef<HTMLInputElement>(null)

    const handleAvatarSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0]
        e.target.value = ''
        if (!file) return

        if (!firebaseUser) {
            toast.error('You must be signed in to update your photo')
            return
        }

        console.log('[avatar] step 1: getting ID token')
        setIsUploadingAvatar(true)
        try {
            const t0 = Date.now()
            const idToken = await firebaseUser.getIdToken()
            console.log(`[avatar] step 1 done in ${Date.now()-t0}ms`)

            console.log('[avatar] step 2: posting to /api/account/upload-avatar, file size:', file.size)
            const t1 = Date.now()
            const formData = new FormData()
            formData.append('avatar', file)
            const res = await fetch('/api/account/upload-avatar', {
                method: 'POST',
                headers: { Authorization: `Bearer ${idToken}` },
                body: formData,
            })
            console.log(`[avatar] step 2 done in ${Date.now()-t1}ms, status:`, res.status)

            if (!res.ok) {
                const body = await res.text()
                console.log('[avatar] error body:', body)
                throw new Error(`Upload failed: ${res.status}`)
            }
            const json = await res.json()
            console.log('[avatar] success, url:', json.url)
            setAvatarCacheBust(`?t=${Date.now()}`)
            await refreshSubscription()
            toast.success('Profile photo updated')
        } catch (err: unknown) {
            console.log('[avatar] CAUGHT ERROR:', err)
            toast.error(err instanceof Error ? err.message : 'Failed to update photo')
        } finally {
            setIsUploadingAvatar(false)
        }
    }

    const handleLogout = async () => {
        await logoutClient()
        router.push('/')
    }

    const handleChangePassword = async () => {
        if (!newPassword || newPassword.length < 6) {
            toast.error('Password must be at least 6 characters')
            return
        }
        if (newPassword !== confirmPassword) {
            toast.error('Passwords do not match')
            return
        }
        if (!currentPassword) {
            toast.error('Please enter your current password')
            return
        }

        setIsChangingPassword(true)
        try {
            const user = auth.currentUser
            if (!user || !user.email) throw new Error('Not authenticated')
            const credential = EmailAuthProvider.credential(user.email, currentPassword)
            await reauthenticateWithCredential(user, credential)
            await updatePassword(user, newPassword)
            toast.success('Password updated successfully')
            setShowPasswordSection(false)
            setCurrentPassword('')
            setNewPassword('')
            setConfirmPassword('')
        } catch (err: unknown) {
            const code = (err as { code?: string }).code || ''
            if (code === 'auth/wrong-password' || code === 'auth/invalid-credential') {
                toast.error('Current password is incorrect')
            } else if (code === 'auth/weak-password') {
                toast.error('New password is too weak')
            } else {
                toast.error('Failed to update password. Please try again.')
            }
        } finally {
            setIsChangingPassword(false)
        }
    }

    const handleDeleteAccount = async () => {
        setIsDeleting(true)
        try {
            const token = await auth.currentUser?.getIdToken()
            if (!token) throw new Error('Not authenticated')
            const res = await fetch('/api/account/delete', {
                method: 'POST',
                headers: { Authorization: `Bearer ${token}` },
            })
            const data = await res.json()
            if (!res.ok) throw new Error(data.error || 'Failed to delete account')
            toast.success('Account deleted')
            await logoutClient()
            router.push('/')
        } catch (err: unknown) {
            toast.error(err instanceof Error ? err.message : 'Failed to delete account')
            setIsDeleting(false)
        }
    }

    const handleCancelSubscription = async () => {
        setIsCancelling(true)
        try {
            const result = await callCancelSubscription()
            await refreshSubscription()
            setShowCancelConfirm(false)
            toast.success(result.mode === 'immediate' ? 'Plan cancelled' : 'Renewal cancelled', {
                description: result.mode === 'immediate'
                    ? 'Your plan has been cancelled.'
                    : 'Your membership stays active until the current period ends.',
            })
        } catch (err: unknown) {
            toast.error('Error', { description: err instanceof Error ? err.message : 'Failed to cancel' })
        } finally {
            setIsCancelling(false)
        }
    }

    const openPersonalDetails = () => {
        setAddrLine1(clientUser?.address?.line1 ?? '')
        setAddrLine2(clientUser?.address?.line2 ?? '')
        setAddrCity(clientUser?.address?.city ?? '')
        setAddrState(clientUser?.address?.state ?? '')
        setAddrPincode(clientUser?.address?.pincode ?? '')
        setEcName(clientUser?.emergencyContact?.name ?? '')
        setEcPhone(clientUser?.emergencyContact?.phone ?? '')
        setEcRelationship(clientUser?.emergencyContact?.relationship ?? '')
        setShowPersonalDetails(true)
    }

    const handleSavePersonalDetails = async () => {
        const uid = (firebaseUser ?? auth.currentUser)?.uid
        if (!uid) return
        setIsSavingPersonalDetails(true)
        try {
            await updateDoc(doc(db, 'users', uid), {
                address: { line1: addrLine1, line2: addrLine2, city: addrCity, state: addrState, pincode: addrPincode },
                emergencyContact: { name: ecName, phone: ecPhone, relationship: ecRelationship },
            })
            await refreshSubscription()
            setShowPersonalDetails(false)
            toast.success('Personal details saved')
        } catch {
            toast.error('Failed to save personal details')
        } finally {
            setIsSavingPersonalDetails(false)
        }
    }

    if (!clientUser) {
        return (
            <div className="max-w-2xl mx-auto space-y-6 pb-24">
                <div className="rounded-2xl bg-gradient-to-br from-peach-300/60 via-peach-200 to-peach-100 p-8 animate-pulse">
                    <div className="flex items-center gap-5">
                        <div className="w-20 h-20 rounded-full bg-olive-400/10" />
                        <div className="flex-1 space-y-2">
                            <div className="h-6 w-40 bg-olive-400/10 rounded" />
                            <div className="h-4 w-56 bg-olive-400/5 rounded" />
                        </div>
                    </div>
                </div>
                <div className="h-48 bg-peach-200/40 rounded-2xl animate-pulse" />
            </div>
        )
    }

    const initials = clientUser.name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2)
    const sub = clientUser.subscription
    const hasPlan = sub.planId && sub.status === 'active'
    const isIntroPlan = sub.planId === 'drop_in'
    const currentPlan = sub.planId ? getPlanById(sub.planId) : null
    const isMembershipPlan = sub.planCategory === 'membership' || currentPlan?.category === 'membership'
    const isUnlimited = !isIntroPlan && sub.classesRemaining === null
    const displayedCredits = isIntroPlan ? sub.introCreditRemaining : sub.classesRemaining
    const planLabel = sub.planId?.replace(/_/g, ' ').replace(/\b\w/g, c => c.toUpperCase()) || 'Free'
    const daysLeft = sub.endDate ? Math.max(0, Math.ceil((new Date(sub.endDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24))) : 0
    const renewalDate = sub.endDate ? new Date(sub.endDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '—'
    const renewalCanceled = sub.cancelAtPeriodEnd === true
    const providerData = firebaseUser?.providerData ?? auth.currentUser?.providerData ?? []
    const hasPasswordProvider = providerData.some((provider) => provider.providerId === 'password')
    const hasGoogleProvider = providerData.some((provider) => provider.providerId === 'google.com')
    const hasAppleProvider = providerData.some((provider) => provider.providerId === 'apple.com')
    const shouldShowPasswordChange = providerData.length === 0 || hasPasswordProvider
    const externalProviderLabel =
        hasAppleProvider && hasGoogleProvider
            ? 'Apple or Google'
            : hasAppleProvider
                ? 'Apple'
                : hasGoogleProvider
                    ? 'Google'
                    : 'your sign-in provider'

    const inputClasses = "w-full bg-peach-100 border border-peach-400/20 rounded-xl px-4 py-3 text-olive-600 text-sm font-medium placeholder:text-olive-300/50 focus:outline-none focus:ring-2 focus:ring-terra-400/30 focus:border-terra-400/40 transition-all"

    return (
        <div className="max-w-2xl mx-auto space-y-6 pb-24">

            {/* ═══════════ PROFILE HERO CARD ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-peach-300 via-peach-200 to-peach-100 p-6 md:p-8"
            >
                <div className="absolute -top-16 -right-16 w-48 h-48 rounded-full bg-terra-400/5" />
                <div className="absolute -bottom-10 -left-10 w-36 h-36 rounded-full bg-olive-400/5" />

                <div className="relative z-10">
                    <div className="flex items-center gap-5 mb-6">
                        <div className="relative h-20 w-20 flex-shrink-0">
                            <Avatar className="h-20 w-20 border-4 border-peach-50 shadow-lg">
                                <AvatarImage src={clientUser.avatar ? `${clientUser.avatar}${avatarCacheBust}` : undefined} className="object-cover" />
                                <AvatarFallback className="bg-gradient-to-br from-terra-400 to-terra-300 text-peach-50 font-bold text-xl">
                                    {initials}
                                </AvatarFallback>
                            </Avatar>
                            <button
                                type="button"
                                onClick={() => avatarInputRef.current?.click()}
                                disabled={isUploadingAvatar}
                                className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full bg-terra-400 text-peach-50 flex items-center justify-center shadow-md ring-2 ring-peach-50 hover:bg-terra-300 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-not-allowed"
                                aria-label="Change profile photo"
                            >
                                {isUploadingAvatar ? (
                                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                                ) : (
                                    <Camera className="w-3.5 h-3.5" />
                                )}
                            </button>
                            <input
                                ref={avatarInputRef}
                                type="file"
                                accept="image/jpeg,image/png,image/webp,image/gif"
                                onChange={handleAvatarSelect}
                                className="hidden"
                            />
                        </div>
                        <div className="flex-1 min-w-0">
                            <h1 className="app-hero-title truncate">{clientUser.name}</h1>
                            <p className="text-olive-300 text-sm flex items-center gap-1.5 mt-0.5 truncate">
                                <Mail className="w-3 h-3 flex-shrink-0" />
                                {clientUser.email}
                            </p>
                            <div className="flex items-center gap-2 mt-2">
                                <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full bg-terra-400/10 text-terra-400 app-badge-text">
                                    {planLabel} Plan
                                </span>
                            </div>
                        </div>
                    </div>

                    {/* Stats Row */}
                    <div className="flex items-center gap-0 bg-peach-50/60 rounded-xl divide-x divide-olive-400/8 overflow-hidden">
                        <div className="flex-1 py-4 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Trophy className="w-3.5 h-3.5 text-terra-400" />
                                <span className="text-xl font-black text-olive-600 leading-none">{clientUser.stats.totalClassesAttended}</span>
                            </div>
                            <p className="app-stat-label">Classes</p>
                        </div>
                        <div className="flex-1 py-4 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Star className="w-3.5 h-3.5 text-terra-300" />
                                <span className="text-xl font-black text-olive-600 leading-none">
                                    {isUnlimited ? '∞' : displayedCredits ?? 0}
                                </span>
                            </div>
                            <p className="app-stat-label">{isIntroPlan ? 'Demo Credit' : 'Credits Left'}</p>
                        </div>
                        <div className="flex-1 py-4 px-3 text-center">
                            <div className="flex items-center justify-center gap-1.5 mb-1">
                                <Flame className="w-3.5 h-3.5 text-terra-400" />
                                <span className="text-xl font-black text-olive-600 leading-none">{clientUser.stats.currentStreak}</span>
                            </div>
                            <p className="app-stat-label">Streak</p>
                        </div>
                    </div>
                </div>
            </motion.div>

            {/* ═══════════ MEMBERSHIP DETAILS ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.08 }}
            >
                <p className="app-label px-1 mb-3">Membership</p>
                <div className="bg-peach-50 border border-peach-400/15 rounded-2xl overflow-hidden">
                    {hasPlan ? (
                        <div className="p-5 space-y-4">
                            <div className="flex items-center justify-between">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-terra-400/10 flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-terra-400" />
                                    </div>
                                    <div>
                                        <p className="text-olive-600 font-bold text-sm">{planLabel}</p>
                                        <p className="text-olive-300 text-xs">
                                            {isMembershipPlan
                                                ? renewalCanceled ? 'Renewal canceled' : 'Auto-renewing'
                                                : 'Class pack'}
                                        </p>
                                    </div>
                                </div>
                                <span className={`px-2.5 py-1 rounded-full app-badge-text ring-1 ${
                                    renewalCanceled
                                        ? 'bg-yellow-500/10 text-yellow-700 ring-yellow-500/20'
                                        : 'bg-green-500/10 text-green-700 ring-green-500/20'
                                }`}>
                                    {renewalCanceled ? 'Renewal Canceled' : 'Active'}
                                </span>
                            </div>
                            <div className="grid grid-cols-3 gap-3 pt-3 border-t border-peach-400/10">
                                <div>
                                    <p className="app-stat-label mb-1">{isIntroPlan ? 'Demo Credit' : 'Credits'}</p>
                                    <p className="text-olive-600 font-black text-lg">{isUnlimited ? '∞' : displayedCredits}</p>
                                </div>
                                <div>
                                    <p className="app-stat-label mb-1">Days Left</p>
                                    <p className="text-olive-600 font-black text-lg">{daysLeft}</p>
                                </div>
                                <div>
                                    <p className="app-stat-label mb-1">
                                        {isMembershipPlan ? renewalCanceled ? 'Active Until' : 'Renews' : 'Expires'}
                                    </p>
                                    <p className="text-olive-600 font-bold text-xs">{renewalDate}</p>
                                </div>
                            </div>
                            <div className="flex gap-2 pt-2">
                                <Link href="/user/subscribe" className="flex-1">
                                    <Button className="w-full h-11 bg-terra-400 text-peach-50 hover:bg-terra-300 font-bold text-xs tracking-wider rounded-xl flex items-center justify-center gap-1.5">
                                        UPGRADE
                                        <ArrowRight className="w-3.5 h-3.5" />
                                    </Button>
                                </Link>
                                {isMembershipPlan && !renewalCanceled && (
                                    <button
                                        onClick={() => setShowCancelConfirm(true)}
                                        className="flex-1 h-11 rounded-xl border-2 border-terra-400 bg-terra-400/10 text-terra-400 font-black text-xs tracking-wider flex items-center justify-center gap-1.5 hover:bg-terra-400/20 transition-colors"
                                    >
                                        <XCircle className="w-3.5 h-3.5" />
                                        CANCEL RENEWAL
                                    </button>
                                )}
                            </div>

                            {/* Cancel confirmation */}
                            <AnimatePresence>
                                {showCancelConfirm && isMembershipPlan && (
                                    <m.div
                                        initial={{ opacity: 0, height: 0 }}
                                        animate={{ opacity: 1, height: 'auto' }}
                                        exit={{ opacity: 0, height: 0 }}
                                        className="overflow-hidden rounded-xl border border-terra-400/20 bg-terra-400/5 px-4 py-3 space-y-3 mt-1"
                                    >
                                        <div className="flex items-start gap-2.5">
                                            <AlertTriangle className="w-4 h-4 text-terra-400 shrink-0 mt-0.5" />
                                            <div>
                                                <p className="text-olive-600 font-bold text-xs">
                                                    {isMembershipPlan ? 'Cancel renewal?' : 'Cancel your plan?'}
                                                </p>
                                                <p className="text-olive-400 text-xs mt-0.5 leading-relaxed">
                                                    {isMembershipPlan
                                                        ? `You'll keep access until ${renewalDate}. No further charges.`
                                                        : 'Class packs do not auto-renew. Credits remain usable until the plan expires.'}
                                                </p>
                                            </div>
                                        </div>
                                        <div className="flex gap-2">
                                            <Button
                                                variant="outline"
                                                onClick={() => setShowCancelConfirm(false)}
                                                disabled={isCancelling}
                                                className="flex-1 h-8 border-peach-400/30 text-olive-400 font-bold text-xs rounded-lg"
                                            >
                                                KEEP PLAN
                                            </Button>
                                            <Button
                                                onClick={handleCancelSubscription}
                                                disabled={isCancelling}
                                                className="flex-1 h-8 bg-terra-400 hover:bg-terra-300 text-peach-50 font-bold text-xs rounded-lg disabled:opacity-50"
                                            >
                                                {isCancelling ? 'CANCELLING...' : isMembershipPlan ? 'YES, CANCEL RENEWAL' : 'YES, CANCEL'}
                                            </Button>
                                        </div>
                                    </m.div>
                                )}
                            </AnimatePresence>
                        </div>
                    ) : (
                        <Link href="/user/subscribe" className="block">
                            <div className="p-5 flex items-center justify-between group hover:bg-peach-100/60 transition-colors">
                                <div className="flex items-center gap-3">
                                    <div className="w-10 h-10 rounded-xl bg-terra-400/10 flex items-center justify-center">
                                        <CreditCard className="w-5 h-5 text-terra-400" />
                                    </div>
                                    <div>
                                        <p className="text-olive-600 font-bold text-sm">No Active Plan</p>
                                        <p className="text-olive-300 text-xs">Choose a plan to start booking classes</p>
                                    </div>
                                </div>
                                <ArrowRight className="w-4 h-4 text-terra-400 group-hover:translate-x-0.5 transition-transform" />
                            </div>
                        </Link>
                    )}
                </div>
            </motion.div>

            {/* ═══════════ QUICK ACTIONS ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.1 }}
                className="grid grid-cols-2 gap-3"
            >
                <Link href="/user/schedule">
                    <div className="bg-peach-50 border border-peach-400/15 rounded-2xl p-4 hover:border-terra-400/25 transition-all group text-center">
                        <div className="w-10 h-10 rounded-xl bg-terra-400/8 flex items-center justify-center mx-auto mb-2 group-hover:bg-terra-400/15 transition-colors">
                            <Calendar className="w-5 h-5 text-terra-400" />
                        </div>
                        <p className="text-olive-600 text-sm font-bold">Book a Class</p>
                        <p className="app-body text-xs mt-0.5">Browse schedule</p>
                    </div>
                </Link>
                <Link href="/user/bookings">
                    <div className="bg-peach-50 border border-peach-400/15 rounded-2xl p-4 hover:border-terra-400/25 transition-all group text-center">
                        <div className="w-10 h-10 rounded-xl bg-olive-400/8 flex items-center justify-center mx-auto mb-2 group-hover:bg-olive-400/15 transition-colors">
                            <Target className="w-5 h-5 text-olive-400" />
                        </div>
                        <p className="text-olive-600 text-sm font-bold">My Bookings</p>
                        <p className="app-body text-xs mt-0.5">View history</p>
                    </div>
                </Link>
            </motion.div>

            {/* ═══════════ PERSONAL DETAILS ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.13 }}
            >
                <div className="flex items-center justify-between px-1 mb-3">
                    <p className="app-label">Personal Details</p>
                    <button
                        onClick={openPersonalDetails}
                        className="text-xs font-bold text-terra-400 tracking-wider hover:text-terra-500 transition-colors"
                    >
                        {showPersonalDetails ? 'Cancel' : 'Edit'}
                    </button>
                </div>
                <div className="bg-peach-50 border border-peach-400/15 rounded-2xl p-4 space-y-4">
                    {/* Address */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <MapPin className="w-4 h-4 text-terra-400" />
                            <p className="text-xs font-bold text-olive-400 tracking-widest uppercase">Address</p>
                        </div>
                        {showPersonalDetails ? (
                            <div className="space-y-2">
                                <input className={inputClasses} placeholder="Address Line 1" value={addrLine1} onChange={e => setAddrLine1(e.target.value)} />
                                <input className={inputClasses} placeholder="Address Line 2 (optional)" value={addrLine2} onChange={e => setAddrLine2(e.target.value)} />
                                <div className="grid grid-cols-2 gap-2">
                                    <input className={inputClasses} placeholder="City" value={addrCity} onChange={e => setAddrCity(e.target.value)} />
                                    <input className={inputClasses} placeholder="State" value={addrState} onChange={e => setAddrState(e.target.value)} />
                                </div>
                                <input className={inputClasses} placeholder="Pin Code" value={addrPincode} onChange={e => setAddrPincode(e.target.value)} />
                            </div>
                        ) : clientUser.address?.line1 ? (
                            <div className="space-y-0.5 pl-1">
                                <p className="text-sm text-olive-600">{clientUser.address.line1}</p>
                                {clientUser.address.line2 && <p className="text-sm text-olive-600">{clientUser.address.line2}</p>}
                                <p className="text-sm text-olive-600">{[clientUser.address.city, clientUser.address.state, clientUser.address.pincode].filter(Boolean).join(', ')}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-olive-300 pl-1">No address added</p>
                        )}
                    </div>

                    <div className="border-t border-peach-400/15" />

                    {/* Emergency Contact */}
                    <div>
                        <div className="flex items-center gap-2 mb-2">
                            <Lock className="w-4 h-4 text-terra-400" />
                            <p className="text-xs font-bold text-olive-400 tracking-widest uppercase">Emergency Contact</p>
                        </div>
                        {showPersonalDetails ? (
                            <div className="space-y-2">
                                <input className={inputClasses} placeholder="Name" value={ecName} onChange={e => setEcName(e.target.value)} />
                                <input className={inputClasses} placeholder="Phone Number" value={ecPhone} onChange={e => setEcPhone(e.target.value)} />
                                <input className={inputClasses} placeholder="Relationship (e.g. Spouse, Parent, Friend)" value={ecRelationship} onChange={e => setEcRelationship(e.target.value)} />
                            </div>
                        ) : clientUser.emergencyContact?.name ? (
                            <div className="space-y-0.5 pl-1">
                                <p className="text-sm text-olive-600">{clientUser.emergencyContact.name}</p>
                                <p className="text-sm text-olive-600">{clientUser.emergencyContact.phone}</p>
                                <p className="text-sm text-olive-400">{clientUser.emergencyContact.relationship}</p>
                            </div>
                        ) : (
                            <p className="text-sm text-olive-300 pl-1">No emergency contact added</p>
                        )}
                    </div>

                    {showPersonalDetails && (
                        <Button
                            onClick={handleSavePersonalDetails}
                            disabled={isSavingPersonalDetails}
                            className="w-full h-11 bg-terra-400 hover:bg-terra-500 text-white font-black text-xs tracking-widest rounded-xl"
                        >
                            {isSavingPersonalDetails ? <Loader2 className="w-4 h-4 animate-spin" /> : 'Save'}
                        </Button>
                    )}
                </div>
            </motion.div>

            {/* ═══════════ SECURITY — CHANGE PASSWORD ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.15 }}
            >
                <p className="app-label px-1 mb-3">Security</p>
                <div className="bg-peach-50 border border-peach-400/15 rounded-2xl overflow-hidden">
                    {shouldShowPasswordChange ? (
                        <>
                            <button
                                onClick={() => setShowPasswordSection(!showPasswordSection)}
                                className="w-full flex items-center gap-4 p-4 hover:bg-peach-100/60 transition-colors group active:bg-peach-200/50"
                            >
                                <div className="w-9 h-9 rounded-xl bg-olive-400/8 flex items-center justify-center flex-shrink-0 text-olive-400">
                                    <Lock className="w-[18px] h-[18px]" />
                                </div>
                                <div className="flex-1 text-left min-w-0">
                                    <p className="text-olive-600 font-semibold text-sm">Change Password</p>
                                    <p className="text-olive-300 text-xs">Update your account password</p>
                                </div>
                                <ChevronRight className={`w-4 h-4 text-olive-300/30 transition-transform ${showPasswordSection ? 'rotate-90' : ''}`} />
                            </button>

                            {showPasswordSection && (
                                <motion.div
                                    initial={{ height: 0, opacity: 0 }}
                                    animate={{ height: 'auto', opacity: 1 }}
                                    className="px-4 pb-5 space-y-3 border-t border-peach-400/10"
                                >
                                    <div className="pt-4">
                                        <label className="app-label mb-1.5 block">Current Password</label>
                                        <div className="relative">
                                            <input
                                                type={showCurrent ? 'text' : 'password'}
                                                value={currentPassword}
                                                onChange={(e) => setCurrentPassword(e.target.value)}
                                                placeholder="Enter current password"
                                                className={inputClasses}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowCurrent(!showCurrent)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-olive-300/50 hover:text-olive-400"
                                            >
                                                {showCurrent ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="app-label mb-1.5 block">New Password</label>
                                        <div className="relative">
                                            <input
                                                type={showNew ? 'text' : 'password'}
                                                value={newPassword}
                                                onChange={(e) => setNewPassword(e.target.value)}
                                                placeholder="At least 6 characters"
                                                className={inputClasses}
                                            />
                                            <button
                                                type="button"
                                                onClick={() => setShowNew(!showNew)}
                                                className="absolute right-3 top-1/2 -translate-y-1/2 text-olive-300/50 hover:text-olive-400"
                                            >
                                                {showNew ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                                            </button>
                                        </div>
                                    </div>
                                    <div>
                                        <label className="app-label mb-1.5 block">Confirm New Password</label>
                                        <input
                                            type="password"
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            placeholder="Repeat new password"
                                            className={inputClasses}
                                        />
                                    </div>
                                    <Button
                                        onClick={handleChangePassword}
                                        disabled={isChangingPassword}
                                        className="w-full h-11 bg-terra-400 text-peach-50 hover:bg-terra-300 font-bold text-xs tracking-wider rounded-xl mt-2"
                                    >
                                        {isChangingPassword ? (
                                            <><Loader2 className="w-4 h-4 animate-spin mr-2" /> UPDATING...</>
                                        ) : (
                                            'UPDATE PASSWORD'
                                        )}
                                    </Button>
                                </motion.div>
                            )}
                        </>
                    ) : (
                        <div
                            className="w-full flex items-center gap-4 p-4"
                        >
                            <div className="w-9 h-9 rounded-xl bg-olive-400/8 flex items-center justify-center flex-shrink-0 text-olive-400">
                                <Shield className="w-[18px] h-[18px]" />
                            </div>
                            <div className="flex-1 text-left min-w-0">
                                <p className="text-olive-600 font-semibold text-sm">Signed in with {externalProviderLabel}</p>
                                <p className="text-olive-300 text-xs">Password is managed by {externalProviderLabel}</p>
                            </div>
                        </div>
                    )}
                </div>
            </motion.div>

            {/* ═══════════ SUPPORT ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.2 }}
            >
                <p className="app-label px-1 mb-3">Support</p>
                <div className="bg-peach-50 border border-peach-400/15 rounded-2xl divide-y divide-peach-400/10 overflow-hidden">
                    <button className="w-full flex items-center gap-4 p-4 hover:bg-peach-100/60 transition-colors group active:bg-peach-200/50">
                        <div className="w-9 h-9 rounded-xl bg-olive-400/8 flex items-center justify-center flex-shrink-0 text-olive-400">
                            <HelpCircle className="w-[18px] h-[18px]" />
                        </div>
                        <div className="flex-1 text-left">
                            <p className="text-olive-600 font-semibold text-sm">Help & FAQ</p>
                            <p className="text-olive-300 text-xs">Get answers to common questions</p>
                        </div>
                        <ChevronRight className="w-4 h-4 text-olive-300/30 group-hover:text-olive-300/60" />
                    </button>
                </div>
            </motion.div>

            {/* ═══════════ DANGER ZONE — DELETE ACCOUNT ═══════════ */}
            <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.22 }}
            >
                <p className="app-label px-1 mb-3">Danger Zone</p>
                <div className="bg-peach-50 border border-red-500/15 rounded-2xl overflow-hidden">
                    <button
                        onClick={() => setShowDeleteConfirm(!showDeleteConfirm)}
                        className="w-full flex items-center gap-4 p-4 hover:bg-red-500/5 transition-colors group active:bg-red-500/8"
                    >
                        <div className="w-9 h-9 rounded-xl bg-red-500/8 flex items-center justify-center flex-shrink-0">
                            <Trash2 className="w-[18px] h-[18px] text-red-500/60" />
                        </div>
                        <div className="flex-1 text-left min-w-0">
                            <p className="text-red-600 font-semibold text-sm">Delete Account</p>
                            <p className="text-olive-300 text-xs">Permanently remove your account and all data</p>
                        </div>
                        <ChevronRight className={`w-4 h-4 text-red-500/30 transition-transform ${showDeleteConfirm ? 'rotate-90' : ''}`} />
                    </button>
                    <AnimatePresence>
                        {showDeleteConfirm && (
                            <m.div
                                initial={{ opacity: 0, height: 0 }}
                                animate={{ opacity: 1, height: 'auto' }}
                                exit={{ opacity: 0, height: 0 }}
                                className="overflow-hidden border-t border-red-500/10 px-4 py-3 space-y-3 bg-red-500/5"
                            >
                                <div className="flex items-start gap-2.5">
                                    <AlertTriangle className="w-4 h-4 text-red-500/70 shrink-0 mt-0.5" />
                                    <div>
                                        <p className="text-red-700 font-bold text-xs">This cannot be undone</p>
                                        <p className="text-olive-400 text-xs mt-0.5 leading-relaxed">
                                            Your account, bookings, and subscription will be permanently deleted. Active billing will be cancelled immediately.
                                        </p>
                                    </div>
                                </div>
                                <div className="flex gap-2">
                                    <Button
                                        variant="outline"
                                        onClick={() => setShowDeleteConfirm(false)}
                                        disabled={isDeleting}
                                        className="flex-1 h-8 border-peach-400/30 text-olive-400 font-bold text-xs rounded-lg"
                                    >
                                        CANCEL
                                    </Button>
                                    <Button
                                        onClick={handleDeleteAccount}
                                        disabled={isDeleting}
                                        className="flex-1 h-8 bg-red-500 hover:bg-red-600 text-white font-bold text-xs rounded-lg disabled:opacity-50"
                                    >
                                        {isDeleting ? <><Loader2 className="w-3.5 h-3.5 animate-spin mr-1.5" />DELETING...</> : 'YES, DELETE'}
                                    </Button>
                                </div>
                            </m.div>
                        )}
                    </AnimatePresence>
                </div>
            </motion.div>

            {/* ═══════════ SIGN OUT ═══════════ */}
            <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                transition={{ delay: 0.25 }}
            >
                <Button
                    onClick={handleLogout}
                    className="w-full h-13 bg-transparent hover:bg-red-500/8 text-red-500/70 hover:text-red-500 border border-red-500/15 font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
                >
                    <LogOut className="w-4 h-4" />
                    Sign Out
                </Button>
                <p className="text-center text-[10px] text-olive-300/50 mt-4 tracking-wider">
                    SOL PILATES STUDIO · v1.0.0
                </p>
            </motion.div>
        </div>
    )
}
