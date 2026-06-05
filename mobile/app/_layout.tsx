import { useEffect, useRef, useState } from 'react';
import { Stack } from 'expo-router';
import { StatusBar } from 'expo-status-bar';
import * as SplashScreen from 'expo-splash-screen';
import { Animated, Easing, StyleSheet, View } from 'react-native';
import { useFonts } from 'expo-font';
import {
    PlusJakartaSans_300Light,
    PlusJakartaSans_400Regular,
    PlusJakartaSans_500Medium,
    PlusJakartaSans_700Bold,
    PlusJakartaSans_800ExtraBold,
} from '@expo-google-fonts/plus-jakarta-sans';
import { initApiConfig } from '@fitconnect/shared/firebase/api-config';
import { BorderRadius, Colors, Spacing } from '../constants/theme';
import { ErrorBoundary } from '../components/ErrorBoundary';
import Logo from '../components/Logo';

const API_BASE_URL = process.env.EXPO_PUBLIC_API_BASE_URL || 'http://localhost:3000';
const MIN_SPLASH_MS = 1200;

void SplashScreen.preventAutoHideAsync().catch(() => undefined);

export default function RootLayout() {
    const [minimumSplashDone, setMinimumSplashDone] = useState(false);
    const [fontsLoaded] = useFonts({
        PlusJakartaSans_300Light,
        PlusJakartaSans_400Regular,
        PlusJakartaSans_500Medium,
        PlusJakartaSans_700Bold,
        PlusJakartaSans_800ExtraBold,
    });

    useEffect(() => {
        initApiConfig({ baseUrl: API_BASE_URL });
    }, []);

    useEffect(() => {
        const timer = setTimeout(() => setMinimumSplashDone(true), MIN_SPLASH_MS);
        return () => clearTimeout(timer);
    }, []);

    const appReady = fontsLoaded && minimumSplashDone;

    useEffect(() => {
        if (!appReady) return;

        void SplashScreen.hideAsync().catch(() => undefined);
    }, [appReady]);

    if (!appReady) {
        return <BrandedSplash />;
    }

    return (
        <ErrorBoundary>
            <StatusBar style="auto" />
            <Stack screenOptions={{ headerShown: false }}>
                <Stack.Screen name="login" />
                <Stack.Screen name="signup" options={{ headerShown: false }} />
                <Stack.Screen name="subscribe" />
                <Stack.Screen name="about" />
                <Stack.Screen name="(tabs)" />
            </Stack>
        </ErrorBoundary>
    );
}

function BrandedSplash() {
    const logoScale = useRef(new Animated.Value(0.94)).current;
    const logoOpacity = useRef(new Animated.Value(0)).current;
    const lineScale = useRef(new Animated.Value(0)).current;
    const ambientMotion = useRef(new Animated.Value(0)).current;

    useEffect(() => {
        Animated.parallel([
            Animated.timing(logoOpacity, {
                toValue: 1,
                duration: 460,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
            Animated.spring(logoScale, {
                toValue: 1,
                friction: 8,
                tension: 70,
                useNativeDriver: true,
            }),
            Animated.timing(lineScale, {
                toValue: 1,
                duration: 720,
                delay: 220,
                easing: Easing.out(Easing.cubic),
                useNativeDriver: true,
            }),
        ]).start();

        const ambientLoop = Animated.loop(
            Animated.sequence([
                Animated.timing(ambientMotion, {
                    toValue: 1,
                    duration: 1800,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
                Animated.timing(ambientMotion, {
                    toValue: 0,
                    duration: 1800,
                    easing: Easing.inOut(Easing.sin),
                    useNativeDriver: true,
                }),
            ]),
        );

        ambientLoop.start();
        return () => ambientLoop.stop();
    }, [ambientMotion, lineScale, logoOpacity, logoScale]);

    const ambientTranslate = ambientMotion.interpolate({
        inputRange: [0, 1],
        outputRange: [0, -18],
    });
    const ambientScale = ambientMotion.interpolate({
        inputRange: [0, 1],
        outputRange: [1, 1.08],
    });

    return (
        <View style={styles.splash}>
            <StatusBar style="dark" />
            <Animated.View
                pointerEvents="none"
                style={[
                    styles.splashGlow,
                    {
                        transform: [
                            { translateY: ambientTranslate },
                            { scale: ambientScale },
                        ],
                    },
                ]}
            />
            <Animated.View
                style={[
                    styles.splashContent,
                    {
                        opacity: logoOpacity,
                        transform: [{ scale: logoScale }],
                    },
                ]}
            >
                <Logo height={156} />
                <View style={styles.splashLineTrack}>
                    <Animated.View
                        style={[
                            styles.splashLine,
                            { transform: [{ scaleX: lineScale }] },
                        ]}
                    />
                </View>
            </Animated.View>
        </View>
    );
}

const styles = StyleSheet.create({
    splash: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#F5E8D8',
        overflow: 'hidden',
    },
    splashGlow: {
        position: 'absolute',
        width: 280,
        height: 280,
        borderRadius: BorderRadius.full,
        backgroundColor: '#FF6A3D24',
        top: -84,
        right: -104,
    },
    splashContent: {
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
    },
    splashLineTrack: {
        width: 112,
        height: 3,
        marginTop: Spacing.xl,
        backgroundColor: '#D4B49466',
        borderRadius: BorderRadius.full,
        overflow: 'hidden',
    },
    splashLine: {
        flex: 1,
        backgroundColor: Colors.primary,
        borderRadius: BorderRadius.full,
    },
});
