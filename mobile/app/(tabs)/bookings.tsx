import { useState, useEffect, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    ActivityIndicator,
    TouchableOpacity,
    Alert,
    RefreshControl,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';
import {
    subscribeToUserBookings,
    callCancelBooking,
} from '@fitconnect/shared/firebase/firestore';
import type { Booking } from '@fitconnect/shared/types/booking';
import { Colors, Spacing, FontSize, BorderRadius, Shadows, Alpha } from '../../constants/theme';
import TabHeader from '../../components/TabHeader';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function toDate(val: unknown): Date {
    if (val && typeof val === 'object' && 'toDate' in val && typeof (val as { toDate: () => Date }).toDate === 'function') {
        return (val as { toDate: () => Date }).toDate();
    }
    if (val instanceof Date) return val;
    return new Date(val as string | number);
}

function formatTime(date: Date): string {
    return date.toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true,
    });
}

function formatStartTime(startTime: string | undefined): string {
    if (!startTime) return '';
    const [hh, mm] = startTime.split(':').map((v) => parseInt(v, 10));
    if (isNaN(hh)) return startTime;
    const period = hh >= 12 ? 'PM' : 'AM';
    const hour12 = hh % 12 === 0 ? 12 : hh % 12;
    return `${hour12}:${String(mm || 0).padStart(2, '0')} ${period}`;
}

function formatFullDate(date: Date): string {
    return date.toLocaleDateString('en-US', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });
}

function isUpcoming(booking: Booking): boolean {
    const now = new Date();
    now.setHours(0, 0, 0, 0);
    const classDate = toDate(booking.classDate);
    classDate.setHours(0, 0, 0, 0);
    return booking.status === 'confirmed' && classDate >= now;
}

// ---------------------------------------------------------------------------
// Status config
// ---------------------------------------------------------------------------

type BookingStatus = Booking['status'];

const STATUS_CONFIG: Record<BookingStatus, {
    icon: React.ComponentProps<typeof Feather>['name'];
    label: string;
    bgColor: string;
    textColor: string;
}> = {
    confirmed: {
        icon: 'alert-circle',
        label: 'CONFIRMED',
        bgColor: Alpha.terra400_15,
        textColor: Colors.terra[400],
    },
    attended: {
        icon: 'check-circle',
        label: 'ATTENDED',
        bgColor: Colors.successBg,
        textColor: Colors.success,
    },
    canceled: {
        icon: 'x-circle',
        label: 'CANCELED',
        bgColor: Colors.errorBg,
        textColor: Colors.error,
    },
    'no-show': {
        icon: 'x-circle',
        label: 'NO SHOW',
        bgColor: Colors.errorBg,
        textColor: Colors.error,
    },
};

// ---------------------------------------------------------------------------
// Component
// ---------------------------------------------------------------------------

