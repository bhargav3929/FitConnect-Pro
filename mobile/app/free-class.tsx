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
import { addDoc, collection, serverTimestamp } from 'firebase/firestore';
import { db } from '@fitconnect/shared/firebase/config';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';
import { Colors, Spacing, FontSize, BorderRadius, Alpha } from '../constants/theme';
import { useFreeClassLead } from '../hooks/useFreeClassLead';

type FormState = {
    name: string;
    email: string;
    phone: string;
    goals: string;
    concerns: string;
};

const EMPTY: FormState = { name: '', email: '', phone: '', goals: '', concerns: '' };

export default function FreeClassScreen() {
    const router = useRouter();
    const { isAuthenticated, isLoading, initAuth, clientUser } = useClientAuthStore();
    const { hasFreeClassLead } = useFreeClassLead();
    const [form, setForm] = useState<FormState>(EMPTY);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [done, setDone] = useState(false);

    useEffect(() => {
        const unsubscribe = initAuth();
        return () => unsubscribe();
    }, [initAuth]);

    useEffect(() => {
        if (isLoading) return;
        if (!isAuthenticated) {
            router.replace('/login?tab=signup&returnTo=/free-class' as any);
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

        setSubmitting(true);
        try {
            await addDoc(collection(db, 'freeClassLeads'), {
                ...form,
                userId: clientUser?.id ?? null,
                source: 'mobile-free-class-form',
                status: 'new',
                createdAt: serverTimestamp(),
            });
            setDone(true);
        } catch (err) {
            console.error(err);
            setError('Something went wrong. Please try again.');
        } finally {
            setSubmitting(false);
        }
    };

    if (hasFreeClassLead === true && !done) {
        return (
            <SafeAreaView style={styles.safeArea} edges={['top']}>
                <View style={styles.successWrap}>
                    <Feather name="check-circle" size={64} color={Colors.terra[400]} />
                    <Text style={styles.successTitle}>Free Class Booked</Text>
                    <Text style={styles.successBody}>
                        You&apos;ve already booked your free class. Swetha will be in touch — we
                        can&apos;t wait to see you on the reformer.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.replace('/(tabs)')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryButtonText}>BACK HOME</Text>
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
                        Swetha will reach out shortly to lock in your free 30-minute drop-in
                        session.
                    </Text>
                    <TouchableOpacity
                        style={styles.primaryButton}
                        onPress={() => router.replace('/(tabs)')}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.primaryButtonText}>BACK HOME</Text>
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
                        <Text style={styles.headerTitle}>Free Drop-In</Text>
                    </View>

                    <Text style={styles.intro}>
                        30 minutes, no commitment, completely free. Tell us a little about
                        yourself and we&apos;ll be in touch to schedule.
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
                            <Text style={styles.primaryButtonText}>BOOK MY FREE CLASS</Text>
                        )}
                    </TouchableOpacity>
                </ScrollView>
            </KeyboardAvoidingView>
        </SafeAreaView>
    );
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
