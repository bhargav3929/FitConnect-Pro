import { useState } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Modal, Linking } from 'react-native';
import { Feather } from '@expo/vector-icons';
import { callEndFreeze, callFreezePlan } from '@fitconnect/shared/firebase/firestore';
import type { ClientUser } from '@fitconnect/shared/types/client';
import { studioDayKey } from '@fitconnect/shared/schedule/studio-day';
import {
    FREEZE_INELIGIBLE_MESSAGES,
    FREEZE_MAX_DAYS,
    FREEZE_MAX_LEAD_DAYS,
    FREEZE_MIN_DAYS,
    addDays,
    getFreezeIneligibleReason,
    hasOpenFreeze,
    isFrozenAt,
    nextFreezeAvailableAt,
} from '@fitconnect/shared/subscriptions/policy';
import { Colors, Spacing, FontSize, BorderRadius, FontFamily } from '../constants/theme';

const FREEZE_POLICY_URL = 'https://www.solpilatesstudio.in/policies#membership-freeze';

function formatDay(date: Date | null | undefined): string {
    if (!date) return '--';
    return new Date(date).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'Asia/Kolkata' });
}

function Stepper({
    label,
    value,
    onDecrement,
    onIncrement,
    canDecrement,
    canIncrement,
}: {
    label: string;
    value: string;
    onDecrement: () => void;
    onIncrement: () => void;
    canDecrement: boolean;
    canIncrement: boolean;
}) {
    return (
        <View style={styles.stepper}>
            <Text style={styles.stepperLabel}>{label}</Text>
            <View style={styles.stepperRow}>
                <TouchableOpacity
                    style={[styles.stepperBtn, !canDecrement && styles.stepperBtnDisabled]}
                    onPress={onDecrement}
                    disabled={!canDecrement}
                    accessibilityLabel={`Decrease ${label.toLowerCase()}`}
                >
                    <Feather name="minus" size={16} color={Colors.olive[500]} />
                </TouchableOpacity>
                <Text style={styles.stepperValue}>{value}</Text>
                <TouchableOpacity
                    style={[styles.stepperBtn, !canIncrement && styles.stepperBtnDisabled]}
                    onPress={onIncrement}
                    disabled={!canIncrement}
                    accessibilityLabel={`Increase ${label.toLowerCase()}`}
                >
                    <Feather name="plus" size={16} color={Colors.olive[500]} />
                </TouchableOpacity>
            </View>
        </View>
    );
}

