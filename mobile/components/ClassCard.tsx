import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ClassSession } from '@fitconnect/shared/types/class';
import { Colors, Spacing, FontSize, BorderRadius, Alpha } from '../constants/theme';

interface ClassCardProps {
    classSession: ClassSession;
    trainerName: string;
    onBook: (classSession: ClassSession) => void;
}

function getInitials(name: string): string {
    return name
        .split(' ')
        .map((w) => w[0])
        .join('')
        .toUpperCase()
        .slice(0, 2);
}

export default function ClassCard({ classSession, trainerName, onBook }: ClassCardProps) {
    const totalSpots = classSession.totalSpots || classSession.capacity || 12;
    const spotsLeft = totalSpots - classSession.bookedCount;
    const isFull = spotsLeft <= 0;
    const isLow = spotsLeft > 0 && spotsLeft / totalSpots < 0.5;

    const spotDotColor = isFull
        ? Colors.error
        : isLow
            ? Colors.warning
            : Colors.success;
    const spotLabel = isFull
        ? 'Full'
        : isLow
            ? `${spotsLeft} spots - Few left`
            : `${spotsLeft} spots left`;

    return (
        <TouchableOpacity
            style={styles.card}
            onPress={() => onBook(classSession)}
            activeOpacity={0.7}
        >
            {/* Top row: time | info | chevron */}
            <View style={styles.topRow}>
                {/* Left: Time column */}
                <View style={styles.timeColumn}>
                    <Text style={styles.startTime}>{classSession.startTime}</Text>
                    <Text style={styles.duration}>{classSession.duration} min</Text>
                </View>

                {/* Divider */}
                <View style={styles.divider} />

                {/* Center: class info */}
                <View style={styles.infoColumn}>
                    <Text style={styles.classType} numberOfLines={1}>
                        {classSession.classType || 'Pilates'}
                    </Text>
                    <View style={styles.locationRow}>
                        <Feather name="map-pin" size={10} color={Colors.olive[300]} />
                        <Text style={styles.locationText} numberOfLines={1}>
                            {classSession.location || 'Main Studio'}
                        </Text>
                    </View>
                    {/* Trainer row */}
                    <View style={styles.trainerRow}>
                        <View style={styles.trainerAvatar}>
                            <Text style={styles.trainerInitials}>
                                {getInitials(trainerName)}
                            </Text>
                        </View>
                        <Text style={styles.trainerName} numberOfLines={1}>
                            {trainerName}
                        </Text>
                    </View>
                </View>

                {/* Right: chevron */}
                <View style={styles.chevronWrap}>
                    <Feather
                        name="chevron-right"
                        size={20}
                        color={isFull ? Colors.muted : Colors.terra[400]}
                    />
                </View>
            </View>

            {/* Bottom row: spots indicator */}
            <View style={styles.bottomRow}>
                <View style={[styles.spotDot, { backgroundColor: spotDotColor }]} />
                <Text
                    style={[
                        styles.spotLabel,
                        isFull && styles.spotLabelFull,
                    ]}
                >
                    {spotLabel}
                </Text>
            </View>
        </TouchableOpacity>
    );
}

const styles = StyleSheet.create({
    card: {
        backgroundColor: Colors.peach[50],
        marginHorizontal: Spacing.md,
        marginBottom: Spacing.sm,
        padding: Spacing.md,
        borderRadius: BorderRadius.xl,
        borderWidth: 1,
        borderColor: Alpha.peach400_20,
    },
    topRow: {
        flexDirection: 'row',
        alignItems: 'center',
    },
    timeColumn: {
        width: 56,
        alignItems: 'center',
    },
    startTime: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.olive[600],
    },
    duration: {
        fontSize: FontSize['2xs'],
        color: Colors.olive[300],
        marginTop: 2,
    },
    divider: {
        width: 1,
        height: 40,
        backgroundColor: Alpha.peach400_20,
        marginHorizontal: Spacing.sm,
    },
    infoColumn: {
        flex: 1,
        marginLeft: 4,
    },
    classType: {
        fontSize: FontSize.base,
        fontWeight: '600',
        color: Colors.olive[600],
    },
    locationRow: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: 4,
        marginTop: 2,
    },
    locationText: {
        fontSize: FontSize.sm,
        color: Colors.olive[300],
    },
    trainerRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: 6,
        gap: 6,
    },
    trainerAvatar: {
        width: 24,
        height: 24,
        borderRadius: 12,
        backgroundColor: Alpha.terra400_20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    trainerInitials: {
        fontSize: 9,
        fontWeight: '700',
        color: Colors.terra[400],
    },
    trainerName: {
        fontSize: FontSize.sm,
        color: Colors.olive[400],
    },
    chevronWrap: {
        marginLeft: Spacing.sm,
        paddingLeft: Spacing.xs,
    },
    bottomRow: {
        flexDirection: 'row',
        alignItems: 'center',
        marginTop: Spacing.sm,
        paddingTop: Spacing.sm,
        borderTopWidth: 1,
        borderTopColor: Alpha.peach400_20,
        gap: 6,
    },
    spotDot: {
        width: 8,
        height: 8,
        borderRadius: 4,
    },
    spotLabel: {
        fontSize: FontSize.xs,
        fontWeight: '600',
        color: Colors.olive[400],
    },
    spotLabelFull: {
        color: Colors.error,
    },
});
