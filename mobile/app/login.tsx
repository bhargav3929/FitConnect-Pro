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
    useWindowDimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';
import * as WebBrowser from 'expo-web-browser';
import * as Google from 'expo-auth-session/providers/google';
import Constants from 'expo-constants';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';
import {
    Spacing,
    FontSize,
    BorderRadius,
    FontFamily,
} from '../constants/theme';
import Logo from '../components/Logo';

WebBrowser.maybeCompleteAuthSession();

type AuthTab = 'signin' | 'signup';

const SLIDE_DISTANCE = 20;
const BRAND = {
    coral: '#FF6A3D',
    coralDark: '#E4572E',
    amber: '#FFB347',
    olive: '#4A5438',
    oliveMuted: '#64704F',
    ink: '#0B0F19',
    warmDark: '#2C2420',
    paper: '#FAF3EB',
    surface: '#F5E8D8',
    border: '#D4B494',
    white: '#FFFFFF',
} as const;

export default function LoginScreen() {
    const router = useRouter();
    const params = useLocalSearchParams<{ tab?: string; returnTo?: string }>();
    const { loginClient, signupClient, googleSignInWithIdToken } = useClientAuthStore();
    const [googleLoading, setGoogleLoading] = useState(false);
    const { width, height } = useWindowDimensions();
    const isLandscape = width > height;
    const isCompact = height < 720 || isLandscape;

    const rawReturnTo = typeof params.returnTo === 'string' ? params.returnTo : undefined;
    const returnTo =
        rawReturnTo && rawReturnTo.startsWith('/') && !rawReturnTo.startsWith('//')
            ? (rawReturnTo as any)
            : '/(tabs)';
    const initialTab: AuthTab = params.tab === 'signup' ? 'signup' : 'signin';

    const googleAuthConfig = Constants.expoConfig?.extra?.googleAuth || {
        iosClientId: undefined,
        iosReversedClientId: undefined,
        androidClientId: undefined,
        webClientId: undefined,
    };
    const googleClientId = Platform.select({
        ios: googleAuthConfig.iosClientId,
        android: googleAuthConfig.androidClientId,
        default: googleAuthConfig.webClientId,
    });
    const googleRedirectUri =
        Platform.OS === 'ios' && googleAuthConfig.iosReversedClientId
            ? `${googleAuthConfig.iosReversedClientId}:/oauthredirect`
            : undefined;

    const [request, response, promptAsync] = Google.useIdTokenAuthRequest(
        {
            iosClientId: googleAuthConfig.iosClientId,
            androidClientId: googleAuthConfig.androidClientId,
            webClientId: googleAuthConfig.webClientId,
            redirectUri: googleRedirectUri,
            scopes: ['openid', 'profile', 'email'],
            selectAccount: true,
        },
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
        if (!googleClientId) {
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
    const heroOpacity = useRef(new Animated.Value(0)).current;
    const heroTranslateY = useRef(new Animated.Value(18)).current;
    const cardOpacity = useRef(new Animated.Value(0)).current;
    const cardTranslateY = useRef(new Animated.Value(34)).current;
    const ambientMotion = useRef(new Animated.Value(0)).current;
    const isSwitching = useRef(false);

    useEffect(() => {
        Animated.stagger(110, [
            Animated.parallel([
                Animated.timing(heroOpacity, {
                    toValue: 1,
                    duration: 520,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(heroTranslateY, {
                    toValue: 0,
                    duration: 520,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
            Animated.parallel([
                Animated.timing(cardOpacity, {
                    toValue: 1,
                    duration: 620,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
                Animated.timing(cardTranslateY, {
                    toValue: 0,
                    duration: 620,
                    easing: Easing.out(Easing.cubic),
                    useNativeDriver: true,
                }),
            ]),
        ]).start();

        const ambientLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(ambientMotion, {
                    toValue: 1,
                    duration: 4200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(ambientMotion, {
                    toValue: 0,
                    duration: 4200,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        );

        ambientLoop.start();
        return () => ambientLoop.stop();
    }, [ambientMotion, cardOpacity, cardTranslateY, heroOpacity, heroTranslateY]);

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

    const headerTitle = activeTab === 'signin' ? 'Welcome back' : 'Create account';
    const headerSubtitle =
        activeTab === 'signin'
            ? 'Sign in to book classes and manage your membership.'
            : 'Book your first class and manage your membership from the app.';
    const ambientTranslateY = ambientMotion.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -14],
    });
    const ambientScale = ambientMotion.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.05],
    });

    return (
        <SafeAreaView style={styles.safeArea} edges={['top', 'bottom']}>
            <KeyboardAvoidingView
                style={styles.container}
                behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
            >
                <Animated.View
                    pointerEvents="none"
                    style={[
                        styles.ambientAccent,
                        {
                            transform: [
                                { translateY: ambientTranslateY },
                                { scale: ambientScale },
                            ],
                        },
                    ]}
                />
                <ScrollView
                    contentContainerStyle={[
                        styles.scrollContent,
                        isLandscape && styles.scrollContentLandscape,
                        isCompact && styles.scrollContentCompact,
                    ]}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <Animated.View
                        style={[
                            styles.heroShell,
                            isCompact && styles.heroCompact,
                            {
                                opacity: heroOpacity,
                                transform: [{ translateY: heroTranslateY }],
                            },
                        ]}
                    >
                        <LinearGradient
                            colors={[BRAND.paper, BRAND.surface]}
                            start={{ x: 0, y: 0 }}
                            end={{ x: 1, y: 1 }}
                            style={styles.heroGradient}
                        >
                            <View style={styles.heroTopline}>
                                <Logo height={isCompact ? 68 : 82} />
                            </View>

                            <View style={styles.heroCopy}>
                                <Text style={styles.brandKicker}>SOL PILATES STUDIO</Text>
                                <Text style={[styles.title, isCompact && styles.titleCompact]}>
                                    {headerTitle}
                                </Text>
                                <Text style={[styles.subtitle, isCompact && styles.subtitleCompact]}>
                                    {headerSubtitle}
                                </Text>
                            </View>

                            <View style={styles.heroRule} />
                        </LinearGradient>
                    </Animated.View>

                    <Animated.View
                        style={[
                            styles.authCard,
                            isLandscape && styles.authCardLandscape,
                            {
                                opacity: cardOpacity,
                                transform: [{ translateY: cardTranslateY }],
                            },
                        ]}
                    >
                        {activeTab === 'signup' && (
                            <TouchableOpacity
                                style={styles.signupBackButton}
                                onPress={() => switchTab('signin')}
                                activeOpacity={0.75}
                                hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
                            >
                                <Feather name="chevron-left" size={19} color={BRAND.coralDark} />
                                <Text style={styles.signupBackText}>Back to sign in</Text>
                            </TouchableOpacity>
                        )}

                        <GoogleSignInButton
                            loading={googleLoading}
                            disabled={isLoading}
                            onPress={handleGoogleSignIn}
                        />

                        <DividerWithLabel label="or continue with email" />

                        <Animated.View
                            style={{
                                opacity: formOpacity,
                                transform: [{ translateY: formTranslateY }],
                            }}
                        >
                            {activeTab === 'signin' && (
                                <View style={styles.form}>
                                    <FieldLabel>Email</FieldLabel>
                                    <InputRow icon="mail">
                                        <TextInput
                                            style={styles.input}
                                            placeholder="you@example.com"
                                            placeholderTextColor={BRAND.oliveMuted}
                                            value={loginEmail}
                                            onChangeText={setLoginEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            returnKeyType="next"
                                            onSubmitEditing={() => loginPasswordRef.current?.focus()}
                                            editable={!isLoading}
                                            textContentType="emailAddress"
                                            autoComplete="email"
                                        />
                                    </InputRow>

                                    <FieldLabel>Password</FieldLabel>
                                    <InputRow icon="lock">
                                        <TextInput
                                            ref={loginPasswordRef}
                                            style={styles.input}
                                            placeholder="Enter password"
                                            placeholderTextColor={BRAND.oliveMuted}
                                            value={loginPassword}
                                            onChangeText={setLoginPassword}
                                            secureTextEntry={!showLoginPassword}
                                            returnKeyType="done"
                                            onSubmitEditing={handleLogin}
                                            editable={!isLoading}
                                            textContentType="password"
                                            autoComplete="password"
                                        />
                                        <EyeToggle
                                            visible={showLoginPassword}
                                            onPress={() => setShowLoginPassword(!showLoginPassword)}
                                        />
                                    </InputRow>

                                    <SubmitButton
                                        label={loginLoading ? 'Verifying...' : 'Sign in'}
                                        loading={loginLoading}
                                        disabled={isLoading || googleLoading}
                                        onPress={handleLogin}
                                    />

                                    <AuthTextLink
                                        label="New to Sol? Create account"
                                        onPress={() => switchTab('signup')}
                                    />
                                </View>
                            )}

                            {activeTab === 'signup' && (
                                <View style={styles.form}>
                                    <FieldLabel>Full name</FieldLabel>
                                    <InputRow icon="user">
                                        <TextInput
                                            style={styles.input}
                                            placeholder="Your full name"
                                            placeholderTextColor={BRAND.oliveMuted}
                                            value={signupName}
                                            onChangeText={setSignupName}
                                            autoCapitalize="words"
                                            returnKeyType="next"
                                            onSubmitEditing={() => signupEmailRef.current?.focus()}
                                            editable={!isLoading}
                                            textContentType="oneTimeCode"
                                            autoComplete="off"
                                        />
                                    </InputRow>

                                    <FieldLabel>Email</FieldLabel>
                                    <InputRow icon="mail">
                                        <TextInput
                                            ref={signupEmailRef}
                                            style={styles.input}
                                            placeholder="you@example.com"
                                            placeholderTextColor={BRAND.oliveMuted}
                                            value={signupEmail}
                                            onChangeText={setSignupEmail}
                                            keyboardType="email-address"
                                            autoCapitalize="none"
                                            autoCorrect={false}
                                            returnKeyType="next"
                                            onSubmitEditing={() => signupPasswordRef.current?.focus()}
                                            editable={!isLoading}
                                            textContentType="oneTimeCode"
                                            autoComplete="off"
                                        />
                                    </InputRow>

                                    <FieldLabel>Password</FieldLabel>
                                    <InputRow icon="lock">
                                        <TextInput
                                            ref={signupPasswordRef}
                                            style={styles.input}
                                            placeholder="At least 6 characters"
                                            placeholderTextColor={BRAND.oliveMuted}
                                            value={signupPassword}
                                            onChangeText={setSignupPassword}
                                            secureTextEntry={!showSignupPassword}
                                            returnKeyType="next"
                                            onSubmitEditing={() => signupConfirmRef.current?.focus()}
                                            editable={!isLoading}
                                            textContentType="oneTimeCode"
                                            autoComplete="off"
                                        />
                                        <EyeToggle
                                            visible={showSignupPassword}
                                            onPress={() => setShowSignupPassword(!showSignupPassword)}
                                        />
                                    </InputRow>

                                    <FieldLabel>Confirm password</FieldLabel>
                                    <InputRow icon="lock">
                                        <TextInput
                                            ref={signupConfirmRef}
                                            style={styles.input}
                                            placeholder="Repeat password"
                                            placeholderTextColor={BRAND.oliveMuted}
                                            value={signupConfirmPassword}
                                            onChangeText={setSignupConfirmPassword}
                                            secureTextEntry={!showSignupPassword}
                                            returnKeyType="done"
                                            onSubmitEditing={handleSignup}
                                            editable={!isLoading}
                                            textContentType="oneTimeCode"
                                            autoComplete="off"
                                        />
                                    </InputRow>

                                    <SubmitButton
                                        label={signupLoading ? 'Creating account...' : 'Create account'}
                                        loading={signupLoading}
                                        disabled={isLoading || googleLoading}
                                        onPress={handleSignup}
                                    />

                                    <Text style={styles.legalDisclosure}>
                                        By creating an account, you agree to our{' '}
                                        <Text
                                            style={styles.legalLink}
                                            onPress={() =>
                                                Linking.openURL('https://www.solpilatesstudio.in/terms')
                                            }
                                        >
                                            Terms of Service
                                        </Text>{' '}
                                        and{' '}
                                        <Text
                                            style={styles.legalLink}
                                            onPress={() =>
                                                Linking.openURL('https://www.solpilatesstudio.in/privacy')
                                            }
                                        >
                                            Privacy Policy
                                        </Text>
                                        .
                                    </Text>
                                </View>
                            )}
                        </Animated.View>
                    </Animated.View>
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
                color={BRAND.oliveMuted}
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
                color={BRAND.oliveMuted}
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
                    <ActivityIndicator size="small" color={BRAND.white} />
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
            <View style={styles.googleGlyph}>
                <Text style={styles.googleGlyphText}>G</Text>
            </View>
            <Text style={styles.googleButtonText}>
                {loading ? 'Signing in...' : 'Continue with Google'}
            </Text>
        </TouchableOpacity>
    );
}

function DividerWithLabel({ label }: { label: string }) {
    return (
        <View style={styles.dividerRow}>
            <View style={styles.dividerLine} />
            <Text style={styles.dividerText}>{label}</Text>
            <View style={styles.dividerLine} />
        </View>
    );
}

function AuthTextLink({ label, onPress }: { label: string; onPress: () => void }) {
    return (
        <TouchableOpacity
            style={styles.authTextLinkButton}
            onPress={onPress}
            activeOpacity={0.75}
            hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
            <Text style={styles.authTextLink}>{label}</Text>
        </TouchableOpacity>
    );
}

// ---------------------------------------------------------------------------
// Styles
// ---------------------------------------------------------------------------

const styles = StyleSheet.create({
    safeArea: {
        flex: 1,
        backgroundColor: BRAND.surface,
    },
    container: {
        flex: 1,
        overflow: 'hidden',
    },
    scrollContent: {
        flexGrow: 1,
        paddingHorizontal: Spacing.md,
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.lg,
        justifyContent: 'flex-start',
    },
    scrollContentCompact: {
        paddingTop: Spacing.sm,
        paddingBottom: Spacing.md,
        justifyContent: 'flex-start',
    },
    scrollContentLandscape: {
        maxWidth: 560,
        alignSelf: 'center',
        width: '100%',
    },
    ambientAccent: {
        position: 'absolute',
        width: 260,
        height: 260,
        borderRadius: BorderRadius.full,
        backgroundColor: '#FF6A3D22',
        top: -86,
        right: -96,
    },

    // Opening brand moment
    heroShell: {
        marginTop: Spacing.sm,
        marginBottom: -Spacing.xl,
        borderRadius: BorderRadius['2xl'],
        overflow: 'hidden',
    },
    heroCompact: {
        marginBottom: -Spacing.lg,
    },
    heroGradient: {
        minHeight: 230,
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.xl,
        justifyContent: 'space-between',
    },
    heroTopline: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
    },
    heroCopy: {
        alignItems: 'center',
        paddingTop: Spacing.lg,
        paddingBottom: Spacing.sm,
    },
    brandKicker: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize['2xs'],
        color: BRAND.coral,
        letterSpacing: 1.8,
        marginBottom: Spacing.sm,
    },
    title: {
        fontFamily: FontFamily.display,
        fontSize: FontSize['3xl'],
        lineHeight: 34,
        color: BRAND.olive,
        textAlign: 'center',
        marginBottom: Spacing.sm,
    },
    titleCompact: {
        fontSize: FontSize['2xl'] + 2,
        lineHeight: 30,
        marginBottom: Spacing.xs,
    },
    subtitle: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        lineHeight: 20,
        color: BRAND.oliveMuted,
        textAlign: 'center',
        maxWidth: 310,
    },
    subtitleCompact: {
        fontSize: FontSize.sm,
        lineHeight: 20,
    },
    heroRule: {
        width: 56,
        height: 3,
        backgroundColor: BRAND.coral,
        borderRadius: BorderRadius.full,
        alignSelf: 'center',
    },

    // Form panel
    authCard: {
        backgroundColor: BRAND.paper,
        borderWidth: 1,
        borderColor: '#D4B49455',
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.md - 2,
        shadowColor: BRAND.ink,
        shadowOpacity: 0.14,
        shadowRadius: 18,
        shadowOffset: { width: 0, height: 10 },
        elevation: 6,
    },
    authCardLandscape: {
        padding: Spacing.md,
    },
    signupBackButton: {
        flexDirection: 'row',
        alignItems: 'center',
        alignSelf: 'flex-start',
        gap: 2,
        marginBottom: Spacing.md,
        minHeight: 32,
    },
    signupBackText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.sm,
        color: BRAND.coralDark,
    },

    form: {
        gap: Spacing.sm,
    },
    fieldLabel: {
        fontFamily: FontFamily.sansMedium,
        fontSize: FontSize.xs,
        color: BRAND.olive,
        marginTop: Spacing.xs,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: BRAND.white,
        borderWidth: 1,
        borderColor: '#D4B49455',
        height: 50,
        paddingHorizontal: Spacing.md,
        borderRadius: BorderRadius.md,
    },
    inputIcon: {
        marginRight: Spacing.sm,
    },
    input: {
        flex: 1,
        height: '100%',
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: BRAND.olive,
        paddingVertical: 0,
    },
    eyeButton: {
        width: 44,
        height: 44,
        alignItems: 'center',
        justifyContent: 'center',
        marginRight: -Spacing.sm,
    },

    // Submit button
    submitButton: {
        marginTop: Spacing.md,
        height: 50,
        backgroundColor: BRAND.coral,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.md,
        shadowColor: BRAND.coral,
        shadowOpacity: 0.24,
        shadowRadius: 14,
        shadowOffset: { width: 0, height: 8 },
        elevation: 4,
    },
    submitButtonDisabled: {
        opacity: 0.6,
    },
    submitButtonText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.sm,
        color: BRAND.white,
    },
    loadingRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    authTextLinkButton: {
        alignSelf: 'center',
        marginTop: Spacing.md,
        minHeight: 34,
        justifyContent: 'center',
    },
    authTextLink: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.sm,
        color: BRAND.coralDark,
    },

    dividerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        marginVertical: Spacing.sm + 4,
    },
    dividerLine: {
        flex: 1,
        height: 1,
        backgroundColor: '#D4B49455',
    },
    dividerText: {
        fontFamily: FontFamily.sansMedium,
        fontSize: FontSize.xs,
        color: BRAND.oliveMuted,
    },
    legalDisclosure: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.xs,
        color: BRAND.oliveMuted,
        textAlign: 'center',
        marginTop: Spacing.md,
        lineHeight: 16,
        paddingHorizontal: Spacing.sm,
    },
    legalLink: {
        fontFamily: FontFamily.sansBold,
        color: BRAND.coralDark,
    },

    // Google Sign-In button
    googleButton: {
        height: 50,
        backgroundColor: BRAND.white,
        borderWidth: 1,
        borderColor: '#D4B49466',
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.sm,
        borderRadius: BorderRadius.md,
    },
    googleButtonDisabled: {
        opacity: 0.6,
    },
    googleGlyph: {
        width: 24,
        height: 24,
        borderRadius: BorderRadius.full,
        backgroundColor: BRAND.paper,
        borderWidth: 1,
        borderColor: '#D4B49466',
        alignItems: 'center',
        justifyContent: 'center',
    },
    googleGlyphText: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.sm,
        color: BRAND.coralDark,
    },
    googleButtonText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.sm,
        color: BRAND.olive,
    },
});
