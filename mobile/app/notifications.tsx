import { useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    FlatList,
    TouchableOpacity,
    ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import {
    markNotificationRead,
    markAllNotificationsRead,
} from '@fitconnect/shared/firebase/firestore';
import type { AppNotification, NotificationType } from '@fitconnect/shared/types/notification';
import { Colors, Spacing, FontSize, BorderRadius, FontFamily, Alpha } from '../constants/theme';
import { useNotifications } from '../hooks/useNotifications';

type FeatherName = React.ComponentProps<typeof Feather>['name'];

const TYPE_ICONS: Record<NotificationType, FeatherName> = {
    class_reminder: 'calendar',
    plan_expiry: 'credit-card',
    announcement: 'volume-2',
};

/** Maps a notification's web route to the equivalent mobile route. */
const LINK_ROUTES: Record<string, string> = {
    '/user/bookings': '/(tabs)/bookings',
    '/user/schedule': '/(tabs)/schedule',
    '/user/subscribe': '/subscribe',
    '/user/profile': '/(tabs)/profile',
};

function relativeTime(raw: unknown): string {
    if (!raw) return '';
    const date =
        raw instanceof Date
            ? raw
            : raw && typeof raw === 'object' && 'seconds' in (raw as Record<string, unknown>)
                ? new Date((raw as { seconds: number }).seconds * 1000)
                : new Date(raw as string);
    if (isNaN(date.getTime())) return '';

    const seconds = Math.floor((Date.now() - date.getTime()) / 1000);
    if (seconds < 60) return 'Just now';

    const minutes = Math.floor(seconds / 60);
    if (minutes < 60) return `${minutes}m ago`;

    const hours = Math.floor(minutes / 60);
    if (hours < 24) return `${hours}h ago`;

    const days = Math.floor(hours / 24);
    if (days < 7) return `${days}d ago`;

    return date.toLocaleDateString('en-IN', { day: 'numeric', month: 'short' });
}

export default function NotificationsScreen() {
    const router = useRouter();
    const { notifications, unreadCount, isLoading } = useNotifications();

    const handlePress = useCallback(
        (notification: AppNotification) => {
            if (!notification.read) {
                void markNotificationRead(notification.id).catch(() => { });
            }
            const route = notification.link ? LINK_ROUTES[notification.link] : undefined;
            if (route) router.push(route as never);
        },
        [router],
    );

    const handleMarkAllRead = useCallback(() => {
        void markAllNotificationsRead(notifications).catch(() => { });
    }, [notifications]);

    const renderItem = useCallback(
        ({ item }: { item: AppNotification }) => (
            <TouchableOpacity
                style={[styles.row, !item.read && styles.rowUnread]}
                onPress={() => handlePress(item)}
                activeOpacity={0.7}
            >
                <View style={[styles.iconWrap, !item.read && styles.iconWrapUnread]}>
                    <Feather
                        name={TYPE_ICONS[item.type] ?? 'bell'}
                        size={16}
                        color={item.read ? Colors.olive[300] : Colors.terra[400]}
                    />
                </View>
                <View style={styles.rowBody}>
                    <Text style={[styles.rowTitle, !item.read && styles.rowTitleUnread]}>
                        {item.title}
                    </Text>
                    <Text style={styles.rowText}>{item.body}</Text>
                    <Text style={styles.rowTime}>{relativeTime(item.createdAt)}</Text>
                </View>
                {!item.read && <View style={styles.unreadDot} />}
            </TouchableOpacity>
        ),
        [handlePress],
    );

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity onPress={() => router.back()} style={styles.backBtn} activeOpacity={0.7}>
                    <Feather name="arrow-left" size={22} color={Colors.olive[600]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>NOTIFICATIONS</Text>
                {unreadCount > 0 ? (
                    <TouchableOpacity onPress={handleMarkAllRead} activeOpacity={0.7} style={styles.markAllBtn}>
                        <Text style={styles.markAllText}>Read all</Text>
                    </TouchableOpacity>
                ) : (
                    <View style={{ width: 60 }} />
                )}
            </View>

            {isLoading ? (
                <View style={styles.centered}>
                    <ActivityIndicator color={Colors.terra[400]} />
                </View>
            ) : notifications.length === 0 ? (
                <View style={styles.centered}>
                    <Feather name="bell" size={28} color={Colors.olive[300]} />
                    <Text style={styles.emptyTitle}>You&rsquo;re all caught up</Text>
                    <Text style={styles.emptyText}>
                        Class reminders, plan updates, and studio announcements land here.
                    </Text>
                </View>
            ) : (
                <FlatList
                    data={notifications}
                    keyExtractor={(item) => item.id}
                    renderItem={renderItem}
                    contentContainerStyle={styles.listContent}
                    showsVerticalScrollIndicator={false}
                />
            )}
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Alpha.olive400_12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.peach[100],
    },
    headerTitle: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.sm,
        color: Colors.olive[600],
        letterSpacing: 2,
    },
    markAllBtn: {
        width: 60,
        alignItems: 'flex-end',
    },
    markAllText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.terra[400],
    },
    centered: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.sm,
    },
    emptyTitle: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.base,
        color: Colors.olive[600],
        marginTop: Spacing.xs,
    },
    emptyText: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.olive[300],
        textAlign: 'center',
        lineHeight: 20,
    },
    listContent: {
        paddingBottom: 40,
    },
    row: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        gap: Spacing.md - 4,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Alpha.olive400_08,
        backgroundColor: Colors.background,
    },
    rowUnread: {
        backgroundColor: Alpha.terra400_07,
    },
    iconWrap: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.full,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Alpha.olive400_08,
        marginTop: 2,
    },
    iconWrapUnread: {
        backgroundColor: Alpha.terra400_15,
    },
    rowBody: { flex: 1, gap: 2 },
    rowTitle: {
        fontFamily: FontFamily.sansMedium,
        fontSize: FontSize.sm,
        color: Colors.olive[500],
    },
    rowTitleUnread: {
        fontFamily: FontFamily.sansBold,
        color: Colors.olive[700] ?? Colors.olive[600],
    },
    rowText: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.xs,
        color: Colors.olive[400],
        lineHeight: 18,
    },
    rowTime: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize['2xs'],
        color: Colors.olive[300],
        marginTop: 2,
    },
    unreadDot: {
        width: 7,
        height: 7,
        borderRadius: 4,
        backgroundColor: Colors.terra[400],
        marginTop: Spacing.sm,
    },
});
