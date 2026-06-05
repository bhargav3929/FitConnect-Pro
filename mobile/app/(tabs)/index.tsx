import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    ActivityIndicator,
    RefreshControl,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';
import { subscribeToUserBookings } from '@fitconnect/shared/firebase/firestore';
import { getPlanById } from '@fitconnect/shared/types/subscription';
import type { Booking } from '@fitconnect/shared/types/booking';
import type { ClientUser } from '@fitconnect/shared/types/client';
import Svg, { Circle } from 'react-native-svg';
import { Colors, Spacing, FontSize, BorderRadius, FontFamily, Alpha } from '../../constants/theme';
import TabHeader from '../../components/TabHeader';
import { useIntroClassLead } from '../../hooks/useIntroClassLead';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getGreeting(): string {
    const hour = new Date().getHours();
    if (hour < 12) return 'Good morning';
    if (hour < 17) return 'Good afternoon';
    return 'Good evening';
}

function formatBookingDate(booking: Booking): string {
    const date =
        booking.classDate instanceof Date
            ? booking.classDate
            : new Date(booking.classDate as unknown as string);
    return date.toLocaleDateString('en-US', {
        weekday: 'short',
        month: 'short',
        day: 'numeric',
    });
}

function parseDateSafe(raw: unknown): Date | null {
    if (!raw) return null;
    if (raw instanceof Date && !isNaN(raw.getTime())) return raw;
    if (raw && typeof raw === 'object' && 'seconds' in (raw as Record<string, unknown>)) {
        return new Date((raw as { seconds: number }).seconds * 1000);
    }
    const d = new Date(raw as string | number);
    return isNaN(d.getTime()) ? null : d;
}

// ---------------------------------------------------------------------------
// Skeleton Placeholder
// ---------------------------------------------------------------------------

function SkeletonBlock({ width, height, style }: { width: number | string; height: number; style?: object }) {
    return (
        <View
            style={[
                {
                    width: width as number,
                    height,
                    backgroundColor: Colors.peach[200],
                    borderRadius: BorderRadius.md,
                    opacity: 0.5,
                },
                style,
            ]}
        />
    );
}

function DashboardSkeleton() {
    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
            >
                {/* Welcome banner skeleton */}
                <View style={[styles.welcomeBanner, { padding: Spacing.lg }]}>
                    <SkeletonBlock width={100} height={14} />
                    <SkeletonBlock width={180} height={32} style={{ marginTop: Spacing.sm }} />
                    <View style={{ flexDirection: 'row', gap: Spacing.lg, marginTop: Spacing.xl, paddingTop: Spacing.lg }}>
                        <View>
                            <SkeletonBlock width={48} height={28} />
                            <SkeletonBlock width={90} height={10} style={{ marginTop: Spacing.xs }} />
                        </View>
                        <View>
                            <SkeletonBlock width={48} height={28} />
                            <SkeletonBlock width={80} height={10} style={{ marginTop: Spacing.xs }} />
                        </View>
                    </View>
                </View>

                {/* Subscription skeleton */}
                <SkeletonBlock width={'100%' as unknown as number} height={72} style={{ borderRadius: BorderRadius['2xl'] }} />

                {/* Upcoming session skeleton */}
                <SkeletonBlock width={'100%' as unknown as number} height={120} style={{ borderRadius: BorderRadius['2xl'], marginTop: Spacing.md }} />
            </ScrollView>
        </SafeAreaView>
    );
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

const STREAK_RING_SIZE = 56;
const STREAK_RING_RADIUS = 24;
const STREAK_RING_STROKE = 3;
const STREAK_RING_CIRCUMFERENCE = 2 * Math.PI * STREAK_RING_RADIUS;

