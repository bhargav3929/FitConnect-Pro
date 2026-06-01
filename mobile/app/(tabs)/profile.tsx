import { useState, useCallback } from 'react';
import {
    View,
    Text,
    StyleSheet,
    ScrollView,
    TouchableOpacity,
    TextInput,
    Alert,
    ActivityIndicator,
    Animated,
    Linking,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather, Ionicons } from '@expo/vector-icons';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';
import { getPlanById } from '@fitconnect/shared/types/subscription';
import { callDeleteAccount } from '@fitconnect/shared/firebase/firestore';
import {
    updatePassword,
    EmailAuthProvider,
    reauthenticateWithCredential,
} from 'firebase/auth';
import { auth } from '@fitconnect/shared/firebase/config';

// TODO: Replace with hosted legal URLs before App Store submission.
const PRIVACY_POLICY_URL = 'https://fitconnectpro.app/privacy';
const TERMS_OF_SERVICE_URL = 'https://fitconnectpro.app/terms';
import { Colors, Spacing, FontSize, BorderRadius, FontFamily, Alpha } from '../../constants/theme';
import TabHeader from '../../components/TabHeader';
import MilestoneCard from '../../components/MilestoneCard';

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function getInitials(name: string | undefined): string {
    if (!name) return 'U';
    const parts = name.trim().split(/\s+/);
    if (parts.length >= 2) return (parts[0][0] + parts[1][0]).toUpperCase();
    return parts[0][0].toUpperCase();
}

// ---------------------------------------------------------------------------
// Main Component
// ---------------------------------------------------------------------------

