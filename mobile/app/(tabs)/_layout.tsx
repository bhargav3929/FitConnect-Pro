import { Tabs } from 'expo-router';
import { View, StyleSheet, Platform } from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, Shadows } from '../../constants/theme';

type IoniconName = React.ComponentProps<typeof Ionicons>['name'];

const TAB_ICONS: Record<string, { active: IoniconName; inactive: IoniconName }> = {
    index: { active: 'home', inactive: 'home-outline' },
    schedule: { active: 'calendar', inactive: 'calendar-outline' },
    bookings: { active: 'bookmark', inactive: 'bookmark-outline' },
    profile: { active: 'person-circle', inactive: 'person-circle-outline' },
};

export default function TabLayout() {
    return (
        <Tabs
            screenOptions={({ route }) => ({
                headerShown: false,
                tabBarActiveTintColor: Colors.primary,
                tabBarInactiveTintColor: Colors.secondaryText,
                tabBarStyle: styles.tabBar,
                tabBarLabelStyle: styles.tabBarLabel,
                tabBarItemStyle: styles.tabBarItem,
                tabBarIcon: ({ focused, color }) => {
                    const icons = TAB_ICONS[route.name] || TAB_ICONS.index;
                    const iconName = focused ? icons.active : icons.inactive;
                    const iconSize = route.name === 'profile' ? 26 : 24;
                    return (
                        <View style={styles.iconContainer}>
                            {focused && <View style={styles.activeIndicator} />}
                            <Ionicons name={iconName} size={iconSize} color={color} />
                        </View>
                    );
                },
            })}
        >
            <Tabs.Screen
                name="index"
                options={{ title: 'Home', tabBarLabel: 'Home' }}
            />
            <Tabs.Screen
                name="schedule"
                options={{ title: 'Schedule', tabBarLabel: 'Schedule' }}
            />
            <Tabs.Screen
                name="bookings"
                options={{ title: 'Bookings', tabBarLabel: 'Bookings' }}
            />
            <Tabs.Screen
                name="profile"
                options={{ title: 'Profile', tabBarLabel: 'Profile' }}
            />
        </Tabs>
    );
}

const styles = StyleSheet.create({
    tabBar: {
        backgroundColor: Colors.card,
        borderTopWidth: 1,
        borderTopColor: 'rgba(212,180,148,0.12)',
        height: Platform.OS === 'ios' ? 88 : 64,
        paddingTop: Spacing.xs,
        paddingBottom: Platform.OS === 'ios' ? Spacing.lg : Spacing.sm,
        ...Shadows.sm,
    },
    tabBarLabel: {
        fontSize: FontSize['2xs'],
        fontWeight: '600',
        letterSpacing: 0.3,
        marginTop: 2,
    },
    tabBarItem: {
        paddingTop: 4,
    },
    iconContainer: {
        alignItems: 'center',
        justifyContent: 'center',
        position: 'relative',
        width: 32,
        height: 28,
    },
    activeIndicator: {
        position: 'absolute',
        top: -4,
        width: 20,
        height: 3,
        borderRadius: 2,
        backgroundColor: Colors.primary,
    },
});
