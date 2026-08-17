import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import Logo from './Logo';
import { Colors, Spacing, FontSize, FontFamily } from '../constants/theme';
import { useNotifications } from '../hooks/useNotifications';

interface TabHeaderProps {
    logoHeight?: number;
}

// Fixed top header — identical position/padding on every tab screen.
// Mount this directly inside SafeAreaView (NOT inside a ScrollView) so it stays pinned.
export default function TabHeader({ logoHeight = 56 }: TabHeaderProps) {
    const router = useRouter();
    const { unreadCount } = useNotifications();

    return (
        <View style={styles.container}>
            <Logo height={logoHeight} />
            <TouchableOpacity
                onPress={() => router.push('/notifications')}
                style={styles.bellBtn}
                activeOpacity={0.7}
                accessibilityRole="button"
                accessibilityLabel={
                    unreadCount > 0 ? `Notifications, ${unreadCount} unread` : 'Notifications'
                }
            >
                <Feather name="bell" size={20} color={Colors.olive[500]} />
                {unreadCount > 0 && (
                    <View style={styles.badge}>
                        <Text style={styles.badgeText}>{unreadCount > 9 ? '9+' : unreadCount}</Text>
                    </View>
                )}
            </TouchableOpacity>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingLeft: Spacing.lg,
        paddingRight: Spacing.lg,
        paddingVertical: 0,
        marginBottom: Spacing.sm,
        backgroundColor: Colors.background,
    },
    bellBtn: {
        width: 40,
        height: 40,
        alignItems: 'center',
        justifyContent: 'center',
    },
    badge: {
        position: 'absolute',
        top: 4,
        right: 4,
        minWidth: 16,
        height: 16,
        paddingHorizontal: 4,
        borderRadius: 8,
        backgroundColor: Colors.terra[400],
        alignItems: 'center',
        justifyContent: 'center',
    },
    badgeText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize['2xs'],
        color: Colors.white,
        lineHeight: 14,
    },
});
