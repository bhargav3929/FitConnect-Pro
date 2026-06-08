import { useState, useEffect, useCallback } from 'react';
import { useFocusEffect } from 'expo-router';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    ScrollView,
    TouchableOpacity,
    Dimensions,
    RefreshControl,
    Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { Feather } from '@expo/vector-icons';
import {
    subscribeToClassesByDate,
    getTrainers,
    getFacility,
} from '@fitconnect/shared/firebase/firestore';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';
import { isIntroClassType, type ClassSession } from '@fitconnect/shared/types/class';
import type { Trainer } from '@fitconnect/shared/types/trainer';
import type { GymCenter } from '@fitconnect/shared/types/gym';
import CalendarStrip from '../../components/CalendarStrip';
import ClassCard from '../../components/ClassCard';
import SpotSelector from '../../components/SpotSelector';
import TabHeader from '../../components/TabHeader';
import { LinearGradient } from 'expo-linear-gradient';
import { Colors, Spacing, FontSize, BorderRadius, Shadows, FontFamily, Alpha } from '../../constants/theme';

const SCREEN_WIDTH = Dimensions.get('window').width;

// ── Static fallback facility data (matches web) ──
const FALLBACK_FACILITY = {
    name: 'SOL Pilates Studio',
    address: '250 West 54th Street, New York, NY 10019',
    rating: 4.9,
    reviewCount: 128,
    description:
        'A sophisticated Pilates studio blending strength, mindfulness, and elegance. Five dedicated disciplines — Reformer, Mat, Private Sessions, Barre, and Prenatal — each designed to transform your body and mind.',
    amenities: [
        'Reformer Studio',
        'Mat Studio',
        'Private Suite',
        'Barre & Stretch',
        'Recovery Lounge',
        'Prenatal Room',
        'Changing Rooms',
    ],
    hours: {
        weekday: '06:00 - 21:00',
        weekend: '07:00 - 18:00',
    },
    contact: {
        phone: '(212) 555-0180',
        email: 'solpilatesstudio.in@gmail.com',
    },
};

type SectionTab = 'schedule' | 'trainers' | 'facility';

// ── Helpers ──
function getInitials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