export default function ProfileScreen() {
    const { clientUser, logoutClient } = useClientAuthStore();
    const router = useRouter();

    // Password section state
    const [securityExpanded, setSecurityExpanded] = useState(false);
    const [currentPassword, setCurrentPassword] = useState('');
    const [newPassword, setNewPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showCurrentPw, setShowCurrentPw] = useState(false);
    const [showNewPw, setShowNewPw] = useState(false);
    const [showConfirmPw, setShowConfirmPw] = useState(false);
    const [pwLoading, setPwLoading] = useState(false);
    const [chevronRotation] = useState(new Animated.Value(0));

    const subscription = clientUser?.subscription;
    const stats = clientUser?.stats;
    const plan = subscription?.planId ? getPlanById(subscription.planId) : null;
    const isActive = subscription?.status === 'active';
    const planBadgeLabel = isActive && plan ? plan.name : 'Free Plan';

    const toggleSecurity = useCallback(() => {
        const toValue = securityExpanded ? 0 : 1;
        Animated.timing(chevronRotation, {
            toValue,
            duration: 200,
            useNativeDriver: true,
        }).start();
        setSecurityExpanded(!securityExpanded);
    }, [securityExpanded, chevronRotation]);

    const chevronRotateDeg = chevronRotation.interpolate({
        inputRange: [0, 1],
        outputRange: ['0deg', '90deg'],
    });

    const handleChangePassword = async () => {
        if (!newPassword || !confirmPassword || !currentPassword) {
            Alert.alert('Error', 'Please fill in all password fields.');
            return;
        }
        if (newPassword !== confirmPassword) {
            Alert.alert('Error', 'New passwords do not match.');
            return;
        }
        if (newPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters.');
            return;
        }

        setPwLoading(true);
        try {
            const user = auth.currentUser;
            if (!user || !user.email) throw new Error('Not authenticated');

            const credential = EmailAuthProvider.credential(user.email, currentPassword);
            await reauthenticateWithCredential(user, credential);
            await updatePassword(user, newPassword);

            Alert.alert('Success', 'Password updated successfully.');
            setCurrentPassword('');
            setNewPassword('');
            setConfirmPassword('');
            setSecurityExpanded(false);
            Animated.timing(chevronRotation, {
                toValue: 0,
                duration: 200,
                useNativeDriver: true,
            }).start();
        } catch (err: unknown) {
            const message =
                err instanceof Error ? err.message : 'Failed to update password.';
            Alert.alert('Error', message);
        } finally {
            setPwLoading(false);
        }
    };

    const handleLogout = () => {
        Alert.alert('Sign Out', 'Are you sure you want to sign out?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Sign Out',
                style: 'destructive',
                onPress: async () => {
                    await logoutClient();
                    router.replace('/login');
                },
            },
        ]);
    };

    const handleDeleteAccount = () => {
        Alert.alert(
            'Delete Account',
            'This permanently deletes your account, cancels all upcoming bookings, and erases your profile. This cannot be undone.',
            [
                { text: 'Cancel', style: 'cancel' },
                {
                    text: 'Continue',
                    style: 'destructive',
                    onPress: () => promptPasswordAndDelete(),
                },
            ],
        );
    };

    const promptPasswordAndDelete = () => {
        if (Platform.OS === 'ios') {
            Alert.prompt(
                'Confirm Password',
                'Re-enter your password to permanently delete this account.',
                [
                    { text: 'Cancel', style: 'cancel' },
                    {
                        text: 'Delete Forever',
                        style: 'destructive',
                        onPress: (pw?: string) => performDelete(pw || ''),
                    },
                ],
                'secure-text',
            );
        } else {
            // Android: Alert.prompt is iOS-only. Fallback to a router push to a dedicated screen would go here.
            Alert.alert(
                'Delete Account',
                'Account deletion on Android requires the dedicated Delete Account screen.',
            );
        }
    };

    const performDelete = async (password: string) => {
        if (!password) {
            Alert.alert('Error', 'Password is required.');
            return;
        }
        const user = auth.currentUser;
        if (!user || !user.email) {
            Alert.alert('Error', 'Not signed in.');
            return;
        }
        try {
            const credential = EmailAuthProvider.credential(user.email, password);
            await reauthenticateWithCredential(user, credential);
            await callDeleteAccount();
            await logoutClient();
            router.replace('/login');
        } catch (err: unknown) {
            const message = err instanceof Error ? err.message : 'Failed to delete account.';
            Alert.alert('Error', message);
        }
    };

    const openLegalLink = (url: string) => {
        Linking.openURL(url).catch(() =>
            Alert.alert('Unable to open link', 'Please try again later.'),
        );
    };

    const handleHelp = () => {
        Alert.alert('Help & Support', 'How can we reach you?', [
            { text: 'Cancel', style: 'cancel' },
            {
                text: 'Email Us',
                onPress: () =>
                    Linking.openURL(
                        'mailto:solpilatesstudio.in@gmail.com?subject=FitConnect%20Pro%20Support',
                    ).catch(() => Alert.alert('Email unavailable on this device.')),
            },
            {
                text: 'Call',
                onPress: () =>
                    Linking.openURL('tel:+12125550180').catch(() =>
                        Alert.alert('Calling unavailable on this device.'),
                    ),
            },
        ]);
    };

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <TabHeader />
            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* ─── Hero Card ──────────────────────────────────── */}
                <View style={styles.heroCard}>
                    <View style={styles.heroDecorLarge} />
                    <View style={styles.heroDecorSmall} />

                    <View style={styles.heroTopRow}>
                        <View style={styles.avatarRing}>
                            <View style={styles.avatar}>
                                <Text style={styles.avatarText}>
                                    {getInitials(clientUser?.name)}
                                </Text>
                            </View>
                        </View>

                        <View style={styles.heroInfoCol}>
                            <Text style={styles.heroName} numberOfLines={1}>
                                {clientUser?.name || 'User'}
                            </Text>
                            <View style={styles.heroEmailRow}>
                                <Feather name="mail" size={14} color={Colors.olive[400]} />
                                <Text style={styles.heroEmail} numberOfLines={1}>
                                    {clientUser?.email || ''}
                                </Text>
                            </View>
                            <View style={styles.planBadge}>
                                <Text style={styles.planBadgeText}>{planBadgeLabel}</Text>
                            </View>
                        </View>
                    </View>

                    <View style={styles.statsPanel}>
                        <View style={styles.statCol}>
                            <View style={styles.statIconRow}>
                                <Feather name="award" size={16} color={Colors.terra[400]} />
                                <Text style={styles.statValue}>
                                    {stats?.totalClassesAttended ?? 0}
                                </Text>
                            </View>
                            <Text style={styles.statLabel}>CLASSES</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statCol}>
                            <View style={styles.statIconRow}>
                                <Feather name="star" size={16} color={Colors.terra[400]} />
                                <Text style={styles.statValue}>
                                    {subscription?.classesRemaining === null
                                        ? '\u221E'
                                        : subscription?.classesRemaining ?? 0}
                                </Text>
                            </View>
                            <Text style={styles.statLabel}>CREDITS LEFT</Text>
                        </View>

                        <View style={styles.statDivider} />

                        <View style={styles.statCol}>
                            <View style={styles.statIconRow}>
                                <Ionicons
                                    name="flame-outline"
                                    size={16}
                                    color={Colors.terra[400]}
                                />
                                <Text style={styles.statValue}>
                                    {stats?.currentStreak ?? 0}
                                </Text>
                            </View>
                            <Text style={styles.statLabel}>STREAK</Text>
                        </View>
                    </View>

                    <MilestoneCard totalClassesAttended={stats?.totalClassesAttended ?? 0} />
                </View>

                {/* ─── Membership ─────────────────────────────────── */}
                <Text style={styles.sectionLabel}>MEMBERSHIP</Text>
                <TouchableOpacity
                    style={styles.rowCard}
                    onPress={() => router.push('/subscribe')}
                    activeOpacity={0.85}
                >
                    <View style={styles.rowIconSquare}>
                        <Feather name="credit-card" size={20} color={Colors.terra[400]} />
                    </View>
                    <View style={styles.rowTextCol}>
                        <Text style={styles.rowTitle}>
                            {isActive && plan ? plan.name : 'No Active Plan'}
                        </Text>
                        <Text style={styles.rowSubtitle}>
                            {isActive && plan
                                ? `${plan.category === 'membership' ? 'Membership' : 'Class Pack'}`
                                : 'Choose a plan to start booking classes'}
                        </Text>
                    </View>
                    <Feather name="arrow-right" size={18} color={Colors.terra[400]} />
                </TouchableOpacity>

                {/* ─── Quick Actions ─────────────────────────────── */}
                <View style={styles.quickRow}>
                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() => router.push('/(tabs)/schedule')}
                        activeOpacity={0.85}
                    >
                        <View style={styles.quickIconCircle}>
                            <Feather name="calendar" size={20} color={Colors.terra[400]} />
                        </View>
                        <Text style={styles.quickTitle}>Book a Class</Text>
                        <Text style={styles.quickSubtitle}>Browse schedule</Text>
                    </TouchableOpacity>

                    <TouchableOpacity
                        style={styles.quickCard}
                        onPress={() => router.push('/(tabs)/bookings')}
                        activeOpacity={0.85}
                    >
                        <View style={styles.quickIconCircle}>
                            <Feather name="target" size={20} color={Colors.olive[400]} />
                        </View>
                        <Text style={styles.quickTitle}>My Bookings</Text>
                        <Text style={styles.quickSubtitle}>View history</Text>
                    </TouchableOpacity>
                </View>

                {/* ─── Security ──────────────────────────────────── */}
                <Text style={styles.sectionLabel}>SECURITY</Text>
                <View style={styles.securityCard}>
                    <TouchableOpacity
                        style={styles.securityHeader}
                        onPress={toggleSecurity}
                        activeOpacity={0.85}
                    >
                        <View style={styles.rowIconSquare}>
                            <Feather name="lock" size={20} color={Colors.olive[400]} />
                        </View>
                        <View style={styles.rowTextCol}>
                            <Text style={styles.rowTitle}>Change Password</Text>
                            <Text style={styles.rowSubtitle}>
                                Update your account password
                            </Text>
                        </View>
                        <Animated.View style={{ transform: [{ rotate: chevronRotateDeg }] }}>
                            <Feather
                                name="chevron-right"
                                size={20}
                                color={Colors.olive[300]}
                            />
                        </Animated.View>
                    </TouchableOpacity>

                    {securityExpanded && (
                        <View style={styles.passwordForm}>
                            <Text style={styles.passwordFieldLabel}>CURRENT PASSWORD</Text>
                            <PasswordField
                                placeholder="Enter current password"
                                value={currentPassword}
                                onChangeText={setCurrentPassword}
                                visible={showCurrentPw}
                                onToggle={() => setShowCurrentPw(!showCurrentPw)}
                            />
                            <Text style={styles.passwordFieldLabel}>NEW PASSWORD</Text>
                            <PasswordField
                                placeholder="At least 6 characters"
                                value={newPassword}
                                onChangeText={setNewPassword}
                                visible={showNewPw}
                                onToggle={() => setShowNewPw(!showNewPw)}
                            />
                            <Text style={styles.passwordFieldLabel}>CONFIRM NEW PASSWORD</Text>
                            <PasswordField
                                placeholder="Repeat new password"
                                value={confirmPassword}
                                onChangeText={setConfirmPassword}
                                visible={showConfirmPw}
                                onToggle={() => setShowConfirmPw(!showConfirmPw)}
                            />
                            <TouchableOpacity
                                style={[
                                    styles.updatePwButton,
                                    pwLoading && styles.buttonDisabled,
                                ]}
                                onPress={handleChangePassword}
                                disabled={pwLoading}
                                activeOpacity={0.7}
                            >
                                {pwLoading ? (
                                    <ActivityIndicator size="small" color={Colors.white} />
                                ) : (
                                    <Text style={styles.updatePwButtonText}>
                                        UPDATE PASSWORD
                                    </Text>
                                )}
                            </TouchableOpacity>
                        </View>
                    )}
                </View>

                {/* ─── About ─────────────────────────────────────── */}
                <Text style={styles.sectionLabel}>ABOUT</Text>
                <TouchableOpacity
                    style={styles.rowCard}
                    onPress={() => router.push('/about')}
                    activeOpacity={0.85}
                >
                    <View style={styles.rowIconSquare}>
                        <Feather name="sun" size={20} color={Colors.terra[400]} />
                    </View>
                    <View style={styles.rowTextCol}>
                        <Text style={styles.rowTitle}>About SOL</Text>
                        <Text style={styles.rowSubtitle}>
                            Our story, philosophy and founder
                        </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={Colors.olive[300]} />
                </TouchableOpacity>
                <View style={{ height: Spacing.sm }} />
                <TouchableOpacity
                    style={styles.rowCard}
                    onPress={() => router.push('/shop')}
                    activeOpacity={0.85}
                >
                    <View style={styles.rowIconSquare}>
                        <Feather name="shopping-bag" size={20} color={Colors.terra[400]} />
                    </View>
                    <View style={styles.rowTextCol}>
                        <Text style={styles.rowTitle}>Shop</Text>
                        <Text style={styles.rowSubtitle}>
                            Studio merchandise — coming soon
                        </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={Colors.olive[300]} />
                </TouchableOpacity>

                {/* ─── Support ───────────────────────────────────── */}
                <Text style={styles.sectionLabel}>SUPPORT</Text>
                <TouchableOpacity
                    style={styles.rowCard}
                    onPress={handleHelp}
                    activeOpacity={0.85}
                >
                    <View style={styles.rowIconSquare}>
                        <Feather name="help-circle" size={20} color={Colors.olive[400]} />
                    </View>
                    <View style={styles.rowTextCol}>
                        <Text style={styles.rowTitle}>Help & FAQ</Text>
                        <Text style={styles.rowSubtitle}>
                            Get answers to common questions
                        </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={Colors.olive[300]} />
                </TouchableOpacity>

                {/* ─── Legal ─────────────────────────────────────── */}
                <Text style={styles.sectionLabel}>LEGAL</Text>
                <TouchableOpacity
                    style={styles.rowCard}
                    onPress={() => openLegalLink(PRIVACY_POLICY_URL)}
                    activeOpacity={0.85}
                >
                    <View style={styles.rowIconSquare}>
                        <Feather name="shield" size={20} color={Colors.olive[400]} />
                    </View>
                    <View style={styles.rowTextCol}>
                        <Text style={styles.rowTitle}>Privacy Policy</Text>
                        <Text style={styles.rowSubtitle}>How we handle your data</Text>
                    </View>
                    <Feather name="external-link" size={18} color={Colors.olive[300]} />
                </TouchableOpacity>

                <View style={{ height: Spacing.sm }} />
                <TouchableOpacity
                    style={styles.rowCard}
                    onPress={() => openLegalLink(TERMS_OF_SERVICE_URL)}
                    activeOpacity={0.85}
                >
                    <View style={styles.rowIconSquare}>
                        <Feather name="file-text" size={20} color={Colors.olive[400]} />
                    </View>
                    <View style={styles.rowTextCol}>
                        <Text style={styles.rowTitle}>Terms of Service</Text>
                        <Text style={styles.rowSubtitle}>The fine print</Text>
                    </View>
                    <Feather name="external-link" size={18} color={Colors.olive[300]} />
                </TouchableOpacity>

                {/* ─── Danger Zone ───────────────────────────────── */}
                <Text style={styles.sectionLabel}>DANGER ZONE</Text>
                <TouchableOpacity
                    style={styles.rowCard}
                    onPress={handleDeleteAccount}
                    activeOpacity={0.85}
                >
                    <View style={[styles.rowIconSquare, { backgroundColor: Alpha.error_10 }]}>
                        <Feather name="trash-2" size={20} color={Colors.error} />
                    </View>
                    <View style={styles.rowTextCol}>
                        <Text style={[styles.rowTitle, { color: Colors.error }]}>Delete Account</Text>
                        <Text style={styles.rowSubtitle}>
                            Permanently erase your profile and bookings
                        </Text>
                    </View>
                    <Feather name="chevron-right" size={20} color={Colors.olive[300]} />
                </TouchableOpacity>

                {/* ─── Sign Out ──────────────────────────────────── */}
                <TouchableOpacity
                    style={styles.signOutButton}
                    onPress={handleLogout}
                    activeOpacity={0.7}
                >
                    <Feather
                        name="log-out"
                        size={18}
                        color={Colors.error}
                        style={{ marginRight: Spacing.sm }}
                    />
                    <Text style={styles.signOutText}>Sign Out</Text>
                </TouchableOpacity>

                <Text style={styles.versionText}>
                    SOL PILATES STUDIO {'\u00B7'} v1.0.0
                </Text>
            </ScrollView>
        </SafeAreaView>
    );
}

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

