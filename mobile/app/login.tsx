import { useState, useRef, useCallback, useEffect } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    Alert,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
    ActivityIndicator,
    Animated,
    Easing,
    Linking,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import * as WebBrowser from 'expo-web-browser';
import * as AuthSession from 'expo-auth-session';
import * as Crypto from 'expo-crypto';
import Constants from 'expo-constants';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';
import {
    Colors,
    Spacing,
    FontSize,
    BorderRadius,
    FontFamily,
    Alpha,
} from '../constants/theme';
import Logo from '../components/Logo';

WebBrowser.maybeCompleteAuthSession();

type AuthTab = 'signin' | 'signup';

const SLIDE_DISTANCE = 20;

export default function LoginScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ tab?: string; returnTo?: string }>();
    const { loginClient, signupClient, googleSignInWithIdToken } = useClientAuthStore();
    const [googleLoading, setGoogleLoading] = useState(false);

    const rawReturnTo = typeof params.returnTo === 'string' ? params.returnTo : undefined;
    const returnTo =
        rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
            ? (rawReturnTo as any)
            : '/(tabs)';
    const initialTab: AuthTab = params.tab === 'signup' ? 'signup' : 'signin';

    const googleAuthConfig = Constants.expoConfig?.extra?.googleAuth || {
        iosClientId: undefined,
        androidClientId: undefined,
        webClientId: undefined,
    };

    const discovery = AuthSession.useAutoDiscovery(
        'https://accounts.google.com',
    );

    const [nonce] = useState(() =>
        Crypto.randomUUID
            ? Crypto.randomUUID()
            : Array.from({ length: 32 }, () => Math.floor(Math.random() * 16).toString(16)).join(''),
    );

    const [request, response, promptAsync] = AuthSession.useAuthRequest(
        {
            clientId: Platform.OS === 'ios' ? googleAuthConfig.iosClientId : googleAuthConfig.androidClientId,
            scopes: ['openid', 'profile', 'email'],
            responseType: 'id_token',
            extraParams: { nonce },
            redirectUri: AuthSession.makeRedirectUri({
                native: 'fitconnect://',
            }),
        },
        discovery,
    );

    useEffect(() => {
        if (response?.type === 'success') {
            const { id_token } = response.params;
            if (id_token) {
                handleGoogleSignInWithToken(id_token);
            }
        }
    }, [response]);

    const handleGoogleSignInWithToken = async (idToken: string) => {
        setGoogleLoading(true);
        const result = await googleSignInWithIdToken(idToken);
        setGoogleLoading(false);
        if (result.success) {
            router.replace(returnTo);
        } else {
            Alert.alert('Sign-in Failed', result.error || 'Something went wrong');
        }
    };

    const handleGoogleSignIn = async () => {
        if (!googleAuthConfig.iosClientId && !googleAuthConfig.androidClientId) {
            Alert.alert(
                'Configuration Error',
                'Google OAuth client IDs not configured. Please contact support.',
            );
            return;
        }
        try {
            await promptAsync();
        } catch {
            Alert.alert('Error', 'Failed to initiate Google sign-in');
        }
    };

    const [activeTab, setActiveTab] = useState<AuthTab>(initialTab);
    const formOpacity = useRef(new Animated.Value(1)).current;
    const formTranslateY = useRef(new Animated.Value(0)).current;
    const isSwitching = useRef(false);

    const switchTab = useCallback(
        (next: AuthTab) => {
            if (next === activeTab || isSwitching.current) return;
            isSwitching.current = true;

            setActiveTab(next);
            formOpacity.setValue(0);
            formTranslateY.setValue(SLIDE_DISTANCE);

            Animated.parallel([
                Animated.timing(formOpacity, {
                    toValue: 1,
                    duration: 260,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(formTranslateY, {
                    toValue: 0,
                    duration: 260,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]).start(() => {
                isSwitching.current = false;
            });
        },
        [activeTab, formOpacity, formTranslateY],
    );

    const [loginEmail, setLoginEmail] = useState('');
    const [loginPassword, setLoginPassword] = useState('');
    const [showLoginPassword, setShowLoginPassword] = useState(false);
    const [loginLoading, setLoginLoading] = useState(false);

    const [signupName, setSignupName] = useState('');
    const [signupEmail, setSignupEmail] = useState('');
    const [signupPassword, setSignupPassword] = useState('');
    const [signupConfirmPassword, setSignupConfirmPassword] = useState('');
    const [showSignupPassword, setShowSignupPassword] = useState(false);
    const [signupLoading, setSignupLoading] = useState(false);

    const loginPasswordRef = useRef<TextInput>(null);
    const signupEmailRef = useRef<TextInput>(null);
    const signupPasswordRef = useRef<TextInput>(null);
    const signupConfirmRef = useRef<TextInput>(null);

    const isLoading = loginLoading || signupLoading || googleLoading;

    const handleLogin = async () => {
        if (!loginEmail || !loginPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        setLoginLoading(true);
        const result = await loginClient(loginEmail, loginPassword);
        setLoginLoading(false);
        if (result.success) router.replace(returnTo);
        else Alert.alert('Login Failed', result.error || 'Something went wrong');
    };

    const handleSignup = async () => {
        if (!signupName || !signupEmail || !signupPassword || !signupConfirmPassword) {
            Alert.alert('Error', 'Please fill in all fields');
            return;
        }
        if (signupPassword !== signupConfirmPassword) {
            Alert.alert('Error', 'Passwords do not match');
            return;
        }
        if (signupPassword.length < 6) {
            Alert.alert('Error', 'Password must be at least 6 characters');
            return;
        }
        setSignupLoading(true);
        const result = await signupClient(signupEmail, signupPassword, signupName);
        setSignupLoading(false);
        if (result.success) router.replace(returnTo);
        else Alert.alert('Signup Failed', result.error || 'Something went wrong');
    };

    const headerTitle = activeTab === 'signin' ? 'MEMBER LOGIN' : 'CREATE ACCOUNT';
    const headerSubtitle =
        activeTab === 'signin' ? 'SIGN IN TO YOUR ACCOUNT' : 'JOIN SOL PILATES STUDIO';

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    {/* Header row: back arrow + logo */}
                    <View style={styles.topRow}>
                        <TouchableOpacity
                            onPress={() => router.canGoBack() ? router.back() : null}
                            hitSlop={{ top: 12, bottom: 12, left: 12, right: 12 }}
                        >
                            <Feather name="arrow-left" size={22} color={Colors.olive[400]} />
                        </TouchableOpacity>
                        <Logo variant="terra" height={48} />
                        <View style={styles.topRowSpacer} />
                    </View>

                    {/* User icon square */}
                    <View style={styles.userIconSquare}>
                        <Feather
                            name={activeTab === 'signin' ? 'user' : 'user-plus'}
                            size={28}
                            color={Colors.primary}
                        />
                    </View>

                    {/* Title + subtitle */}
                    <Text style={styles.title}>{headerTitle}</Text>
                    <Text style={styles.subtitle}>{headerSubtitle}</Text>

                    {/* Square tab switcher */}
                    <View style={styles.tabContainer}>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'signin' && styles.tabActive]}
                            onPress={() => switchTab('signin')}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === 'signin' && styles.tabTextActive,
                                ]}
                            >
                                SIGN IN
                            </Text>
                        </TouchableOpacity>
                        <TouchableOpacity
                            style={[styles.tab, activeTab === 'signup' && styles.tabActive]}
                            onPress={() => switchTab('signup')}
                            activeOpacity={0.7}
                        >
                            <Text
                                style={[
                                    styles.tabText,
                                    activeTab === 'signup' && styles.tabTextActive,
                                ]}
                            >
                                SIGN UP
                            </Text>
                        </TouchableOpacity>
                    </View>

                    <Animated.View
                        style={{
                            opacity: formOpacity,
                            transform: [{ translateY: formTranslateY }],
                        }}
                    >

                    {/* Sign In form */}
                    {activeTab === 'signin' && (
                        <View style={styles.form}>
                            <FieldLabel>EMAIL</FieldLabel>
                            <InputRow icon="mail">
                                <TextInput
                                    style={styles.input}
                                    placeholder="you@example.com"
                                    placeholderTextColor={Alpha.olive300_50}
                                    value={loginEmail}
                                    onChangeText={setLoginEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="next"
                                    onSubmitEditing={() => loginPasswordRef.current?.focus()}
                                    editable={!isLoading}
                                />
                            </InputRow>

                            <FieldLabel>PASSWORD</FieldLabel>
                            <InputRow icon="lock">
                                <TextInput
                                    ref={loginPasswordRef}
                                    style={styles.input}
                                    placeholder="Enter password"
                                    placeholderTextColor={Alpha.olive300_50}
                                    value={loginPassword}
                                    onChangeText={setLoginPassword}
                                    secureTextEntry={!showLoginPassword}
                                    returnKeyType="done"
                                    onSubmitEditing={handleLogin}
                                    editable={!isLoading}
                                />
                                <EyeToggle
                                    visible={showLoginPassword}
                                    onPress={() => setShowLoginPassword(!showLoginPassword)}
                                />
                            </InputRow>

                            <SubmitButton
                                label={loginLoading ? 'VERIFYING...' : 'SIGN IN'}
                                loading={loginLoading}
                                disabled={isLoading || googleLoading}
                                onPress={handleLogin}
                            />

                            <GoogleSignInButton
                                loading={googleLoading}
                                disabled={isLoading}
                                onPress={handleGoogleSignIn}
                            />
                        </View>
                    )}

                    {/* Sign Up form */}
                    {activeTab === 'signup' && (
                        <View style={styles.form}>
                            <FieldLabel>FULL NAME</FieldLabel>
                            <InputRow icon="user">
                                <TextInput
                                    style={styles.input}
                                    placeholder="Your full name"
                                    placeholderTextColor={Alpha.olive300_50}
                                    value={signupName}
                                    onChangeText={setSignupName}
                                    autoCapitalize="words"
                                    returnKeyType="next"
                                    onSubmitEditing={() => signupEmailRef.current?.focus()}
                                    editable={!isLoading}
                                />
                            </InputRow>

                            <FieldLabel>EMAIL</FieldLabel>
                            <InputRow icon="mail">
                                <TextInput
                                    ref={signupEmailRef}
                                    style={styles.input}
                                    placeholder="you@example.com"
                                    placeholderTextColor={Alpha.olive300_50}
                                    value={signupEmail}
                                    onChangeText={setSignupEmail}
                                    keyboardType="email-address"
                                    autoCapitalize="none"
                                    autoCorrect={false}
                                    returnKeyType="next"
                                    onSubmitEditing={() => signupPasswordRef.current?.focus()}
                                    editable={!isLoading}
                                />
                            </InputRow>

                            <FieldLabel>PASSWORD</FieldLabel>
                            <InputRow icon="lock">
                                <TextInput
                                    ref={signupPasswordRef}
                                    style={styles.input}
                                    placeholder="At least 6 characters"
                                    placeholderTextColor={Alpha.olive300_50}
                                    value={signupPassword}
                                    onChangeText={setSignupPassword}
                                    secureTextEntry={!showSignupPassword}
                                    returnKeyType="next"
                                    onSubmitEditing={() => signupConfirmRef.current?.focus()}
                                    editable={!isLoading}
                                />
                                <EyeToggle
                                    visible={showSignupPassword}
                                    onPress={() => setShowSignupPassword(!showSignupPassword)}
                                />
                            </InputRow>

                            <FieldLabel>CONFIRM PASSWORD</FieldLabel>
                            <InputRow icon="lock">
                                <TextInput
                                    ref={signupConfirmRef}
                                    style={styles.input}
                                    placeholder="Repeat password"
                                    placeholderTextColor={Alpha.olive300_50}
                                    value={signupConfirmPassword}
                                    onChangeText={setSignupConfirmPassword}
                                    secureTextEntry={!showSignupPassword}
                                    returnKeyType="done"
                                    onSubmitEditing={handleSignup}
                                    editable={!isLoading}
                                />
                            </InputRow>

                            <SubmitButton
                                label={signupLoading ? 'CREATING ACCOUNT...' : 'CREATE ACCOUNT'}
                                loading={signupLoading}
                                disabled={isLoading || googleLoading}
                                onPress={handleSignup}
                            />

                            <GoogleSignInButton
                                loading={googleLoading}
                                disabled={isLoading}
                                onPress={handleGoogleSignIn}
                            />

                            <Text style={styles.legalDisclosure}>
                                By creating an account, you agree to our{' '}
                                <Text
                                    style={styles.legalLink}
                                    onPress={() =>
                                        Linking.openURL('https://fitconnectpro.app/terms')
                                    }
                                >
                                    Terms of Service
                                </Text>{' '}
                                and{' '}
                                <Text
                                    style={styles.legalLink}
                                    onPress={() =>
                                        Linking.openURL('https://fitconnectpro.app/privacy')
                                    }
                                >
                                    Privacy Policy
                                </Text>
                                .
                            </Text>
                        </View>
                    )}

                    </Animated.View>

                    <View style={styles.divider} />

                    <View style={styles.footerRow}>
                        <Text style={styles.footerLeft}>SECURE ACCESS</Text>
                        <TouchableOpacity
                            onPress={() => router.push('/subscribe')}
                            activeOpacity={0.7}
                        >
                            <Text style={styles.footerRight}>View Plans →</Text>
                        </TouchableOpacity>
                    </View>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

// ---------------------------------------------------------------------------
// Small presentational helpers
// ---------------------------------------------------------------------------

function FieldLabel({ children }: { children: React.ReactNode }) {
    return <Text style={styles.fieldLabel}>{children}</Text>;
}

function InputRow({
    icon,
    children,
}: {
    icon: React.ComponentProps<typeof Feather>['name'];
    children: React.ReactNode;
}) {
    return (
        <View style={styles.inputRow}>
            <Feather
                name={icon}
                size={18}
                color={Alpha.olive300_70}
                style={styles.inputIcon}
            />
            {children}
        </View>
    );
}

function EyeToggle({ visible, onPress }: { visible: boolean; onPress: () => void }) {
    return (
        <TouchableOpacity
            onPress={onPress}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
            style={styles.eyeButton}
        >
            <Feather
                name={visible ? 'eye-off' : 'eye'}
                size={18}
                color={Alpha.olive300_70}
            />
        </TouchableOpacity>
    );
}

function SubmitButton({
    label,
    loading,
    disabled,
    onPress,
}: {
    label: string;
    loading: boolean;
    disabled: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.submitButton, disabled && styles.submitButtonDisabled]}
            onPress={onPress}
            disabled={disabled}
            activeOpacity={0.85}
        >
            {loading ? (
                <View style={styles.loadingRow}>
                    <ActivityIndicator size="small" color={Colors.white} />
                    <Text style={styles.submitButtonText}>{label}</Text>
                </View>
            ) : (
                <Text style={styles.submitButtonText}>{label}</Text>
            )}
        </TouchableOpacity>
    );
}