export default function BookingsScreen() {
    const router = useRouter();
    const { clientUser } = useClientAuthStore();
    const [bookings, setBookings] = useState<Booking[]>([]);
    const [loading, setLoading] = useState(true);
    const [refreshing, setRefreshing] = useState(false);
    const [activeTab, setActiveTab] = useState<'upcoming' | 'past'>('upcoming');
    const [cancelingId, setCancelingId] = useState<string | null>(null);

    // -----------------------------------------------------------------------
    // Real-time listener
    // -----------------------------------------------------------------------

    useEffect(() => {
        if (!clientUser?.id) {
            setLoading(false);
            return;
        }

        setLoading(true);
        const unsubscribe = subscribeToUserBookings(clientUser.id, (data) => {
            setBookings(data);
            setLoading(false);
            setRefreshing(false);
        });

        return unsubscribe;
    }, [clientUser?.id]);

    // -----------------------------------------------------------------------
    // Filtered + sorted bookings
    // -----------------------------------------------------------------------

    const attendedCount = bookings.filter((b) => b.status === 'attended').length;
    const milestoneTarget = Math.max(50, (Math.floor(attendedCount / 50) + (attendedCount % 50 === 0 && attendedCount > 0 ? 0 : 1)) * 50);
    const milestoneProgress = Math.min(100, (attendedCount / milestoneTarget) * 100);
    const MILESTONE_BADGES = [50, 100, 150];

    const filteredBookings = bookings
        .filter((b) => (activeTab === 'upcoming' ? isUpcoming(b) : !isUpcoming(b)))
        .sort((a, b) => {
            const dateA = toDate(a.classDate).getTime();
            const dateB = toDate(b.classDate).getTime();
            return activeTab === 'upcoming' ? dateA - dateB : dateB - dateA;
        });

    // -----------------------------------------------------------------------
    // Handlers
    // -----------------------------------------------------------------------

    const onRefresh = useCallback(() => {
        setRefreshing(true);
        // Listener auto-updates; timeout is a safety net.
        setTimeout(() => setRefreshing(false), 2000);
    }, []);

    const handleCancel = useCallback((booking: Booking) => {
        Alert.alert(
            'Cancel Booking',
            `Are you sure you want to cancel Spot ${booking.spotNumber}? Your class credit will be restored.`,
            [
                { text: 'Keep Booking', style: 'cancel' },
                {
                    text: 'Cancel Booking',
                    style: 'destructive',
                    onPress: async () => {
                        setCancelingId(booking.id);
                        try {
                            await callCancelBooking(booking.id);
                            Alert.alert(
                                'Booking Cancelled',
                                'Your booking has been cancelled and your class credit has been restored.',
                            );
                        } catch (error: unknown) {
                            const message =
                                error instanceof Error
                                    ? error.message
                                    : 'Failed to cancel. Please try again.';
                            Alert.alert('Error', message);
                        } finally {
                            setCancelingId(null);
                        }
                    },
                },
            ],
        );
    }, []);

    // -----------------------------------------------------------------------
    // Render helpers
    // -----------------------------------------------------------------------

    const renderStatusBadge = (status: BookingStatus) => {
        const config = STATUS_CONFIG[status];
        return (
            <View style={[styles.statusBadge, { backgroundColor: config.bgColor }]}>
                <Feather name={config.icon} size={10} color={config.textColor} />
                <Text style={[styles.statusText, { color: config.textColor }]}>
                    {config.label}
                </Text>
            </View>
        );
    };

    const renderBookingCard = ({ item: booking }: { item: Booking }) => {
        const classDate = toDate(booking.classDate);
        const isCanceling = cancelingId === booking.id;
        const isUpcomingBooking = isUpcoming(booking);

        return (
            <View style={styles.card}>
                {/* Header: left (badge + class + instructor), right (time + spot) */}
                <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                        {renderStatusBadge(booking.status)}
                        <Text style={styles.className}>
                            {(booking as unknown as Record<string, unknown>).classType as string || 'Pilates'}
                        </Text>
                        <View style={styles.trainerRow}>
                            <Feather name="user" size={12} color={Colors.olive[300]} />
                            <Text style={styles.trainerName}>
                                {(booking as unknown as Record<string, unknown>).trainerName as string || 'Instructor'}
                            </Text>
                        </View>
                        {booking.isGuest && (
                            <Text style={styles.guestLabel}>
                                Guest{booking.guestName ? `: ${booking.guestName}` : ''}
                            </Text>
                        )}
                    </View>
                    <View style={styles.headerRight}>
                        <Text style={styles.timeText}>
                            {formatStartTime(
                                (booking as unknown as Record<string, unknown>).classStartTime as string,
                            ) || formatTime(classDate)}
                        </Text>
                        <Text style={styles.spotLabel}>SPOT {booking.spotNumber}</Text>
                    </View>
                </View>

                {/* Details section */}
                <View style={styles.detailsSection}>
                    <View style={styles.detailRow}>
                        <View style={styles.detailLabelRow}>
                            <Feather name="calendar" size={14} color={Colors.terra[400]} />
                            <Text style={styles.detailLabel}>Date</Text>
                        </View>
                        <Text style={styles.detailValue}>{formatFullDate(classDate)}</Text>
                    </View>
                    <View style={styles.detailRow}>
                        <View style={styles.detailLabelRow}>
                            <Feather name="clock" size={14} color={Colors.terra[400]} />
                            <Text style={styles.detailLabel}>Duration</Text>
                        </View>
                        <Text style={styles.detailValue}>
                            {(booking as unknown as Record<string, unknown>).classDuration
                                ? `${(booking as unknown as Record<string, unknown>).classDuration} minutes`
                                : '--'}
                        </Text>
                    </View>
                </View>

                {/* Action buttons — upcoming confirmed */}
                {isUpcomingBooking && booking.status === 'confirmed' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.cancelButton}
                            onPress={() => handleCancel(booking)}
                            disabled={isCanceling}
                            activeOpacity={0.7}
                        >
                            {isCanceling ? (
                                <ActivityIndicator size="small" color={Colors.error} />
                            ) : (
                                <Text style={styles.cancelButtonText}>Cancel</Text>
                            )}
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={styles.directionsButton}
                            onPress={() =>
                                Linking.openURL(
                                    'https://maps.google.com/?q=250+West+54th+Street+New+York+NY+10019',
                                )
                            }
                            activeOpacity={0.7}
                        >
                            <Text style={styles.directionsButtonText}>Get Directions</Text>
                        </TouchableOpacity>
                    </View>
                )}

                {/* Action buttons — past attended */}
                {!isUpcomingBooking && booking.status === 'attended' && (
                    <View style={styles.actionRow}>
                        <TouchableOpacity
                            style={styles.bookAgainButton}
                            onPress={() => router.push('/(tabs)/schedule')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.bookAgainText}>Book Again</Text>
                        </TouchableOpacity>
                    </View>
                )}
            </View>
        );
    };

    const renderEmpty = () => (
        <View style={styles.emptyContainer}>
            <View style={styles.emptyIconWrapper}>
                <Feather name="calendar" size={32} color={Alpha.olive300_40} />
            </View>
            <Text style={styles.emptyTitle}>No bookings found</Text>
            <Text style={styles.emptySubtitle}>
                {activeTab === 'upcoming'
                    ? "You don't have any upcoming classes scheduled."
                    : "You haven't completed any classes yet."}
            </Text>
            {activeTab === 'upcoming' && (
                <TouchableOpacity
                    style={styles.browseButton}
                    onPress={() => router.push('/(tabs)/schedule')}
                    activeOpacity={0.7}
                >
                    <Text style={styles.browseButtonText}>Browse Schedule</Text>
                </TouchableOpacity>
            )}
        </View>
    );

    // -----------------------------------------------------------------------
    // Main render
    // -----------------------------------------------------------------------

    return (
        <SafeAreaView style={styles.container} edges={['top']}>
            <TabHeader />
            {/* Header */}
            <View style={styles.header}>
                <Text style={styles.title}>My Bookings</Text>
                <Text style={styles.subtitle}>
                    Manage your upcoming classes and view history
                </Text>
            </View>

            {/* Milestone card */}
            <View style={styles.milestoneCard}>
                <View style={styles.milestoneHeader}>
                    <Text style={styles.milestoneTitle}>Class Milestones</Text>
                    <Text style={styles.milestoneCount}>
                        {attendedCount} / {milestoneTarget}
                    </Text>
                </View>
                <View style={styles.progressBarTrack}>
                    <View style={[styles.progressBarFill, { width: `${milestoneProgress}%` }]} />
                </View>
                <View style={styles.badgeRow}>
                    {MILESTONE_BADGES.map((threshold) => {
                        const reached = attendedCount >= threshold;
                        return (
                            <View
                                key={threshold}
                                style={[
                                    styles.badgePill,
                                    reached ? styles.badgePillFilled : styles.badgePillOutline,
                                ]}
                            >
                                <Feather
                                    name="award"
                                    size={12}
                                    color={reached ? Colors.white : Colors.terra[400]}
                                />
                                <Text
                                    style={[
                                        styles.badgePillText,
                                        reached ? styles.badgePillTextFilled : styles.badgePillTextOutline,
                                    ]}
                                >
                                    {threshold}
                                </Text>
                            </View>
                        );
                    })}
                </View>
            </View>

            {/* Tab toggle */}
            <View style={styles.tabContainerOuter}>
              <View style={styles.tabContainer}>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'upcoming' && styles.tabButtonActive,
                    ]}
                    onPress={() => setActiveTab('upcoming')}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'upcoming' && styles.tabTextActive,
                        ]}
                    >
                        Upcoming
                    </Text>
                </TouchableOpacity>
                <TouchableOpacity
                    style={[
                        styles.tabButton,
                        activeTab === 'past' && styles.tabButtonActive,
                    ]}
                    onPress={() => setActiveTab('past')}
                    activeOpacity={0.7}
                >
                    <Text
                        style={[
                            styles.tabText,
                            activeTab === 'past' && styles.tabTextActive,
                        ]}
                    >
                        Past
                    </Text>
                </TouchableOpacity>
              </View>
            </View>

            {/* Content */}
            {loading ? (
                <View style={styles.loaderContainer}>
                    <ActivityIndicator size="large" color={Colors.terra[400]} />
                </View>
            ) : (
                <FlatList
                    data={filteredBookings}
                    keyExtractor={(item) => item.id}
                    renderItem={renderBookingCard}
                    ListEmptyComponent={renderEmpty}
                    refreshControl={
                        <RefreshControl
                            refreshing={refreshing}
                            onRefresh={onRefresh}
                            tintColor={Colors.terra[400]}
                            colors={[Colors.terra[400]]}
                        />
                    }
                    contentContainerStyle={[
                        styles.listContent,
                        filteredBookings.length === 0 && styles.listContentEmpty,
                    ]}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },

    // Header
    header: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xs,
        paddingBottom: Spacing.sm,
    },
    title: {
        fontSize: FontSize['3xl'],
        fontWeight: '800',
        color: Colors.olive[600],
        letterSpacing: -0.5,
    },
    subtitle: {
        fontSize: FontSize.sm,
        color: Colors.olive[400],
        marginTop: Spacing.xs,
    },

    // Milestone
    milestoneCard: {
        marginHorizontal: Spacing.lg,
        marginTop: Spacing.sm,
        backgroundColor: Colors.peach[50],
        borderWidth: 1,
        borderColor: Colors.borderMedium,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.lg,
    },
    milestoneHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.sm,
    },
    milestoneTitle: {
        fontSize: FontSize.base,
        fontWeight: '700',
        color: Colors.olive[600],
    },
    milestoneCount: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.terra[400],
    },
    progressBarTrack: {
        height: 8,
        backgroundColor: Colors.peach[200],
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    progressBarFill: {
        height: '100%',
        backgroundColor: Colors.terra[400],
        borderRadius: BorderRadius.full,
    },
    badgeRow: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.md,
    },
    badgePill: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: Spacing.md,
        paddingVertical: 6,
        borderRadius: BorderRadius.full,
        borderWidth: 1,
    },
    badgePillFilled: {
        backgroundColor: Colors.terra[400],
        borderColor: Colors.terra[400],
    },
    badgePillOutline: {
        backgroundColor: 'transparent',
        borderColor: Colors.terra[400],
    },
    badgePillText: {
        fontSize: FontSize.xs,
        fontWeight: '700',
    },
    badgePillTextFilled: {
        color: Colors.white,
    },
    badgePillTextOutline: {
        color: Colors.terra[400],
    },

    // Tabs
    tabContainerOuter: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
    },
    tabContainer: {
        flexDirection: 'row',
        alignSelf: 'flex-start',
        backgroundColor: Colors.peach[200],
        borderRadius: BorderRadius.xl,
        padding: 4,
        gap: 4,
    },
    tabButton: {
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm + 2,
        borderRadius: BorderRadius.full,
    },
    tabButtonActive: {
        backgroundColor: Colors.terra[400],
        ...Shadows.lg,
    },
    tabText: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.olive[400],
    },
    tabTextActive: {
        color: Colors.white,
    },

    // List
    listContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: 100,
    },
    listContentEmpty: {
        flexGrow: 1,
        justifyContent: 'center',
    },

    // Loading
    loaderContainer: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
    },

    // Card
    card: {
        backgroundColor: Colors.peach[50],
        borderWidth: 1,
        borderColor: Colors.borderMedium,
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.lg,
        marginBottom: Spacing.md,
    },
    cardTopRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        gap: Spacing.md,
    },
    headerLeft: {
        flex: 1,
        alignItems: 'flex-start',
        gap: Spacing.xs,
    },
    headerRight: {
        alignItems: 'flex-end',
    },

    // Status badge
    statusBadge: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        paddingHorizontal: 10,
        paddingVertical: 4,
        borderRadius: BorderRadius.full,
    },
    statusText: {
        fontSize: FontSize['2xs'],
        fontWeight: '700',
        letterSpacing: 0.5,
    },

    // Time
    timeText: {
        fontSize: FontSize['2xl'],
        fontWeight: '800',
        color: Colors.olive[600],
    },

    // Class info
    className: {
        fontSize: FontSize.xl,
        fontWeight: '700',
        color: Colors.olive[600],
    },
    trainerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    trainerName: {
        fontSize: FontSize.sm,
        color: Colors.olive[300],
    },
    spotLabel: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        color: Colors.olive[300],
        letterSpacing: 1,
        textTransform: 'uppercase',
        marginTop: 2,
    },
    guestLabel: {
        fontSize: FontSize.xs,
        color: Colors.warning,
        marginTop: 2,
    },

    // Details section
    detailsSection: {
        backgroundColor: Alpha.peach200_40,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        marginTop: Spacing.md,
        gap: Spacing.sm + 4,
    },
    detailRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    detailLabelRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    detailLabel: {
        fontSize: FontSize.sm,
        color: Colors.olive[400],
    },
    detailValue: {
        fontSize: FontSize.sm,
        fontWeight: '500',
        color: Colors.olive[600],
        flexShrink: 1,
        textAlign: 'right',
    },

    // Actions
    actionRow: {
        flexDirection: 'row',
        gap: Spacing.sm + 4,
        marginTop: Spacing.md,
    },
    cancelButton: {
        flex: 1,
        borderWidth: 1,
        borderColor: Alpha.error_20,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    cancelButtonText: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.error,
    },
    directionsButton: {
        flex: 1,
        backgroundColor: Colors.terra[400],
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    directionsButtonText: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.white,
    },
    bookAgainButton: {
        flex: 1,
        backgroundColor: Alpha.peach200_50,
        borderWidth: 1,
        borderColor: Colors.borderMedium,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.sm + 2,
        alignItems: 'center',
        justifyContent: 'center',
    },
    bookAgainText: {
        fontSize: FontSize.sm,
        fontWeight: '700',
        color: Colors.terra[400],
    },

    // Empty state
    emptyContainer: {
        alignItems: 'center',
        paddingVertical: Spacing['2xl'],
    },
    emptyIconWrapper: {
        width: 64,
        height: 64,
        borderRadius: BorderRadius.full,
        backgroundColor: Alpha.peach200_50,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    emptyTitle: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.olive[600],
        marginBottom: Spacing.xs,
    },
    emptySubtitle: {
        fontSize: FontSize.sm,
        color: Colors.olive[300],
        textAlign: 'center',
        paddingHorizontal: Spacing.xl,
        marginBottom: Spacing.lg,
    },
    browseButton: {
        backgroundColor: Colors.terra[400],
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.sm + 4,
        borderRadius: BorderRadius.xl,
    },
    browseButtonText: {
        fontSize: FontSize.base,
        fontWeight: '700',
        color: Colors.white,
    },
});