function StreakRing({ currentStreak }: { currentStreak: number }) {
    const pct = Math.min((currentStreak / 30) * 100, 100);
    const dashOffset = STREAK_RING_CIRCUMFERENCE * (1 - pct / 100);
    const center = STREAK_RING_SIZE / 2;

    return (
        <View style={styles.streakRing}>
            <Svg
                width={STREAK_RING_SIZE}
                height={STREAK_RING_SIZE}
                style={styles.streakRingSvg}
            >
                {/* Background track */}
                <Circle
                    cx={center}
                    cy={center}
                    r={STREAK_RING_RADIUS}
                    fill="none"
                    stroke={Alpha.olive400_18}
                    strokeWidth={STREAK_RING_STROKE}
                />
                {/* Progress arc — rotated -90° so it starts at 12 o'clock */}
                <Circle
                    cx={center}
                    cy={center}
                    r={STREAK_RING_RADIUS}
                    fill="none"
                    stroke={Colors.terra[400]}
                    strokeWidth={STREAK_RING_STROKE}
                    strokeLinecap="round"
                    strokeDasharray={`${STREAK_RING_CIRCUMFERENCE}`}
                    strokeDashoffset={`${dashOffset}`}
                    transform={`rotate(-90 ${center} ${center})`}
                />
            </Svg>
            <View style={styles.streakRingContent}>
                <Ionicons name="flame-outline" size={14} color={Colors.terra[400]} />
                <Text style={styles.streakNumber}>{currentStreak}</Text>
            </View>
        </View>
    );
}

function WelcomeBanner({
    name,
    totalClassesAttended,
    creditsRemaining,
    currentStreak,
}: {
    name: string;
    totalClassesAttended: number;
    creditsRemaining: number | null;
    currentStreak: number;
}) {
    return (
        <View style={styles.welcomeBanner}>
            {/* Decorative circles */}
            <View style={styles.decorCircle1} />
            <View style={styles.decorCircle2} />
            <View style={styles.decorCircle3} />

            <View style={styles.welcomeContent}>
                {/* Top row: greeting + name (left), streak meter (right) */}
                <View style={styles.welcomeTopRow}>
                    <View style={styles.welcomeTextCol}>
                        <Text style={styles.greetingText}>{getGreeting()}</Text>
                        <Text style={styles.nameText}>{name.split(' ')[0]}</Text>
                    </View>

                    <View style={styles.streakMeter}>
                        <StreakRing currentStreak={currentStreak} />
                        <Text style={styles.streakLabel}>STREAK</Text>
                    </View>
                </View>

                {/* Divider */}
                <View style={styles.welcomeDivider} />

                {/* Stats row */}
                <View style={styles.statsRow}>
                    <View style={styles.statItem}>
                        <View style={styles.statValueRow}>
                            <Feather name="award" size={14} color={Colors.terra[400]} />
                            <Text style={styles.statValue}>{totalClassesAttended}</Text>
                        </View>
                        <Text style={styles.statLabel}>Classes Attended</Text>
                    </View>

                    <View style={styles.statsDivider} />

                    <View style={styles.statItem}>
                        <View style={styles.statValueRow}>
                            <Feather name="star" size={14} color={Colors.terra[400]} />
                            <Text style={styles.statValue}>
                                {creditsRemaining === null ? '\u221E' : creditsRemaining}
                            </Text>
                        </View>
                        <Text style={styles.statLabel}>Classes Left</Text>
                    </View>
                </View>
            </View>
        </View>
    );
}