function GoogleSignInButton({
    loading,
    disabled,
    onPress,
}: {
    loading: boolean;
    disabled: boolean;
    onPress: () => void;
}) {
    return (
        <TouchableOpacity
            style={[styles.googleButton, disabled && styles.googleButtonDisabled]}
            onPress={onPress}
            disabled={disabled || loading}
            activeOpacity={0.85}
        >
            <Feather name="mail" size={18} color={Colors.olive[600]} />
            <Text style={styles.googleButtonText}>
                {loading ? 'SIGNING IN...' : 'SIGN IN WITH GOOGLE'}
            </Text>
        </TouchableOpacity>
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
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing.xl,
    },

    // Header
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.md,
        marginBottom: Spacing['2xl'],
    },
    topRowSpacer: {
        flex: 1,
    },

    // User icon box
    userIconSquare: {
        width: 64,
        height: 64,
        backgroundColor: Alpha.terra400_10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.lg,
    },

    // Title
    title: {
        fontFamily: FontFamily.display,
        fontSize: FontSize['3xl'],
        color: Colors.olive[600],
        letterSpacing: -0.5,
        marginBottom: Spacing.sm,
    },
    subtitle: {
        fontFamily: FontFamily.sansMedium,
        fontSize: FontSize.sm,
        color: Colors.olive[300],
        letterSpacing: 1.5,
        marginBottom: Spacing.xl,
    },

    // Square tabs
    tabContainer: {
        flexDirection: 'row',
        backgroundColor: Alpha.peach300_50,
        padding: 4,
        marginBottom: Spacing.xl,
    },
    tab: {
        flex: 1,
        paddingVertical: Spacing.md - 4,
        alignItems: 'center',
    },
    tabActive: {
        backgroundColor: Colors.primary,
    },
    tabText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.olive[400],
        letterSpacing: 1.5,
    },
    tabTextActive: {
        color: Colors.peach[50],
    },

    // Form
    form: {
        marginBottom: Spacing.lg,
    },
    fieldLabel: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.olive[600],
        letterSpacing: 1.5,
        marginBottom: Spacing.sm,
        marginTop: Spacing.md,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.peach[50],
        borderWidth: 1,
        borderColor: Alpha.peach400_30,
        height: 56,
        paddingHorizontal: Spacing.md,
    },
    inputIcon: {
        marginRight: Spacing.sm + 4,
    },
    input: {
        flex: 1,
        height: '100%',
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.olive[600],
        paddingVertical: 0,
    },
    eyeButton: {
        padding: Spacing.xs,
        marginLeft: Spacing.xs,
    },

    // Submit button
    submitButton: {
        marginTop: Spacing.lg,
        height: 56,
        backgroundColor: Colors.primary,
        alignItems: 'center',
        justifyContent: 'center',
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.sm,
        color: Colors.peach[50],
        letterSpacing: 1.5,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },

    // Footer
    divider: {
        height: 1,
        backgroundColor: Alpha.peach400_20,
        marginVertical: Spacing.xl,
    },
    footerRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'center',
    },
    footerLeft: {
        fontFamily: FontFamily.sansMedium,
        fontSize: FontSize.xs,
        color: Alpha.olive300_60,
        letterSpacing: 1.5,
    },
    footerRight: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.primary,
        letterSpacing: 1.5,
    },
    legalDisclosure: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.xs,
        color: Alpha.olive300_80,
        textAlign: 'center',
        marginTop: Spacing.md,
        lineHeight: 16,
        paddingHorizontal: Spacing.sm,
    },
    legalLink: {
        fontFamily: FontFamily.sansBold,
        color: Colors.primary,
    },

    // Google Sign-In button
    googleButton: {
        marginTop: Spacing.md,
        height: 56,
        backgroundColor: Alpha.peach300_40,
        borderWidth: 1,
        borderColor: Alpha.peach400_30,
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
    },
    googleButtonDisabled: {
        opacity: 0.6,
    },
    googleButtonText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.olive[600],
        letterSpacing: 1.5,
    },
});