/** Freeze controls for the member's plan card: schedule, show, or end a freeze. */
export default function PlanFreezeSection({
    subscription,
    onChanged,
}: {
    subscription: ClientUser['subscription'];
    onChanged: () => Promise<unknown> | void;
}) {
    const [modalVisible, setModalVisible] = useState(false);
    const [startOffset, setStartOffset] = useState(0);
    const [days, setDays] = useState(FREEZE_MAX_DAYS);
    const [isSaving, setIsSaving] = useState(false);

    const now = new Date();
    const freezeState = { freezeStartDate: subscription.freezeStartDate, freezeEndDate: subscription.freezeEndDate };
    const openFreeze = hasOpenFreeze(freezeState, now);
    const frozenNow = isFrozenAt(freezeState, now);
    const reason = getFreezeIneligibleReason({
        status: subscription.status,
        planId: subscription.planId,
        endDate: subscription.endDate,
        ...freezeState,
        lastFreezeRequestedAt: subscription.lastFreezeRequestedAt,
    }, now);

    if (reason === 'no-active-plan' || reason === 'demo-plan') return null;

    const startDate = addDays(now, startOffset);
    const resumeDate = addDays(startDate, days);
    const newEndDate = subscription.endDate ? addDays(new Date(subscription.endDate), days) : null;

    const handleFreeze = async () => {
        setIsSaving(true);
        try {
            const result = await callFreezePlan({ startDate: studioDayKey(startDate), days });
            await onChanged();
            setModalVisible(false);
            Alert.alert(
                'Plan frozen',
                `Back on ${formatDay(new Date(result.freezeEndDate))}. Your plan now ends ${formatDay(new Date(result.endDate))}.`
                    + (result.canceledBookings ? ` ${result.canceledBookings} booked class${result.canceledBookings === 1 ? ' was' : 'es were'} cancelled and credited back.` : ''),
            );
        } catch (err) {
            Alert.alert('Could not freeze plan', err instanceof Error ? err.message : 'Please try again.');
        } finally {
            setIsSaving(false);
        }
    };

    const confirmEndFreeze = () => {
        Alert.alert(
            frozenNow ? 'End freeze now?' : 'Withdraw freeze?',
            'Unused freeze days are handed back, so your plan end date moves earlier by the same amount.',
            [
                { text: 'Keep Freeze', style: 'cancel' },
                {
                    text: frozenNow ? 'End Freeze' : 'Withdraw',
                    onPress: async () => {
                        setIsSaving(true);
                        try {
                            const result = await callEndFreeze();
                            await onChanged();
                            Alert.alert(frozenNow ? 'Welcome back' : 'Freeze withdrawn', `Your plan now ends ${formatDay(new Date(result.endDate))}.`);
                        } catch (err) {
                            Alert.alert('Could not end freeze', err instanceof Error ? err.message : 'Please try again.');
                        } finally {
                            setIsSaving(false);
                        }
                    },
                },
            ],
        );
    };

    return (
        <View style={styles.container}>
            {openFreeze ? (
                <View style={styles.statusRow}>
                    <View style={styles.statusText}>
                        <Text style={styles.statusTitle}>{frozenNow ? 'Plan frozen' : 'Freeze scheduled'}</Text>
                        <Text style={styles.statusBody}>
                            {formatDay(subscription.freezeStartDate)} to {formatDay(subscription.freezeEndDate)}. No bookings in this window.
                        </Text>
                    </View>
                    <TouchableOpacity style={styles.outlineBtn} onPress={confirmEndFreeze} disabled={isSaving}>
                        <Text style={styles.outlineBtnText}>{isSaving ? '...' : frozenNow ? 'END' : 'WITHDRAW'}</Text>
                    </TouchableOpacity>
                </View>
            ) : reason === 'cooldown' ? (
                <Text style={styles.statusBody}>
                    {FREEZE_INELIGIBLE_MESSAGES.cooldown} Next freeze available {formatDay(nextFreezeAvailableAt(subscription.lastFreezeRequestedAt, now))}.
                </Text>
            ) : (
                <TouchableOpacity
                    style={styles.freezeBtn}
                    onPress={() => {
                        setStartOffset(0);
                        setDays(FREEZE_MAX_DAYS);
                        setModalVisible(true);
                    }}
                    activeOpacity={0.85}
                >
                    <Feather name="pause-circle" size={14} color={Colors.olive[500]} />
                    <Text style={styles.freezeBtnText}>FREEZE MY PLAN</Text>
                </TouchableOpacity>
            )}

            <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={() => !isSaving && setModalVisible(false)}>
                <View style={styles.backdrop}>
                    <View style={styles.sheet}>
                        <Text style={styles.sheetTitle}>Freeze your plan</Text>
                        <Text style={styles.sheetBody}>
                            Pause for {FREEZE_MIN_DAYS} to {FREEZE_MAX_DAYS} days, once every 12 months. Your plan end date moves out by the same number of days, and classes booked in that window are cancelled and credited back.
                        </Text>

                        <Stepper
                            label="STARTS"
                            value={startOffset === 0 ? `Today, ${formatDay(startDate)}` : formatDay(startDate)}
                            onDecrement={() => setStartOffset((v) => Math.max(0, v - 1))}
                            onIncrement={() => setStartOffset((v) => Math.min(FREEZE_MAX_LEAD_DAYS, v + 1))}
                            canDecrement={startOffset > 0}
                            canIncrement={startOffset < FREEZE_MAX_LEAD_DAYS}
                        />
                        <Stepper
                            label="DAYS"
                            value={`${days} days`}
                            onDecrement={() => setDays((v) => Math.max(FREEZE_MIN_DAYS, v - 1))}
                            onIncrement={() => setDays((v) => Math.min(FREEZE_MAX_DAYS, v + 1))}
                            canDecrement={days > FREEZE_MIN_DAYS}
                            canIncrement={days < FREEZE_MAX_DAYS}
                        />

                        <Text style={styles.summary}>
                            Back on <Text style={styles.summaryStrong}>{formatDay(resumeDate)}</Text>. Plan ends{' '}
                            <Text style={styles.summaryStrong}>{formatDay(newEndDate)}</Text>
                            {subscription.razorpaySubscriptionId && subscription.autoRenew ? '. Billing continues on its usual dates.' : '.'}
                        </Text>
                        <TouchableOpacity onPress={() => Linking.openURL(FREEZE_POLICY_URL).catch(() => undefined)}>
                            <Text style={styles.link}>Read the freeze policy</Text>
                        </TouchableOpacity>

                        <View style={styles.sheetActions}>
                            <TouchableOpacity style={styles.sheetSecondary} onPress={() => setModalVisible(false)} disabled={isSaving}>
                                <Text style={styles.sheetSecondaryText}>NOT NOW</Text>
                            </TouchableOpacity>
                            <TouchableOpacity style={styles.sheetPrimary} onPress={handleFreeze} disabled={isSaving}>
                                <Text style={styles.sheetPrimaryText}>{isSaving ? 'FREEZING...' : `FREEZE ${days} DAYS`}</Text>
                            </TouchableOpacity>
                        </View>
                    </View>
                </View>
            </Modal>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        paddingHorizontal: Spacing.md,
        paddingBottom: Spacing.md,
    },
    statusRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    statusText: {
        flex: 1,
    },
    statusTitle: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.olive[600],
    },
    statusBody: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.xs,
        color: Colors.olive[400],
        marginTop: 2,
        lineHeight: 18,
    },
    outlineBtn: {
        borderWidth: 1,
        borderColor: `${Colors.peach[400]}4D`,
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.md,
        paddingVertical: 8,
    },
    outlineBtnText: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.xs,
        color: Colors.olive[500],
        letterSpacing: 0.8,
    },
    freezeBtn: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'center',
        gap: 6,
        borderWidth: 1,
        borderColor: `${Colors.peach[400]}40`,
        borderRadius: BorderRadius.xl,
        paddingVertical: 10,
    },
    freezeBtnText: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.xs,
        color: Colors.olive[500],
        letterSpacing: 0.8,
    },
    backdrop: {
        flex: 1,
        backgroundColor: 'rgba(20, 18, 14, 0.55)',
        justifyContent: 'center',
        padding: Spacing.lg,
    },
    sheet: {
        backgroundColor: Colors.peach[50],
        borderRadius: BorderRadius['2xl'],
        padding: Spacing.lg,
        gap: Spacing.md,
    },
    sheetTitle: {
        fontFamily: FontFamily.display,
        fontSize: FontSize.xl,
        color: Colors.olive[600],
    },
    sheetBody: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.olive[400],
        lineHeight: 20,
    },
    stepper: {
        gap: 6,
    },
    stepperLabel: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.olive[300],
        letterSpacing: 1,
    },
    stepperRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        borderWidth: 1,
        borderColor: `${Colors.peach[400]}33`,
        borderRadius: BorderRadius.lg,
        backgroundColor: Colors.peach[100],
        padding: 4,
    },
    stepperBtn: {
        width: 40,
        height: 40,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.peach[50],
    },
    stepperBtnDisabled: {
        opacity: 0.35,
    },
    stepperValue: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.sm,
        color: Colors.olive[600],
    },
    summary: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.olive[500],
        lineHeight: 20,
    },
    summaryStrong: {
        fontFamily: FontFamily.sansBold,
    },
    link: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.terra[400],
    },
    sheetActions: {
        flexDirection: 'row',
        gap: Spacing.sm,
        marginTop: Spacing.xs,
    },
    sheetSecondary: {
        flex: 1,
        borderWidth: 1,
        borderColor: `${Colors.peach[400]}4D`,
        borderRadius: BorderRadius.xl,
        paddingVertical: 12,
        alignItems: 'center',
    },
    sheetSecondaryText: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.xs,
        color: Colors.olive[400],
        letterSpacing: 0.8,
    },
    sheetPrimary: {
        flex: 1,
        backgroundColor: Colors.terra[400],
        borderRadius: BorderRadius.xl,
        paddingVertical: 12,
        alignItems: 'center',
    },
    sheetPrimaryText: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.xs,
        color: Colors.peach[50],
        letterSpacing: 0.8,
    },
});