function SubscriptionCard({
    subscription,
    onViewPlans,
}: {
    subscription: ClientUser['subscription'];
    onViewPlans: () => void;
}) {
    if (!subscription) return null;

    const { planId, status, classesRemaining, endDate } = subscription;
    const isActive = status === 'active' && planId;
    const isExpired = !!planId && status === 'expired';

    if (isExpired) {
        return (
            <View style={styles.expiredCard}>
                <View style={styles.expiredIconCircle}>
                    <Feather name="alert-triangle" size={18} color={Colors.terra[400]} />
                </View>
                <View style={styles.expiredTextCol}>
                    <Text style={styles.expiredTitle}>Plan Expired</Text>
                    <Text style={styles.expiredSubtitle}>
                        Your {planId!.replace(/_/g, ' ')} plan has expired. Renew to continue booking classes.
                    </Text>
                </View>
                <TouchableOpacity
                    onPress={onViewPlans}
                    activeOpacity={0.85}
                    style={styles.expiredButton}
                >
                    <Text style={styles.expiredButtonText}>RENEW PLAN</Text>
                </TouchableOpacity>
            </View>
        );
    }

    if (!isActive) {
        // No plan or canceled — single-row CTA card matching web
        return (
            <TouchableOpacity
                onPress={onViewPlans}
                activeOpacity={0.9}
                style={styles.noPlanCardWrap}
            >
                <View style={styles.noPlanCard}>
                    <View style={styles.noPlanIconCircle}>
                        <Feather name="credit-card" size={18} color={Colors.terra[400]} />
                    </View>
                    <View style={styles.noPlanTextCol}>
                        <Text style={styles.noPlanTitle}>Choose a Plan</Text>
                        <Text style={styles.noPlanSubtitle}>Start booking classes today</Text>
                    </View>
                    <View style={styles.noPlanArrowCircle}>
                        <Feather name="arrow-right" size={16} color={Colors.terra[400]} />
                    </View>
                </View>
            </TouchableOpacity>
        );
    }

    // Active plan
    const plan = planId ? getPlanById(planId) : null;
    const planName = plan?.name || (planId ? planId.replace(/_/g, ' ').replace(/\b\w/g, (c: string) => c.toUpperCase()) : 'Plan');
    const isUnlimited = classesRemaining === null;
    const endDateObj = parseDateSafe(endDate);
    const renewalDate = endDateObj
        ? endDateObj.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })
        : '\u2014';
    const isAutoRenew = plan?.autoRenew ?? false;

    // Progress bar calculation
    const maxCredits = plan?.credits ?? (isUnlimited ? 1 : Math.max(classesRemaining ?? 1, 1));
    const progressFraction = isUnlimited ? 1 : (classesRemaining ?? 0) / (maxCredits || 1);

    return (
        <View style={styles.subscriptionCard}>
            {/* Header row */}
            <View style={styles.subHeaderRow}>
                <View style={styles.subIconCircle}>
                    <Feather name="credit-card" size={16} color={Colors.terra[400]} />
                </View>
                <Text style={styles.subPlanName}>{planName}</Text>
                <View style={styles.activeBadge}>
                    <Text style={styles.activeBadgeText}>Active</Text>
                </View>
            </View>

            {/* Credits display */}
            <View style={styles.creditsDisplay}>
                <Text style={styles.creditsNumber}>
                    {isUnlimited ? '\u221E' : classesRemaining ?? 0}
                </Text>
                <Text style={styles.creditsLabel}>credits remaining</Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${Math.min(progressFraction * 100, 100)}%` as unknown as number },
                    ]}
                />
            </View>

            {/* Renewal info */}
            <Text style={styles.renewalText}>
                {isAutoRenew ? 'Renews' : 'Expires'} {renewalDate}
            </Text>
        </View>
    );
}

function UpcomingSessionCard({
    booking,
    onViewDetails,
    onBrowseSchedule,
}: {
    booking: Booking | null;
    onViewDetails: () => void;
    onBrowseSchedule: () => void;
}) {
    if (booking) {
        return (
            <View style={styles.upcomingCardWrap}>
                <View style={styles.upcomingCard}>
                    {/* Decorative glow circle — top-right, matches web */}
                    <View style={styles.upcomingDecorCircle} />

                    <View style={styles.upcomingContent}>
                        <View style={styles.upcomingLabelPill}>
                            <Feather name="clock" size={10} color={Colors.terra[400]} />
                            <Text style={styles.upcomingLabel}>UPCOMING SESSION</Text>
                        </View>
                        <Text style={styles.upcomingClassName}>
                            {(booking as Booking & { classType?: string }).classType || 'Pilates Class'}
                        </Text>
                        <Text style={styles.upcomingDetails}>
                            {formatBookingDate(booking)} {'\u00B7'} Spot #{booking.spotNumber}
                        </Text>
                        <TouchableOpacity
                            style={styles.viewDetailsButton}
                            onPress={onViewDetails}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.viewDetailsButtonText}>VIEW DETAILS</Text>
                            <Feather name="arrow-right" size={14} color={Colors.terra[400]} />
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        );
    }

    // No upcoming booking
    return (
        <View style={styles.noSessionCard}>
            {/* Decorative circle in bottom-right */}
            <View style={styles.noSessionDecorCircle} />

            <View style={styles.noSessionContent}>
                <Text style={styles.noSessionTitle}>Your Next Move</Text>
                <Text style={styles.noSessionSubtitle}>
                    No upcoming sessions. Browse the schedule to find your perfect class.
                </Text>
                <TouchableOpacity
                    style={styles.browseScheduleButton}
                    onPress={onBrowseSchedule}
                    activeOpacity={0.7}
                >
                    <Text style={styles.browseScheduleButtonText}>BROWSE SCHEDULE</Text>
                    <Feather name="arrow-right" size={16} color={Colors.terra[400]} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

function QuickActions({
    onBookClass,
    onMyBookings,
}: {
    onBookClass: () => void;
    onMyBookings: () => void;
}) {
    return (
        <View style={styles.quickActionsColumn}>
            {/* Book Your Next Class — dark olive feature card */}
            <TouchableOpacity
                style={styles.bookNextCard}
                onPress={onBookClass}
                activeOpacity={0.9}
            >
                <View style={styles.bookNextDecorCircle} />
                <View style={styles.bookNextTopRow}>
                    <Feather name="calendar" size={22} color={Colors.terra[400]} />
                    <View style={styles.bookNextArrowCircle}>
                        <Feather name="arrow-right" size={16} color={Colors.terra[400]} />
                    </View>
                </View>
                <Text style={styles.bookNextTitle}>Book Your Next Class</Text>
                <Text style={styles.bookNextSubtitle}>
                    Browse available sessions, pick your spot, and reserve your reformer.
                </Text>
            </TouchableOpacity>

            <TouchableOpacity
                style={styles.myBookingsCard}
                onPress={onMyBookings}
                activeOpacity={0.85}
            >
                <View style={styles.myBookingsIconCircle}>
                    <Feather name="target" size={20} color={Colors.terra[400]} />
                </View>
                <Text style={styles.myBookingsTitle}>My Bookings</Text>
                <Text style={styles.myBookingsSubtitle}>
                    Upcoming sessions and past history
                </Text>
                <View style={styles.myBookingsLinkRow}>
                    <Text style={styles.myBookingsLinkText}>VIEW ALL</Text>
                    <Feather name="arrow-right" size={14} color={Colors.terra[400]} />
                </View>
            </TouchableOpacity>
        </View>
    );
}

function FreeClassCTA({
    onFreeClass,
    freeClassBooked,
}: {
    onFreeClass: () => void;
    freeClassBooked?: boolean;
}) {
    return (
        <TouchableOpacity
            style={[styles.freeClassCard, freeClassBooked && { opacity: 0.7 }]}
            onPress={freeClassBooked ? undefined : onFreeClass}
            disabled={freeClassBooked}
            activeOpacity={freeClassBooked ? 1 : 0.85}
        >
            <View style={styles.freeClassIconCircle}>
                <Feather
                    name={freeClassBooked ? 'check-circle' : 'gift'}
                    size={20}
                    color={Colors.terra[400]}
                />
            </View>
            <View style={styles.freeClassTextCol}>
                <Text style={styles.freeClassTitle}>
                    {freeClassBooked ? 'Intro Class Booked' : 'Book an Intro Class'}
                </Text>
                <Text style={styles.freeClassSubtitle}>
                    {freeClassBooked
                        ? "You're all set. Swetha will be in touch shortly."
                        : 'First time? Try a 30-minute intro class.'}
                </Text>
            </View>
            {!freeClassBooked && (
                <View style={styles.freeClassArrowCircle}>
                    <Feather name="arrow-right" size={16} color={Colors.terra[400]} />
                </View>
            )}
        </TouchableOpacity>
    );
}

// ---------------------------------------------------------------------------
// Main Dashboard Screen
// ---------------------------------------------------------------------------

export default function DashboardScreen() {
    const { clientUser, firebaseUser, refreshSubscription } = useClientAuthStore();
    const router = useRouter();
    const { hasIntroClassLead } = useIntroClassLead();

    const [nextBooking, setNextBooking] = useState<Booking | null>(null);
    const [isLoadingBookings, setIsLoadingBookings] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshTick, setRefreshTick] = useState(0);

    // Subscribe to user bookings (real-time)
    useEffect(() => {
        if (!firebaseUser?.uid) {
            setIsLoadingBookings(false);
            return;
        }

        setIsLoadingBookings(true);
        const unsubscribe = subscribeToUserBookings(firebaseUser.uid, (bookings) => {
            // Matches web dashboard behavior: first confirmed booking wins.
            // Query returns classDate-desc, so this is the most future confirmed booking.
            const upcoming = bookings.find((b) => b.status === 'confirmed') ?? null;
            setNextBooking(upcoming);
            setIsLoadingBookings(false);
            setRefreshing(false);
        });

        return unsubscribe;
    }, [firebaseUser?.uid, refreshTick]);

    const handleRefresh = useCallback(async () => {
        setRefreshing(true);
        setRefreshTick((tick) => tick + 1);
        try {
            await refreshSubscription();
        } finally {
            setRefreshing(false);
        }
    }, [refreshSubscription]);

    // Navigation callbacks
    const navigateToSchedule = useCallback(() => router.push('/(tabs)/schedule'), [router]);
    const navigateToBookings = useCallback(() => router.push('/(tabs)/bookings'), [router]);
    const navigateToSubscribe = useCallback(() => router.push('/subscribe'), [router]);
    const navigateToIntroClass = useCallback(() => router.push('/intro-class' as any), [router]);

    // Loading state
    if (!clientUser) {
        return <DashboardSkeleton />;
    }

    const name = clientUser.name || 'there';
    const totalClassesAttended = clientUser.stats?.totalClassesAttended ?? 0;
    const creditsRemaining = clientUser.subscription?.classesRemaining ?? null;
    const hasActiveSubscription = clientUser.subscription?.status === 'active' && !!clientUser.subscription?.planId;
    const showIntroClassCta = !hasActiveSubscription;

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <TabHeader />
            <ScrollView
                style={styles.scrollView}
                contentContainerStyle={styles.scrollContent}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={Colors.terra[400]}
                    />
                }
            >
                {showIntroClassCta && (
                    <>
                        <FreeClassCTA
                            onFreeClass={navigateToIntroClass}
                            freeClassBooked={hasIntroClassLead === true}
                        />
                        <View style={{ height: Spacing.md }} />
                    </>
                )}
                {/* A. Welcome Banner */}
                <WelcomeBanner
                    name={name}
                    totalClassesAttended={totalClassesAttended}
                    creditsRemaining={creditsRemaining}
                    currentStreak={clientUser.stats?.currentStreak ?? 0}
                />

                {/* B. Subscription Status */}
                <SubscriptionCard
                    subscription={clientUser.subscription}
                    onViewPlans={navigateToSubscribe}
                />

                {/* C. Upcoming Session */}
                {isLoadingBookings ? (
                    <View style={[styles.noSessionCard, { alignItems: 'center', paddingVertical: Spacing.xl }]}>
                        <ActivityIndicator size="small" color={Colors.terra[400]} />
                    </View>
                ) : (
                    <UpcomingSessionCard
                        booking={nextBooking}
                        onViewDetails={navigateToBookings}
                        onBrowseSchedule={navigateToSchedule}
                    />
                )}

                {/* D. Quick Actions */}
                <QuickActions
                    onBookClass={navigateToSchedule}
                    onMyBookings={navigateToBookings}
                />
            </ScrollView>
        </SafeAreaView>
    );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    scrollView: {
        flex: 1,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 100,
        paddingTop: Spacing.md,
    },

    // ── Welcome Banner ─────────────────────────────────────────
    welcomeBanner: {
        position: 'relative',
        overflow: 'hidden',
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.lg,
        // Layered background — peach gradient effect
        backgroundColor: Colors.peach[50],
        borderWidth: 1,
        borderColor: Colors.borderLight,
    },
    // Large circle wrapping around the streak meter (top-right)
    decorCircle1: {
        position: 'absolute',
        top: -50,
        right: -50,
        width: 190,
        height: 190,
        borderRadius: 95,
        backgroundColor: Colors.terra[400],
        opacity: 0.08,
    },
    // Medium circle in the lower-left, behind Classes Attended
    decorCircle2: {
        position: 'absolute',
        bottom: -60,
        left: -60,
        width: 200,
        height: 200,
        borderRadius: 100,
        backgroundColor: Colors.terra[400],
        opacity: 0.06,
    },
    // Smaller accent circle behind the Classes Left stat
    decorCircle3: {
        position: 'absolute',
        bottom: -30,
        right: '30%' as unknown as number,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: Colors.terra[400],
        opacity: 0.05,
    },
    welcomeContent: {
        position: 'relative',
        zIndex: 1,
    },
    welcomeTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
    },
    welcomeTextCol: {
        flex: 1,
        paddingRight: Spacing.md,
    },
    greetingText: {
        fontFamily: FontFamily.sansMedium,
        fontSize: FontSize.base,
        color: Colors.olive[400],
        letterSpacing: 0.3,
    },
    nameText: {
        fontFamily: FontFamily.display,
        fontSize: FontSize['4xl'],
        color: Colors.olive[600],
        letterSpacing: -0.5,
        marginTop: 2,
    },
    streakMeter: {
        alignItems: 'center',
    },
    streakRing: {
        width: 56,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    streakRingSvg: {
        position: 'absolute',
        top: 0,
        left: 0,
    },
    streakRingContent: {
        alignItems: 'center',
        justifyContent: 'center',
    },
    streakNumber: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.base,
        color: Colors.olive[600],
        marginTop: 1,
    },
    streakLabel: {
        fontFamily: FontFamily.sansBold,
        fontWeight: 'bold', 
        fontSize: FontSize.xs,
        color: Colors.olive[300],
        letterSpacing: 1.5,
        marginTop: Spacing.sm,
    },
    welcomeDivider: {
        height: 1,
        backgroundColor: Alpha.olive400_10,
        marginTop: Spacing.lg,
    },
    statsRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.lg,
    },
    statItem: {
        flex: 1,
    },
    statValueRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginBottom: 4,
    },
    statValue: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.olive[600],
        lineHeight: 24,
    },
    statLabel: {
        fontSize: 11,
        fontWeight: 'bold',
        color: Colors.olive[300],
    },
    statsDivider: {
        width: 1,
        height: 40,
        backgroundColor: Alpha.olive400_08,
        marginHorizontal: Spacing.lg,
    },

    // ── Subscription Card (Active) ─────────────────────────────
    subscriptionCard: {
        backgroundColor: Colors.peach[50],
        borderRadius: BorderRadius['2xl'],
        borderWidth: 1,
        borderColor: Colors.borderLight,
        padding: 20,
        marginTop: Spacing.md,
    },
    subHeaderRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    subIconCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Alpha.terra400_10,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: Spacing.sm,
    },
    subPlanName: {
        fontSize: FontSize.base,
        fontWeight: '700',
        color: Colors.olive[600],
        flex: 1,
    },
    activeBadge: {
        backgroundColor: Alpha.terra400_10,
        paddingHorizontal: Spacing.sm,
        paddingVertical: 3,
        borderRadius: BorderRadius.full,
    },
    activeBadgeText: {
        fontSize: FontSize.xs,
        fontWeight: '600',
        color: Colors.terra[400],
    },
    creditsDisplay: {
        marginBottom: Spacing.sm,
    },
    creditsNumber: {
        fontSize: FontSize['2xl'],
        fontWeight: '800',
        color: Colors.olive[600],
    },
    creditsLabel: {
        fontSize: FontSize.xs,
        color: Colors.olive[300],
        marginTop: 2,
    },
    progressTrack: {
        height: 6,
        backgroundColor: Colors.peach[200],
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
        marginBottom: Spacing.sm,
    },
    progressFill: {
        height: 6,
        backgroundColor: Colors.terra[400],
        borderRadius: BorderRadius.full,
    },
    renewalText: {
        fontSize: FontSize.xs,
        color: Colors.olive[300],
    },

    // ── Subscription Card (No Plan) ────────────────────────────
    expiredCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        gap: Spacing.md,
        borderRadius: BorderRadius['2xl'],
        borderWidth: 1,
        borderColor: Alpha.terra400_20,
        backgroundColor: Alpha.terra400_07,
        marginTop: Spacing.md,
    },
    expiredIconCircle: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.lg,
        backgroundColor: Alpha.terra400_15,
        alignItems: 'center',
        justifyContent: 'center',
    },
    expiredTextCol: {
        flex: 1,
    },
    expiredTitle: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.sm,
        color: Colors.olive[600],
    },
    expiredSubtitle: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.xs,
        color: Colors.olive[300],
        marginTop: 2,
    },
    expiredButton: {
        backgroundColor: Colors.terra[400],
        paddingHorizontal: Spacing.md,
        height: 36,
        borderRadius: BorderRadius.lg,
        alignItems: 'center',
        justifyContent: 'center',
    },
    expiredButtonText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.peach[50],
        letterSpacing: 0.5,
    },
    noPlanCardWrap: {
        borderRadius: BorderRadius['2xl'],
        overflow: 'hidden',
        marginTop: Spacing.md,
    },
    noPlanCard: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
        gap: Spacing.md,
        backgroundColor: Colors.peach[50],
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: BorderRadius['2xl'],
    },
    noPlanIconCircle: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Alpha.terra400_10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noPlanTextCol: {
        flex: 1,
    },
    noPlanArrowCircle: {
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Alpha.terra400_10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    noPlanTitle: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.base,
        color: Colors.olive[600],
    },
    noPlanSubtitle: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.xs,
        color: Colors.olive[400],
        marginTop: 2,
    },

    // ── Upcoming Session (Has Booking) ─────────────────────────
    upcomingCardWrap: {
        borderRadius: BorderRadius['2xl'],
        overflow: 'hidden',
        marginTop: Spacing.md,
    },
    upcomingCard: {
        padding: 20,
        position: 'relative',
        backgroundColor: Colors.peach[50],
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: BorderRadius['2xl'],
    },
    upcomingDecorCircle: {
        position: 'absolute',
        top: -60,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: Alpha.terra400_07,
    },
    upcomingContent: {
        position: 'relative',
        zIndex: 1,
    },
    upcomingLabelPill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        alignSelf: 'flex-start',
        backgroundColor: Alpha.terra400_10,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
        marginBottom: Spacing.sm,
    },
    upcomingLabel: {
        fontSize: FontSize['2xs'],
        fontWeight: '700',
        color: Colors.terra[400],
        textTransform: 'uppercase',
        letterSpacing: 1.5,
    },
    upcomingClassName: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.olive[600],
        marginBottom: 4,
    },
    upcomingDetails: {
        fontSize: FontSize.sm,
        color: Colors.olive[400],
        marginBottom: Spacing.md,
    },
    viewDetailsButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        backgroundColor: Alpha.terra400_10,
        borderRadius: BorderRadius.xl,
        paddingVertical: Spacing.sm + 2,
        paddingHorizontal: Spacing.md,
        alignSelf: 'flex-start',
    },
    viewDetailsButtonText: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.terra[400],
    },

    // ── No Upcoming Session ────────────────────────────────────
    noSessionCard: {
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: Colors.peach[50],
        borderRadius: BorderRadius['2xl'],
        borderWidth: 1,
        borderColor: Colors.borderMedium,
        padding: Spacing.lg,
        marginTop: Spacing.md,
    },
    noSessionDecorCircle: {
        position: 'absolute',
        bottom: -40,
        right: -40,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: Colors.peach[200],
        opacity: 0.5,
    },
    noSessionContent: {
        position: 'relative',
        zIndex: 1,
    },
    noSessionTitle: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.base,
        color: Colors.olive[600],
    },
    noSessionSubtitle: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.xs,
        color: Colors.olive[400],
        lineHeight: 18,
        marginTop: 4,
        marginBottom: Spacing.md,
    },
    browseScheduleButton: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm + 2,
        backgroundColor: Alpha.terra400_10,
        borderWidth: 1,
        borderColor: Colors.terra[400],
        borderRadius: BorderRadius.md,
        paddingVertical: Spacing.md - 2,
        paddingHorizontal: Spacing.lg,
        alignSelf: 'flex-start',
    },
    browseScheduleButtonText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.terra[400],
        letterSpacing: 1,
    },

    // ── Quick Actions ──────────────────────────────────────────
    quickActionsColumn: {
        marginTop: Spacing.md,
        gap: Spacing.md,
    },

    // Book Your Next Class (feature card)
    bookNextCard: {
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: Colors.peach[50],
        borderWidth: 1,
        borderColor: Colors.borderLight,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.lg,
    },
    bookNextDecorCircle: {
        position: 'absolute',
        right: -30,
        top: '35%' as unknown as number,
        width: 160,
        height: 160,
        borderRadius: 80,
        backgroundColor: Alpha.terra400_07,
    },
    bookNextTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    bookNextArrowCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Alpha.terra400_10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookNextTitle: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.xl,
        color: Colors.olive[600],
        marginBottom: Spacing.sm,
    },
    bookNextSubtitle: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.olive[400],
        lineHeight: 20,
    },

    // My Bookings
    myBookingsCard: {
        backgroundColor: Colors.peach[50],
        borderWidth: 1,
        borderColor: Colors.borderMedium,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.lg,
    },
    myBookingsIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Alpha.terra400_10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    myBookingsTitle: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.xl,
        color: Colors.olive[600],
    },
    myBookingsSubtitle: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.olive[400],
        marginTop: 2,
        marginBottom: Spacing.md,
    },
    myBookingsLinkRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    myBookingsLinkText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.terra[400],
        letterSpacing: 1,
    },
    freeClassCard: {
        backgroundColor: Colors.peach[50],
        borderWidth: 1,
        borderColor: Colors.terra[400],
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.md,
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    freeClassIconCircle: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Alpha.terra400_10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    freeClassTextCol: {
        flex: 1,
    },
    freeClassTitle: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.xl,
        color: Colors.olive[600],
    },
    freeClassSubtitle: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.olive[400],
        marginTop: 2,
    },
    freeClassArrowCircle: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Alpha.terra400_10,
        alignItems: 'center',
        justifyContent: 'center',
    },
});
