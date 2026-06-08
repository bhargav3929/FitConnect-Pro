import { useEffect, useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ScrollView,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import RazorpayCheckout from 'react-native-razorpay';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';
import { callCreatePaymentOrder, callGetPricing, callVerifyPayment } from '@fitconnect/shared/firebase/firestore';
import { getPlanById } from '@fitconnect/shared/types/subscription';
import { Colors, Spacing, FontSize, BorderRadius, Alpha } from '../constants/theme';
import { useIntroClassLead } from '../hooks/useIntroClassLead';

type FormState = {
    name: string;
    email: string;
    phone: string;
    goals: string;
    concerns: string;
};

const EMPTY: FormState = { name: '', email: '', phone: '', goals: '', concerns: '' };

function hasActivePlan(subscription: { status?: string; endDate?: unknown } | undefined): boolean {
    if (!subscription || subscription.status !== 'active') return false;
    if (!subscription.endDate) return true;
    const endDate = subscription.endDate instanceof Date
        ? subscription.endDate
        : new Date(subscription.endDate as string | number);
    return !Number.isNaN(endDate.getTime()) && endDate > new Date();
}

export default function IntroClassScreen() {
    const router = useRouter();
    const { isAuthenticated, isLoading, initAuth, clientUser, firebaseUser, refreshSubscription } = useClientAuthStore();
    const { hasIntroClassLead, refresh: refreshIntroClassLead } = useIntroClassLead();
    const [form, setForm] = useState<FormState>(EMPTY);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);
    const [price, setPrice] = useState(() => getPlanById('drop_in')?.price ?? 1000);
    const hasActiveSubscription = hasActivePlan(clientUser?.subscription);

    useEffect(() => {
        const unsubscribe = initAuth();
        return () => unsubscribe();
    }, [initAuth]);

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) {
            router.replace('/login?tab=signup&returnTo=/intro-class' as any);
        }
    }, [isAuthenticated, isLoading, router]);

    // Prefill name/email from auth
    useEffect(() => {
        if (clientUser) {
            setForm((f) => ({
                ...f,
                name: f.name || clientUser.name || '',
                email: f.email || clientUser.email || '',
            }));
        }
    }, [clientUser]);

    useEffect(() => {
        let mounted = true;
        callGetPricing()
            .then((data) => {
                if (!mounted) return;
                const dropIn = data.plans.find((plan) => plan.planId === 'drop_in');
                if (dropIn?.price) setPrice(dropIn.price);
            })
            .catch(() => {
                // Static PLAN_CATALOG price remains the fallback.
            });
        return () => {
            mounted = false;
        };
    }, []);

    if (isLoading || !isAuthenticated) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.loadingWrap}>
                    <ActivityIndicator size="large" color={Colors.primary} />
                    <Text style={styles.loadingText}>REDIRECTING...</Text>
                </View>
            </SafeAreaView>
        );
    }

    const update = (k: keyof FormState) => (v: string) =>
        setForm((f) => ({ ...f, [k]: v }));

    const submit = async () => {
        setError(null);
        if (!form.name.trim() || !form.email.trim() || !form.phone.trim()) {
            setError('Name, email, and phone are required.');
            return;
        }
        if (!/^\S+@\S+\.\S+$/.test(form.email)) {
            setError('Please enter a valid email.');
            return;
        }
        if (hasIntroClassLead === true) {
            setError('You have already booked your intro class.');
            return;
        }
        if (hasActiveSubscription) {
            setError('Intro class is only available before your first active plan.');
            return;
        }

        setSubmitting(true);
        try {
            const order = await callCreatePaymentOrder('drop_in', {
                introClassLead: {
                    ...form,
                    source: 'mobile-intro-class-payment-form',
                },
            });
            const response = await RazorpayCheckout.open({
                key: order.key,
                amount: order.amount,
                currency: order.currency,
                order_id: order.orderId,
                name: 'Sol Pilates',
                description: 'Intro Class',
                prefill: {
                    email: form.email || firebaseUser?.email || undefined,
                    name: form.name || firebaseUser?.displayName || undefined,
                    contact: form.phone || undefined,
                },
                theme: { color: Colors.terra[400] },
            });

            await callVerifyPayment({
                razorpay_order_id: response.razorpay_order_id,
                razorpay_payment_id: response.razorpay_payment_id,
                razorpay_signature: response.razorpay_signature,
                paymentId: order.paymentId,
            });

            await refreshSubscription();
            refreshIntroClassLead();
            setDone(true);
            router.replace('/(tabs)/schedule');
        } catch (err) {
            console.error(err);
            setError(getPaymentErrorMessage(err));
        } finally {
            setSubmitting(false);
        }
    };

    if (hasIntroClassLead === true && !done) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.successWrap}>
                    <Feather name="check-circle" size={64} color={Colors.terra[400]} />
                    <Text style={styles.successTitle}>Intro Class Booked</Text>
                    <Text style={styles.successBody}>
                        You&apos;ve already paid for your intro class. Choose an available
                        30-minute Intro Class from the schedule.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.replace('/(tabs)/schedule')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryButtonText}>VIEW SCHEDULE</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (hasActiveSubscription && !done) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.successWrap}>
                    <Feather name="check-circle" size={64} color={Colors.terra[400]} />
                    <Text style={styles.successTitle}>Active Plan Found</Text>
                    <Text style={styles.successBody}>
                        Intro class is for new clients before their first active plan. You can
                        book regular classes from the schedule.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.replace('/(tabs)/schedule')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryButtonText}>VIEW SCHEDULE</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    if (done) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.successWrap}>
                    <Feather name="check-circle" size={64} color={Colors.terra[400]} />
                    <Text style={styles.successTitle}>You&apos;re in.</Text>
                    <Text style={styles.successBody}>
                        Payment received. Choose an available 30-minute Intro Class
                        from the schedule.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.replace('/(tabs)/schedule')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryButtonText}>VIEW SCHEDULE</Text>
                    </TouchableOpacity>
                </View>
            </SafeAreaView>
        );
    }

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <KeyboardAvoidingView
                style={{ flex: 1 }}
                behavior={Platform.OS === 'ios' ? 'padding' : undefined}
            >
                <ScrollView
                    contentContainerStyle={styles.scrollContent}
                    keyboardShouldPersistTaps="handled"
                    showsVerticalScrollIndicator={false}
                >
                    <View style={styles.header}>
                        <TouchableOpacity
                            style={styles.backButton}
                            onPress={() => (router.canGoBack() ? router.back() : router.replace('/(tabs)'))}
                            activeOpacity={0.7}
                        >
                            <Feather name="arrow-left" size={22} color={Colors.olive[600]} />
                        </TouchableOpacity>
                        <Text style={styles.headerTitle}>Intro Class</Text>
                    </View>

                    <Text style={styles.intro}>
                        30 minutes, no commitment. Tell us a little about yourself, then
                        complete the ₹{price.toLocaleString('en-IN')} payment to book.
                    </Text>

                    <Text style={styles.label}>FULL NAME *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.name}
                        onChangeText={update('name')}
                        placeholder="Your full name"
                        placeholderTextColor={Colors.olive[300]}
                        editable={!submitting}
                    />

                    <Text style={styles.label}>EMAIL *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.email}
                        onChangeText={update('email')}
                        placeholder="you@example.com"
                        placeholderTextColor={Colors.olive[300]}
                        keyboardType="email-address"
                        autoCapitalize="none"
                        autoCorrect={false}
                        editable={!submitting}
                    />

                    <Text style={styles.label}>PHONE *</Text>
                    <TextInput
                        style={styles.input}
                        value={form.phone}
                        onChangeText={update('phone')}
                        placeholder="+91 90000 00000"
                        placeholderTextColor={Colors.olive[300]}
                        keyboardType="phone-pad"
                        editable={!submitting}
                    />

                    <Text style={styles.label}>WHAT ARE YOUR GOALS?</Text>
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        value={form.goals}
                        onChangeText={update('goals')}
                        placeholder="Strength, flexibility, recovery, weight loss..."
                        placeholderTextColor={Colors.olive[300]}
                        multiline
                        numberOfLines={3}
                        editable={!submitting}
                    />

                    <Text style={styles.label}>ANY CONCERNS OR INJURIES?</Text>
                    <TextInput
                        style={[styles.input, styles.textarea]}
                        value={form.concerns}
                        onChangeText={update('concerns')}
                        placeholder="Anything we should know before your first session"
                        placeholderTextColor={Colors.olive[300]}
                        multiline
                        numberOfLines={3}
                        editable={!submitting}
                    />

                    {error && <Text style={styles.errorText}>{error}</Text>}

                    <TouchableOpacity
                        style={[styles.primaryButton, submitting && styles.disabled]}
                        onPress={submit}
                        disabled={submitting}
                        activeOpacity={0.85}
                    >
                        {submitting ? (
                            <ActivityIndicator color={Colors.white} />
                        ) : (
                            <Text style={styles.primaryButtonText}>
                                PAY ₹{price.toLocaleString('en-IN')} & BOOK
                            </Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
}

function getPaymentErrorMessage(err: unknown): string {
    if (err instanceof Error) return err.message;
    if (err && typeof err === 'object') {
        const data = err as {
            description?: string;
            code?: string | number;
            error?: { description?: string; reason?: string };
        };
        return data.error?.description || data.error?.reason || data.description || `Payment failed${data.code ? ` (${data.code})` : ''}`;
    }
    return 'Payment could not be completed. Please try again.';
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing['2xl'],
    },
    loadingWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        gap: Spacing.md,
    },
    loadingText: {
        fontSize: FontSize.xs,
        color: Colors.olive[300],
        letterSpacing: 1.5,
    },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: Spacing.lg,
    },
    backButton: {
        width: 40,
        height: 40,
        borderRadius: 20,
        backgroundColor: Colors.peach[50],
        justifyContent: 'center',
        alignItems: 'center',
        marginRight: Spacing.sm + 4,
    },
    headerTitle: {
        fontSize: FontSize['2xl'],
        fontWeight: '800',
        color: Colors.olive[600],
    },
    intro: {
        fontSize: FontSize.sm,
        color: Colors.olive[400],
        lineHeight: 20,
        marginBottom: Spacing.xl,
    },
    label: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        color: Colors.olive[600],
        letterSpacing: 1.5,
        marginTop: Spacing.md,
        marginBottom: Spacing.sm,
    },
    input: {
        backgroundColor: Colors.peach[50],
        borderWidth: 1,
        borderColor: Alpha.peach400_30,
        borderRadius: BorderRadius.xl,
        paddingHorizontal: Spacing.md,
        paddingVertical: Spacing.md - 2,
        fontSize: FontSize.base,
        color: Colors.olive[600],
    },
    textarea: {
        minHeight: 80,
        textAlignVertical: 'top',
    },
    errorText: {
        marginTop: Spacing.md,
        fontSize: FontSize.sm,
        color: '#B91C1C',
        fontWeight: '600',
    },
    primaryButton: {
        marginTop: Spacing.xl,
        height: 56,
        backgroundColor: Colors.terra[400],
        borderRadius: BorderRadius.xl,
        justifyContent: 'center',
        alignItems: 'center',
    },
    primaryButtonText: {
        color: Colors.white,
        fontSize: FontSize.sm,
        fontWeight: '700',
        letterSpacing: 1.5,
    },
    disabled: { opacity: 0.6 },
    successWrap: {
        flex: 1,
        alignItems: 'center',
        justifyContent: 'center',
        paddingHorizontal: Spacing.xl,
        gap: Spacing.md,
    },
    successTitle: {
        fontSize: FontSize['3xl'],
        fontWeight: '800',
        color: Colors.olive[600],
        textTransform: 'uppercase',
        marginTop: Spacing.md,
    },
    successBody: {
        fontSize: FontSize.base,
        color: Colors.olive[400],
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.lg,
    },
});