function PasswordField({
    placeholder,
    value,
    onChangeText,
    visible,
    onToggle,
}: {
    placeholder: string;
    value: string;
    onChangeText: (t: string) => void;
    visible: boolean;
    onToggle: () => void;
}) {
    return (
        <View style={styles.inputWrapper}>
            <TextInput
                style={styles.textInput}
                placeholder={placeholder}
                placeholderTextColor={Colors.olive[300]}
                secureTextEntry={!visible}
                value={value}
                onChangeText={onChangeText}
                autoCapitalize="none"
            />
            <TouchableOpacity style={styles.eyeToggle} onPress={onToggle}>
                <Feather
                    name={visible ? 'eye-off' : 'eye'}
                    size={18}
                    color={Colors.olive[300]}
                />
            </TouchableOpacity>
        </View>
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
    container: {
        flex: 1,
    },
    contentContainer: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: 120,
    },

    // ── Hero Card ──────────────────────────────────────────────
    heroCard: {
        position: 'relative',
        overflow: 'hidden',
        backgroundColor: Colors.peach[300],
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.lg,
    },
    heroDecorLarge: {
        position: 'absolute',
        top: -40,
        right: -40,
        width: 180,
        height: 180,
        borderRadius: 90,
        backgroundColor: Alpha.terra400_07,
    },
    heroDecorSmall: {
        position: 'absolute',
        bottom: -30,
        left: -30,
        width: 140,
        height: 140,
        borderRadius: 70,
        backgroundColor: Alpha.terra500_10,
    },
    heroTopRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
    },
    avatarRing: {
        width: 96,
        height: 96,
        borderRadius: 48,
        backgroundColor: Colors.peach[50],
        padding: 4,
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatar: {
        width: 88,
        height: 88,
        borderRadius: 44,
        backgroundColor: Colors.terra[400],
        alignItems: 'center',
        justifyContent: 'center',
    },
    avatarText: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize['3xl'],
        color: Colors.white,
    },
    heroInfoCol: {
        flex: 1,
        minWidth: 0,
    },
    heroName: {
        fontFamily: FontFamily.display,
        fontSize: FontSize['2xl'],
        color: Colors.olive[600],
        letterSpacing: -0.5,
    },
    heroEmailRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
        marginTop: 4,
    },
    heroEmail: {
        flexShrink: 1,
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.olive[400],
    },
    planBadge: {
        alignSelf: 'flex-start',
        marginTop: Spacing.sm,
        backgroundColor: Alpha.terra400_12,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md - 4,
        paddingVertical: 4,
    },
    planBadgeText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.terra[400],
    },

    // Stats panel inside hero
    statsPanel: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Alpha.peach100_55,
        borderRadius: BorderRadius.xl,
        padding: Spacing.md,
        marginTop: Spacing.lg,
    },
    statCol: {
        flex: 1,
        alignItems: 'center',
    },
    statIconRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 6,
    },
    statValue: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize['2xl'],
        color: Colors.olive[600],
    },
    statLabel: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize['2xs'],
        color: Colors.olive[300],
        letterSpacing: 1,
        marginTop: 6,
    },
    statDivider: {
        width: 1,
        height: 36,
        backgroundColor: Alpha.olive400_20,
    },

    // ── Section labels ─────────────────────────────────────────
    sectionLabel: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize['2xs'],
        color: Colors.olive[300],
        letterSpacing: 2,
        marginTop: Spacing.xl,
        marginBottom: Spacing.sm,
        paddingHorizontal: Spacing.xs,
    },

    // ── Row cards (Membership, Security, Support) ─────────────
    rowCard: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        backgroundColor: Colors.peach[50],
        borderRadius: BorderRadius['2xl'],
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
    },
    rowIconSquare: {
        width: 44,
        height: 44,
        borderRadius: 22,
        backgroundColor: Alpha.terra400_10,
        alignItems: 'center',
        justifyContent: 'center',
    },
    rowTextCol: {
        flex: 1,
    },
    rowTitle: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.base,
        color: Colors.olive[600],
    },
    rowSubtitle: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.olive[400],
        marginTop: 2,
    },

    // ── Quick action grid ─────────────────────────────────────
    quickRow: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginTop: Spacing.md,
    },
    quickCard: {
        flex: 1,
        backgroundColor: Colors.peach[50],
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.lg,
        alignItems: 'center',
    },
    quickIconCircle: {
        width: 48,
        height: 48,
        borderRadius: 24,
        backgroundColor: Alpha.terra400_10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    quickTitle: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.base,
        color: Colors.olive[600],
    },
    quickSubtitle: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.xs,
        color: Colors.olive[400],
        marginTop: 2,
    },

    // ── Security card (wraps header + form) ────────────────────
    securityCard: {
        backgroundColor: Colors.peach[50],
        borderRadius: BorderRadius['2xl'],
        overflow: 'hidden',
    },
    securityHeader: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        paddingVertical: Spacing.md,
        paddingHorizontal: Spacing.md,
    },

    // ── Password form ──────────────────────────────────────────
    passwordForm: {
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
    },
    passwordFieldLabel: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.olive[600],
        letterSpacing: 1,
        marginTop: Spacing.sm,
        marginBottom: Spacing.sm,
    },
    inputWrapper: {
        position: 'relative',
        marginBottom: Spacing.xs,
    },
    textInput: {
        backgroundColor: Colors.peach[100],
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md - 2,
        fontFamily: FontFamily.sans,
        fontSize: FontSize.base,
        color: Colors.olive[600],
        paddingRight: 48,
    },
    eyeToggle: {
        position: 'absolute',
        right: Spacing.md,
        top: 0,
        bottom: 0,
        justifyContent: 'center',
    },
    updatePwButton: {
        backgroundColor: Colors.terra[400],
        borderRadius: BorderRadius.xl,
        paddingVertical: Spacing.md - 4,
        alignItems: 'center',
        marginTop: Spacing.xs,
    },
    updatePwButtonText: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.sm,
        color: Colors.white,
        letterSpacing: 1,
    },
    buttonDisabled: {
        opacity: 0.6,
    },

    // ── Sign out ───────────────────────────────────────────────
    signOutButton: {
        flexDirection: 'row',
        justifyContent: 'center',
        alignItems: 'center',
        borderWidth: 1,
        borderColor: Alpha.error_25,
        borderRadius: BorderRadius.xl,
        paddingVertical: Spacing.md - 2,
        marginTop: Spacing.xl,
    },
    signOutText: {
        fontFamily: FontFamily.sansExtra,
        color: Colors.error,
        fontSize: FontSize.base,
    },
    versionText: {
        textAlign: 'center',
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize['2xs'],
        color: Alpha.olive300_50,
        letterSpacing: 1.5,
        marginTop: Spacing.md,
    },
});
