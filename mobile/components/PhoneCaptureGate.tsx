import { useState } from 'react';
import {
    View,
    Text,
    TextInput,
    TouchableOpacity,
    StyleSheet,
    ActivityIndicator,
    KeyboardAvoidingView,
    Platform,
    ScrollView,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';
import { isValidPhone, PHONE_VALIDATION_MESSAGE } from '@fitconnect/shared/utils/phone';
import { Colors, Spacing, FontSize, BorderRadius } from '../constants/theme';

/**
 * Collects a mobile number from members who never passed through the signup form:
 * Google and Apple sign-ups, and members who joined before the number was required.
 *
 * Rendered by the tabs layout in place of the tab navigator, so it cannot be skipped.
 */
export function PhoneCaptureGate() {
    const { savePhone, clientUser } = useClientAuthStore();
    const [phone, setPhone] = useState('');
    const [error, setError] = useState<string | null>(null);
    const [isSaving, setIsSaving] = useState(false);

    const onSubmit = async () => {
        if (!isValidPhone(phone)) {
            setError(PHONE_VALIDATION_MESSAGE);
            return;
        }

        setError(null);
        setIsSaving(true);
        const result = await savePhone(phone);
        setIsSaving(false);

        if (!result.success) {
            setError(result.error ?? 'Could not save your number. Please try again.');
        }
    };

    const firstName = clientUser?.name?.split(' ')[0];

    return (
        <KeyboardAvoidingView
            style={styles.flex}
            behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        >
            <ScrollView
                contentContainerStyle={styles.container}
                keyboardShouldPersistTaps="handled"
            >
                <View style={styles.iconBadge}>
                    <Feather name="phone" size={20} color={Colors.primary} />
                </View>

                <Text style={styles.title}>One more step</Text>
                <Text style={styles.body}>
                    {firstName ? `${firstName}, we ` : 'We '}need a mobile number so the studio can
                    reach you about your bookings and any last-minute schedule changes.
                </Text>

                <Text style={styles.label}>MOBILE NUMBER</Text>
                <View style={[styles.inputRow, !!error && styles.inputRowError]}>
                    <Feather
                        name="phone"
                        size={18}
                        color={Colors.secondaryText}
                        style={styles.inputIcon}
                    />
                    <TextInput
                        style={styles.input}
                        placeholder="98765 43210"
                        placeholderTextColor={Colors.mutedLight}
                        value={phone}
                        onChangeText={(text) => {
                            setPhone(text);
                            if (error) setError(null);
                        }}
                        keyboardType="phone-pad"
                        autoCapitalize="none"
                        autoCorrect={false}
                        autoFocus
                        returnKeyType="done"
                        onSubmitEditing={onSubmit}
                        editable={!isSaving}
                    />
                </View>
                {error ? <Text style={styles.error}>{error}</Text> : null}

                <TouchableOpacity
                    style={[styles.button, isSaving && styles.buttonDisabled]}
                    onPress={onSubmit}
                    disabled={isSaving}
                    accessibilityRole="button"
                >
                    {isSaving ? (
                        <ActivityIndicator color={Colors.white} />
                    ) : (
                        <Text style={styles.buttonText}>CONTINUE</Text>
                    )}
                </TouchableOpacity>
            </ScrollView>
        </KeyboardAvoidingView>
    );
}

const styles = StyleSheet.create({
    flex: { flex: 1, backgroundColor: Colors.background },
    container: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: Spacing.lg,
    },
    iconBadge: {
        width: 48,
        height: 48,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.errorBg,
        marginBottom: Spacing.lg,
    },
    title: {
        fontFamily: 'PlusJakartaSans_800ExtraBold',
        fontSize: FontSize['3xl'],
        color: Colors.foreground,
        marginBottom: Spacing.sm,
    },
    body: {
        fontFamily: 'PlusJakartaSans_300Light',
        fontSize: FontSize.sm,
        lineHeight: 22,
        color: Colors.secondaryText,
        marginBottom: Spacing.xl,
    },
    label: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: FontSize.xs,
        letterSpacing: 1,
        color: Colors.foreground,
        marginBottom: Spacing.sm,
    },
    inputRow: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Colors.card,
        borderWidth: 1,
        borderColor: Colors.border,
        borderRadius: BorderRadius.none,
        paddingHorizontal: Spacing.md,
        height: 56,
    },
    inputRowError: { borderColor: Colors.error },
    inputIcon: { marginRight: Spacing.sm },
    input: {
        flex: 1,
        fontFamily: 'PlusJakartaSans_400Regular',
        fontSize: FontSize.base,
        color: Colors.foreground,
    },
    error: {
        fontFamily: 'PlusJakartaSans_500Medium',
        fontSize: FontSize.xs,
        color: Colors.error,
        marginTop: Spacing.sm,
    },
    button: {
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.primary,
        marginTop: Spacing.lg,
    },
    buttonDisabled: { opacity: 0.6 },
    buttonText: {
        fontFamily: 'PlusJakartaSans_700Bold',
        fontSize: FontSize.sm,
        letterSpacing: 1,
        color: Colors.white,
    },
});
