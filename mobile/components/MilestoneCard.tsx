import { View, Text, StyleSheet } from 'react-native';
import { FontAwesome5, Feather, Ionicons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, FontFamily, BorderRadius, Alpha } from '../constants/theme';
import { withAlpha } from '@fitconnect/shared/theme';
import { palette } from '@fitconnect/shared/design/tokens';

const tierConnectorBg = withAlpha(palette.olive[500], 0.10);
const tierStoneBg = withAlpha(palette.olive[500], 0.06);
const tierIconMuted = withAlpha(palette.olive[500], 0.25);
const tierLabelMuted = withAlpha(palette.olive[500], 0.4);
import { TIERS, getMilestone, type Tier } from '../lib/milestones';

interface Props {
    totalClassesAttended: number;
}

function TierIcon({ name, size, color }: { name: Tier['iconName']; size: number; color: string }) {
    switch (name) {
        case 'shield':
            return <Feather name="shield" size={size} color={color} />;
        case 'medal':
            return <FontAwesome5 name="medal" size={size} color={color} />;
        case 'award':
            return <Feather name="award" size={size} color={color} />;
        case 'crown':
            return <FontAwesome5 name="crown" size={size} color={color} />;
        case 'gem':
            return <Ionicons name="diamond-outline" size={size} color={color} />;
    }
}

export default function MilestoneCard({ totalClassesAttended }: Props) {
    const { currentTier, currentTierIdx, nextTier, progress } = getMilestone(totalClassesAttended);
    const target = nextTier ? nextTier.threshold : currentTier.threshold;
    const remaining = nextTier ? nextTier.threshold - totalClassesAttended : 0;

    return (
        <View style={styles.container}>
            <Text style={styles.sectionLabel}>MILESTONE</Text>

            {/* Current tier badge + progress meta */}
            <View style={styles.headerRow}>
                <View style={styles.headerLeft}>
                    <View style={[styles.badge, { backgroundColor: currentTier.bg }]}>
                        <TierIcon name={currentTier.iconName} size={16} color={currentTier.color} />
                    </View>
                    <View>
                        <Text style={styles.tierName}>
                            {currentTier.name}
                            <Text style={styles.tierSuffix}> Tier</Text>
                        </Text>
                        <Text style={styles.subline}>
                            {nextTier
                                ? `${remaining} ${remaining === 1 ? 'class' : 'classes'} to ${nextTier.name}`
                                : 'Max tier reached!'}
                        </Text>
                    </View>
                </View>
                <Text style={styles.counter}>
                    {totalClassesAttended}/{target}
                </Text>
            </View>

            {/* Progress bar */}
            <View style={styles.progressTrack}>
                <View
                    style={[
                        styles.progressFill,
                        { width: `${progress}%`, backgroundColor: currentTier.color },
                    ]}
                />
            </View>

            {/* Tier stepping stones */}
            <View style={styles.steppingStones}>
                {TIERS.map((tier, idx) => {
                    const achieved = idx <= currentTierIdx;
                    const isCurrent = idx === currentTierIdx;
                    return (
                        <View key={tier.name} style={styles.tierStop}>
                            {idx > 0 && (
                                <View
                                    style={[
                                        styles.connector,
                                        {
                                            backgroundColor: idx <= currentTierIdx
                                                ? TIERS[idx - 1].color
                                                : tierConnectorBg,
                                        },
                                    ]}
                                />
                            )}
                            <View
                                style={[
                                    styles.stoneDot,
                                    {
                                        backgroundColor: achieved ? tier.bg : tierStoneBg,
                                        borderColor: isCurrent ? tier.color : 'transparent',
                                        borderWidth: isCurrent ? 2 : 0,
                                    },
                                ]}
                            >
                                <TierIcon
                                    name={tier.iconName}
                                    size={11}
                                    color={achieved ? tier.color : tierIconMuted}
                                />
                            </View>
                            <Text
                                style={[
                                    styles.stoneLabel,
                                    { color: achieved ? Colors.olive[500] : tierLabelMuted },
                                ]}
                            >
                                {tier.name}
                            </Text>
                        </View>
                    );
                })}
            </View>

            <Text style={styles.attendedLine}>
                {totalClassesAttended} {totalClassesAttended === 1 ? 'class' : 'classes'} attended!
            </Text>
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        backgroundColor: Colors.peach[50],
        borderRadius: BorderRadius.lg,
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.lg,
        marginTop: Spacing.lg,
        borderWidth: 1,
        borderColor: Alpha.peach400_20,
    },
    sectionLabel: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.olive[400],
        letterSpacing: 1.5,
        marginBottom: Spacing.md,
    },
    headerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        marginBottom: Spacing.sm,
    },
    headerLeft: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
        flex: 1,
    },
    badge: {
        width: 32,
        height: 32,
        borderRadius: BorderRadius.md,
        alignItems: 'center',
        justifyContent: 'center',
    },
    tierName: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.sm,
        color: Colors.olive[600],
    },
    tierSuffix: {
        fontFamily: FontFamily.sansMedium,
        fontSize: FontSize.xs,
        color: Colors.olive[300],
    },
    subline: {
        fontFamily: FontFamily.sans,
        fontSize: 11,
        color: Colors.olive[300],
        marginTop: 2,
    },
    counter: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.olive[400],
    },
    progressTrack: {
        height: 6,
        borderRadius: 999,
        backgroundColor: tierConnectorBg,
        overflow: 'hidden',
        marginVertical: Spacing.md,
    },
    progressFill: {
        height: '100%',
        borderRadius: 999,
    },
    steppingStones: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginTop: Spacing.xs,
    },
    tierStop: {
        flex: 1,
        alignItems: 'center',
        gap: 4,
        position: 'relative',
    },
    connector: {
        position: 'absolute',
        top: 11,
        left: -50,
        right: '50%',
        height: 2,
    },
    stoneDot: {
        width: 24,
        height: 24,
        borderRadius: 12,
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1,
    },
    stoneLabel: {
        fontFamily: FontFamily.sansBold,
        fontSize: 9,
        letterSpacing: 1,
        textTransform: 'uppercase',
    },
    attendedLine: {
        marginTop: Spacing.md,
        fontFamily: FontFamily.sansMedium,
        fontSize: 11,
        color: Colors.olive[400],
        textAlign: 'center',
        letterSpacing: 0.5,
    },
});