function formatFullDate(date: Date): string {
    const days = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];
    const months = [
        'January', 'February', 'March', 'April', 'May', 'June',
        'July', 'August', 'September', 'October', 'November', 'December',
    ];
    return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]} ${date.getFullYear()}`;
}

function parseSubscriptionEndDate(endDate: unknown): Date | null {
    if (!endDate) return null;
    if (endDate instanceof Date && !isNaN(endDate.getTime())) return endDate;
    if (endDate && typeof endDate === 'object' && 'seconds' in (endDate as Record<string, unknown>)) {
        return new Date((endDate as { seconds: number }).seconds * 1000);
    }
    const parsed = new Date(endDate as string | number);
    return isNaN(parsed.getTime()) ? null : parsed;
}

function isDateAfterSubscriptionEnd(date: Date, endDate: Date | null): boolean {
    if (!endDate) return false;
    const day = new Date(date);
    day.setHours(0, 0, 0, 0);
    const limit = new Date(endDate);
    limit.setHours(0, 0, 0, 0);
    return day > limit;
}

function isToday(date: Date): boolean {
    const now = new Date();
    return (
        date.getFullYear() === now.getFullYear() &&
        date.getMonth() === now.getMonth() &&
        date.getDate() === now.getDate()
    );
}

function parseFacilities(raw: string | string[]): string[] {
    if (Array.isArray(raw)) return raw;
    if (typeof raw === 'string') return raw.split(',').map((s) => s.trim()).filter(Boolean);
    return [];
}

// ── Component ──
type FilterKey = 'instructor' | 'classType';

type BookingSubscription = {
    planId?: unknown;
    planType?: unknown;
    status?: string;
    endDate?: unknown;
    classesRemaining?: unknown;
    introCreditRemaining?: unknown;
};

function hasValidSubscription(sub: BookingSubscription | undefined): boolean {
    if (!sub) return false;
    if (!sub.planId && !sub.planType) return false;
    if (sub.status !== 'active') return false;
    const endDate = parseSubscriptionEndDate(sub.endDate);
    if (!endDate || endDate < new Date()) return false;
    const introCreditRemaining = typeof sub.introCreditRemaining === 'number' ? sub.introCreditRemaining : 0;
    if (introCreditRemaining > 0) return true;
    if (sub.classesRemaining !== null && (sub.classesRemaining as number) <= 0) return false;
    return true;
}

function isIntroPlan(sub: BookingSubscription | undefined): boolean {
    return sub?.planId === 'drop_in' || sub?.planType === 'drop_in';
}

function getClassBookingRestriction(sub: BookingSubscription | undefined, cls: ClassSession): string | null {
    const introPlan = isIntroPlan(sub);
    const introClass = isIntroClassType(cls.classType);
    const introCreditRemaining = typeof sub?.introCreditRemaining === 'number' ? sub.introCreditRemaining : 0;

    if (introPlan && !introClass) {
        return 'A membership is required to book regular classes.';
    }
    if (introClass && introCreditRemaining <= 0) {
        return 'An unused intro credit is required to book an Intro Class.';
    }
    if (!introClass && sub?.classesRemaining !== null && ((sub?.classesRemaining as number | undefined) ?? 0) <= 0) {
        return 'No classes remaining on your membership.';
    }
    return null;
}

export default function ScheduleScreen() {
    const clientUser = useClientAuthStore((state) => state.clientUser);
    const [activeTab, setActiveTab] = useState<SectionTab>('schedule');
    const [classes, setClasses] = useState<ClassSession[]>([]);
    const [trainers, setTrainers] = useState<Trainer[]>([]);
    const [facility, setFacility] = useState<GymCenter | null>(null);
    const [loadingClasses, setLoadingClasses] = useState(true);
    const [loadingTrainers, setLoadingTrainers] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [refreshTick, setRefreshTick] = useState(0);
    const [selectedDate, setSelectedDate] = useState(() => {
        const d = new Date();
        d.setHours(0, 0, 0, 0);
        return d;
    });
    const [selectedClass, setSelectedClass] = useState<ClassSession | null>(null);
    const [activeFilter, setActiveFilter] = useState<FilterKey | null>(null);

    // Entering this tab (from Bookings, Profile, Dashboard, tab-bar) should always land on
    // the Schedule sub-tab, even if the user was previously on Trainers or Facility.
    useFocusEffect(
        useCallback(() => {
            setActiveTab('schedule');
        }, []),
    );

    // Real-time listener — spots update live as other members book/cancel
    useEffect(() => {
        setLoadingClasses(true);
        const unsubscribe = subscribeToClassesByDate(selectedDate, (data) => {
            setClasses(data);
            setLoadingClasses(false);
            setRefreshing(false);
        });
        return unsubscribe;
    }, [selectedDate, refreshTick]);

    const loadTrainers = useCallback(async () => {
        setLoadingTrainers(true);
        try {
            const data = await getTrainers();
            setTrainers(data);
        } catch {
            setTrainers([]);
        }
        setLoadingTrainers(false);
    }, []);

    const loadFacility = useCallback(async () => {
        try {
            const data = await getFacility();
            if (data) setFacility(data);
        } catch {
            // use fallback
        }
    }, []);

    useEffect(() => {
        void loadTrainers();
    }, [loadTrainers]);

    useEffect(() => {
        void loadFacility();
    }, [loadFacility]);

    const handleRefresh = useCallback(() => {
        setRefreshing(true);
        setRefreshTick((tick) => tick + 1);
        (async () => {
            await Promise.all([loadTrainers(), loadFacility()]);
            setRefreshing(false);
        })();
    }, [loadFacility, loadTrainers]);

    const getTrainerName = (trainerId: string) =>
        trainers.find((t) => t.id === trainerId)?.name || 'Instructor';

    const subscriptionEndDate = parseSubscriptionEndDate(clientUser?.subscription?.endDate);

    const handleDateSelect = (date: Date) => setSelectedDate(date);

    const handleBook = (cls: ClassSession) => {
        if (!hasValidSubscription(clientUser?.subscription)) {
            Alert.alert(
                'Plan Required',
                'Please choose a plan before booking a class.',
            );
            return;
        }

        if (isDateAfterSubscriptionEnd(selectedDate, subscriptionEndDate)) {
            Alert.alert(
                'Plan Expires Before This Class',
                'Please renew your plan to book classes after your subscription end date.',
            );
            return;
        }

        const bookingRestriction = getClassBookingRestriction(clientUser?.subscription, cls);
        if (bookingRestriction) {
            Alert.alert('Class Not Available', bookingRestriction);
            return;
        }

        setSelectedClass(cls);
    };

    const handleBooked = () => {
        // Real-time subscription refreshes class data automatically
        setSelectedClass(null);
    };

    const goToToday = () => {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        setSelectedDate(today);
    };

    // ── Derived facility data ──
    // Guard against Firestore docs missing address subfields — fall back to static address.
    const formatFacilityAddress = (f: GymCenter | null): string => {
        const stateAndZip = [f?.address?.state, f?.address?.zip].filter(Boolean).join(' ');
        const parts = [
            f?.address?.street,
            f?.address?.city,
            stateAndZip,
            f?.address?.country,
        ].filter(
            (p): p is string => Boolean(p && p.trim()),
        );
        return parts.length > 0 ? parts.join(', ') : FALLBACK_FACILITY.address;
    };
    const facilityAddress = formatFacilityAddress(facility);
    const facilityDescription = FALLBACK_FACILITY.description;
    // Amenities are curated copy — always render the full list (matches web),
    // not whatever partial subset Firestore happens to have.
    const facilityAmenities = FALLBACK_FACILITY.amenities;
    const facilityPhone = facility?.contactInfo?.phone || FALLBACK_FACILITY.contact.phone;
    const facilityEmail = facility?.contactInfo?.email || FALLBACK_FACILITY.contact.email;

    // ── Tab Renderers ──
    const renderScheduleTab = () => (
        <View style={styles.schedulePane}>
            {/* Calendar Strip */}
            <CalendarStrip
                selectedDate={selectedDate}
                onDateSelect={handleDateSelect}
                daysCount={14}
                disabledAfter={subscriptionEndDate}
            />

            {/* Date header + Today button */}
            <View style={styles.dateHeaderRow}>
                <Text style={styles.dateHeaderText}>{formatFullDate(selectedDate)}</Text>
                {!isToday(selectedDate) && (
                    <TouchableOpacity
                        onPress={goToToday}
                        activeOpacity={0.7}
                        style={styles.todayButtonWrap}
                    >
                        <Text style={styles.todayButton}>Today</Text>
                    </TouchableOpacity>
                )}
            </View>

            {/* TODO: Add filter chips */}

            {/* Class list */}
            <FlatList
                data={loadingClasses ? [] : classes}
                keyExtractor={(cls) => cls.id}
                renderItem={({ item }) => (
                    <ClassCard
                        classSession={item}
                        trainerName={getTrainerName(item.trainerId)}
                        onBook={handleBook}
                        bookingRestriction={
                            hasValidSubscription(clientUser?.subscription)
                                ? getClassBookingRestriction(clientUser?.subscription, item)
                                : undefined
                        }
                    />
                )}
                style={styles.classListScroller}
                contentContainerStyle={[
                    styles.classListContent,
                    (loadingClasses || classes.length === 0) && styles.classListStateContent,
                ]}
                showsVerticalScrollIndicator={false}
                refreshControl={
                    <RefreshControl
                        refreshing={refreshing}
                        onRefresh={handleRefresh}
                        tintColor={Colors.terra[400]}
                    />
                }
                ListEmptyComponent={
                    loadingClasses ? (
                        <View style={styles.loaderContainer}>
                            <ActivityIndicator size="large" color={Colors.primary} />
                        </View>
                    ) : (
                        <View style={styles.emptyState}>
                            <View style={styles.emptyIconWrap}>
                                <Feather name="calendar" size={32} color={Colors.olive[300]} />
                            </View>
                            <Text style={styles.emptyTitle}>No classes scheduled</Text>
                            <Text style={styles.emptySubtitle}>
                                There are no classes available on this date. Try selecting a different day.
                            </Text>
                        </View>
                    )
                }
            />
        </View>
    );

    const renderTrainersTab = () => {
        if (loadingTrainers) {
            return (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                </View>
            );
        }

        if (trainers.length === 0) {
            return (
                <View style={styles.emptyState}>
                    <Text style={styles.emptyTitle}>No trainers found</Text>
                </View>
            );
        }

        return (
            <View style={styles.trainerGrid}>
                {trainers.map((trainer) => (
                    <View key={trainer.id} style={styles.trainerCard}>
                        {/* Background / Avatar area */}
                        <View style={styles.trainerAvatarArea}>
                            <Text style={styles.trainerInitials}>
                                {getInitials(trainer.name)}
                            </Text>
                        </View>
                        {/* Gradient overlay */}
                        <LinearGradient
                            colors={['transparent', Alpha.dark_80]}
                            locations={[0.3, 1]}
                            style={styles.trainerOverlay}
                        >
                            <Text style={styles.trainerCardName} numberOfLines={1}>
                                {trainer.name}
                            </Text>
                            <Text style={styles.trainerCardSpecialty} numberOfLines={1}>
                                {trainer.specialties?.[0] || 'Trainer'}
                            </Text>
                        </LinearGradient>
                    </View>
                ))}
            </View>
        );
    };

    const renderFacilityTab = () => (
        <View style={styles.facilityContainer}>
            {/* About */}
            <View style={styles.facilityCard}>
                <Text style={styles.facilitySectionTitle}>About Our Facility</Text>
                <Text style={styles.facilityDescription}>{facilityDescription}</Text>

                <Text style={styles.facilitySubTitle}>Amenities</Text>
                <View style={styles.amenitiesWrap}>
                    {facilityAmenities.map((item) => (
                        <View key={item} style={styles.amenityPill}>
                            <Text style={styles.amenityText}>{item}</Text>
                        </View>
                    ))}
                </View>
            </View>

            {/* Contact & Hours */}
            <View style={styles.facilityCard}>
                <Text style={styles.facilitySectionTitle}>Contact & Hours</Text>
                <View style={styles.contactRows}>
                    {/* Phone */}
                    <View style={styles.contactRow}>
                        <View style={styles.contactIcon}>
                            <Feather name="phone" size={18} color={Colors.terra[400]} />
                        </View>
                        <Text style={styles.contactText}>{facilityPhone}</Text>
                    </View>
                    {/* Email */}
                    <View style={styles.contactRow}>
                        <View style={styles.contactIcon}>
                            <Feather name="mail" size={18} color={Colors.terra[400]} />
                        </View>
                        <Text style={styles.contactText}>{facilityEmail}</Text>
                    </View>
                    {/* Hours */}
                    <View style={styles.contactRow}>
                        <View style={styles.contactIcon}>
                            <Feather name="clock" size={18} color={Colors.terra[400]} />
                        </View>
                        <View>
                            <Text style={styles.contactText}>
                                Mon-Fri: {FALLBACK_FACILITY.hours.weekday}
                            </Text>
                            <Text style={[styles.contactText, { marginTop: 2 }]}>
                                Sat-Sun: {FALLBACK_FACILITY.hours.weekend}
                            </Text>
                        </View>
                    </View>
                </View>
            </View>
        </View>
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <TabHeader />
            <View style={styles.fixedHeader}>
                {/* ── Facility Header ── */}
                <View style={styles.facilityHeader}>
                    {/* Title */}
                    <Text style={styles.pageTitle}>Class Schedule</Text>

                    {/* Address */}
                    <View style={styles.addressRow}>
                        <Feather name="map-pin" size={12} color={Colors.terra[400]} />
                        <Text style={styles.addressText}>{facilityAddress}</Text>
                    </View>
                </View>

                {/* ── Section Tabs (sticky) ── */}
                <View style={styles.sectionTabsContainer}>
                    <View style={styles.sectionTabsInner}>
                        {([
                            { id: 'schedule', label: 'Schedule' },
                            { id: 'trainers', label: 'Trainers' },
                            { id: 'facility', label: 'Facility' },
                        ] as const).map((tab) => {
                            const isActive = activeTab === tab.id;
                            return (
                                <TouchableOpacity
                                    key={tab.id}
                                    style={[
                                        styles.sectionTab,
                                        isActive && styles.sectionTabActive,
                                    ]}
                                    onPress={() => setActiveTab(tab.id)}
                                    activeOpacity={0.7}
                                >
                                    <Text
                                        style={[
                                            styles.sectionTabText,
                                            isActive && styles.sectionTabTextActive,
                                        ]}
                                    >
                                        {tab.label}
                                    </Text>
                                </TouchableOpacity>
                            );
                        })}
                    </View>
                </View>
            </View>

            {activeTab === 'schedule' ? (
                <View style={styles.tabContent}>
                    {renderScheduleTab()}
                </View>
            ) : (
                <ScrollView
                    style={styles.container}
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
                    <View style={styles.tabContent}>
                        {activeTab === 'trainers' && renderTrainersTab()}
                        {activeTab === 'facility' && renderFacilityTab()}
                    </View>
                </ScrollView>
            )}

            {/* ── Spot Selector Modal ── */}
            {selectedClass && (
                <SpotSelector
                    visible={selectedClass !== null}
                    classSession={selectedClass}
                    trainerName={getTrainerName(selectedClass.trainerId)}
                    selectedDate={selectedDate}
                    onClose={() => setSelectedClass(null)}
                    onBooked={handleBooked}
                />
            )}
        </SafeAreaView>
    );
}

// ── Styles ──
const TRAINER_CARD_WIDTH = (SCREEN_WIDTH - Spacing.lg * 2 - Spacing.sm) / 2;

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    container: {
        flex: 1,
    },
    scrollContent: {
        paddingBottom: 100, // bottom tab bar clearance
    },
    fixedHeader: {
        backgroundColor: Colors.background,
    },

    // ── Facility Header ──
    facilityHeader: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xl,
    },
    badgeRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm + 2,
        marginBottom: Spacing.sm,
    },
    flagshipBadge: {
        backgroundColor: Colors.terra[400],
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: 3,
        borderRadius: BorderRadius.md,
    },
    flagshipText: {
        fontFamily: FontFamily.sansExtra,
        color: Colors.white,
        fontSize: FontSize['2xs'],
        letterSpacing: 1,
    },
    ratingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
    },
    ratingScore: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.terra[400],
    },
    ratingCount: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.xs,
        color: Colors.olive[300],
    },
    pageTitle: {
        fontFamily: FontFamily.display,
        fontSize: FontSize['4xl'],
        color: Colors.olive[600],
        letterSpacing: -0.5,
        marginBottom: Spacing.sm,
    },
    addressRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    addressText: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.olive[400],
    },

    // ── Section Tabs ──
    sectionTabsContainer: {
        paddingVertical: Spacing.sm,
        paddingHorizontal: Spacing.lg,
    },
    sectionTabsInner: {
        flexDirection: 'row',
        gap: Spacing.sm,
    },
    sectionTab: {
        flex: 1,
        paddingVertical: Spacing.sm + 4,
        paddingHorizontal: Spacing.lg,
        borderRadius: BorderRadius.full,
        backgroundColor: Colors.peach[200],
        alignItems: 'center',
    },
    sectionTabActive: {
        backgroundColor: Colors.terra[400],
        ...Shadows.lg,
    },
    sectionTabText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.sm,
        color: Colors.olive[400],
    },
    sectionTabTextActive: {
        color: Colors.white,
    },

    // ── Tab Content ──
    tabContent: {
        flex: 1,
    },

    // ── Schedule Tab ──
    schedulePane: {
        flex: 1,
    },
    dateHeaderRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.xs,
    },
    dateHeaderText: {
        fontSize: FontSize.sm,
        fontWeight: '600',
        color: Colors.olive[600],
    },
    todayButtonWrap: {
        borderWidth: 1,
        borderColor: Colors.warning,
        borderRadius: BorderRadius.sm,
        paddingHorizontal: Spacing.sm + 2,
        paddingVertical: 3,
    },
    todayButton: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.terra[400],
    },
    filtersRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.xs,
        paddingHorizontal: Spacing.lg,
        paddingTop: 0,
        paddingBottom: 1,
    },
    filterIconWrap: {
        paddingHorizontal: Spacing.xs,
    },
    filterChip: {
        borderWidth: 1,
        borderColor: Alpha.peach400_30,
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 10,
        backgroundColor: 'transparent',
    },
    filterChipActive: {
        backgroundColor: Alpha.terra400_20,
        borderColor: Colors.terra[400],
    },
    filterChipText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.olive[400],
    },
    filterChipTextActive: {
        color: Colors.terra[400],
    },
    classListScroller: {
        flex: 1,
    },
    classListContent: {
        paddingTop: Spacing.xs,
        paddingBottom: 100,
    },
    classListStateContent: {
        flexGrow: 1,
    },

    // ── Loading / Empty ──
    loaderContainer: {
        paddingVertical: Spacing['3xl'],
        alignItems: 'center',
    },
    emptyState: {
        paddingVertical: Spacing['3xl'],
        alignItems: 'center',
        paddingHorizontal: Spacing.xl,
    },
    emptyIconWrap: {
        width: 64,
        height: 64,
        borderRadius: 32,
        backgroundColor: Alpha.peach200_50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    emptyTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.olive[600],
        marginBottom: Spacing.sm,
    },
    emptySubtitle: {
        fontSize: FontSize.sm,
        color: Colors.olive[300],
        textAlign: 'center',
        lineHeight: 20,
        maxWidth: 280,
    },

    // ── Trainers Tab ──
    trainerGrid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        justifyContent: 'center',
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        gap: Spacing.sm,
    },
    trainerCard: {
        width: TRAINER_CARD_WIDTH,
        aspectRatio: 3 / 4,
        borderRadius: BorderRadius['2xl'],
        overflow: 'hidden',
        backgroundColor: Colors.cardAlt,
    },
    trainerAvatarArea: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trainerInitials: {
        fontSize: FontSize['4xl'],
        fontWeight: '700',
        color: Colors.olive[400],
    },
    trainerOverlay: {
        position: 'absolute',
        bottom: 0,
        left: 0,
        right: 0,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
        paddingTop: Spacing['4xl'],
        justifyContent: 'flex-end',
    },
    trainerCardName: {
        color: Colors.peach[50],
        fontSize: FontSize.base,
        fontWeight: '700',
        marginBottom: 4,
    },
    trainerCardSpecialty: {
        color: Colors.terra[400],
        fontSize: FontSize.xs,
        fontWeight: '700',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },

    // ── Facility Tab ──
    facilityContainer: {
        padding: Spacing.md,
        gap: Spacing.md,
    },
    facilityCard: {
        backgroundColor: Colors.peach[50],
        borderWidth: 1,
        borderColor: Alpha.peach400_20,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.lg,
    },
    facilitySectionTitle: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.xl,
        color: Colors.olive[600],
        marginBottom: Spacing.md,
    },
    facilityDescription: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.olive[400],
        lineHeight: 22,
        marginBottom: Spacing.lg,
    },
    facilitySubTitle: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.base,
        color: Colors.olive[600],
        marginBottom: Spacing.md,
    },
    amenitiesWrap: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: Spacing.sm + 2,
    },
    amenityPill: {
        backgroundColor: Colors.peach[200],
        borderRadius: BorderRadius.md,
        paddingHorizontal: Spacing.lg,
        paddingVertical: 10,
    },
    amenityText: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.olive[400],
    },
    contactRows: {
        gap: Spacing.md,
    },
    contactRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    contactIcon: {
        width: 44,
        height: 44,
        borderRadius: BorderRadius.md,
        backgroundColor: Alpha.terra400_12,
        alignItems: 'center',
        justifyContent: 'center',
    },
    contactText: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.base,
        color: Colors.olive[400],
    },
});
