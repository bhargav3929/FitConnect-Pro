import { useState, useEffect, useRef } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    Modal,
    StyleSheet,
    Alert,
    ActivityIndicator,
    ScrollView,
    Dimensions,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import type { ClassSession } from '@fitconnect/shared/types/class';
import { callBookClass, subscribeToClass } from '@fitconnect/shared/firebase/firestore';
import { Colors, Spacing, FontSize, BorderRadius, Shadows, Alpha } from '../constants/theme';

interface SpotSelectorProps {
    visible: boolean;
    classSession: ClassSession;
    trainerName?: string;
    selectedDate?: Date;
    onClose: () => void;
    onBooked: () => void;
}

const GRID_COLUMNS = 4;
const SPOT_SIZE = 56;
const SPOT_GAP = 12;
const { width: SCREEN_WIDTH } = Dimensions.get('window');

export default function SpotSelector({
    visible,
    classSession,
    trainerName,
    selectedDate,
    onClose,
    onBooked,
}: SpotSelectorProps) {
    const [selectedSpot, setSelectedSpot] = useState<number | null>(null);
    const [loading, setLoading] = useState(false);
    const [liveBookedSpots, setLiveBookedSpots] = useState<number[]>([]);
    const unsubRef = useRef<(() => void) | null>(null);

    const totalSpots = classSession.totalSpots || classSession.capacity || 12;

    // Reset state and sync booked spots on open
    useEffect(() => {
        if (visible) {
            setSelectedSpot(null);
            setLoading(false);
            setLiveBookedSpots(classSession.bookedSpots || []);
        }
    }, [visible, classSession.bookedSpots]);

    // Real-time listener for spot availability
    useEffect(() => {
        if (visible && classSession.id) {
            unsubRef.current = subscribeToClass(classSession.id, (updated) => {
                if (updated) {
                    const newBooked = updated.bookedSpots || [];
                    setLiveBookedSpots((prev) => {
                        if (
                            selectedSpot &&
                            !prev.includes(selectedSpot) &&
                            newBooked.includes(selectedSpot)
                        ) {
                            Alert.alert(
                                'Spot Taken',
                                `Spot ${selectedSpot} was just booked by another member. Please select a different spot.`,
                            );
                            setSelectedSpot(null);
                        }
                        return newBooked;
                    });
                }
            });
        }

        return () => {
            if (unsubRef.current) {
                unsubRef.current();
                unsubRef.current = null;
            }
        };
    }, [visible, classSession.id]);

    const availableCount = totalSpots - liveBookedSpots.length;

    const handleConfirm = async () => {
        if (selectedSpot === null) return;

        // Final check
        if (liveBookedSpots.includes(selectedSpot)) {
            Alert.alert(
                'Spot Taken',
                `Spot ${selectedSpot} was just taken. Please select another.`,
            );
            setSelectedSpot(null);
            return;
        }

        setLoading(true);
        try {
            await callBookClass(classSession.id, selectedSpot, false);
            Alert.alert('Booked!', `Spot #${selectedSpot} is yours.`, [
                {
                    text: 'OK',
                    onPress: () => {
                        setSelectedSpot(null);
                        onBooked();
                    },
                },
            ]);
        } catch (error: unknown) {
            const message =
                error instanceof Error ? error.message : 'Booking failed. Please try again.';
            Alert.alert('Booking Failed', message);
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        setSelectedSpot(null);
        onClose();
    };

    const formatDate = (date?: Date) => {
        if (!date) return '';
        const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
        const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
        return `${days[date.getDay()]}, ${date.getDate()} ${months[date.getMonth()]}`;
    };

    const spots = Array.from({ length: totalSpots }, (_, i) => i + 1);

    return (
        <Modal
            visible={visible}
            animationType="slide"
            transparent
            onRequestClose={handleClose}
        >
            <View style={styles.overlay}>
                <View style={styles.sheet}>
                    {/* Drag Handle */}
                    <View style={styles.dragHandleContainer}>
                        <View style={styles.dragHandle} />
                    </View>

                    <ScrollView
                        showsVerticalScrollIndicator={false}
                        contentContainerStyle={styles.scrollContent}
                        bounces={false}
                    >
                        {/* Header */}
                        <View style={styles.header}>
                            <View style={styles.headerTextWrap}>
                                <Text style={styles.title}>
                                    {classSession.classType || 'Pilates'}
                                </Text>
                                <Text style={styles.headerSubtitle}>
                                    {classSession.classType || 'Pilates'} {'\u2022'} {classSession.startTime}
                                </Text>
                            </View>
                            <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
                                <Feather name="x" size={16} color={Colors.olive[600]} />
                            </TouchableOpacity>
                        </View>

                        {/* Class Info Compact */}
                        <View style={styles.infoCard}>
                            <View style={styles.infoDateBox}>
                                <Text style={styles.infoDateText}>
                                    {selectedDate ? selectedDate.getDate() : ''}
                                </Text>
                            </View>
                            <View style={styles.infoDetails}>
                                <Text style={styles.infoInstructor}>
                                    {trainerName || 'Instructor'}
                                </Text>
                                <Text style={styles.infoMeta}>
                                    {classSession.location || 'Main Studio'} {'\u2022'} {classSession.duration} min
                                </Text>
                            </View>
                            <View style={styles.infoOpenBadge}>
                                <Text style={styles.infoOpenText}>
                                    {availableCount} open
                                </Text>
                            </View>
                        </View>

                        {/* Legend */}
                        <View style={styles.legend}>
                            <View style={styles.legendItem}>
                                <View style={styles.legendAvailable} />
                                <Text style={styles.legendLabel}>Available</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={styles.legendSelected} />
                                <Text style={styles.legendLabel}>Selected</Text>
                            </View>
                            <View style={styles.legendItem}>
                                <View style={styles.legendBooked} />
                                <Text style={styles.legendLabel}>Booked</Text>
                            </View>
                        </View>

                        {/* Studio layout: 12 reformers, 5 left / 7 right with center aisle */}
                        <View style={styles.gridContainer}>
                            <View style={styles.studioLayout}>
                                <View style={styles.studioColumn}>
                                    {spots.slice(0, 5).map((spot) => {
                                        const isBooked = liveBookedSpots.includes(spot);
                                        const isSelected = selectedSpot === spot;
                                        return (
                                            <TouchableOpacity
                                                key={spot}
                                                style={[
                                                    styles.spotCell,
                                                    isBooked && styles.spotBooked,
                                                    isSelected && styles.spotSelected,
                                                ]}
                                                onPress={() => { if (!isBooked) setSelectedSpot(spot); }}
                                                disabled={isBooked}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.spotText, isBooked && styles.spotTextBooked, isSelected && styles.spotTextSelected]}>
                                                    {spot}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>

                                <View style={styles.studioAisle} />

                                <View style={styles.studioColumn}>
                                    {spots.slice(5, 12).map((spot) => {
                                        const isBooked = liveBookedSpots.includes(spot);
                                        const isSelected = selectedSpot === spot;
                                        return (
                                            <TouchableOpacity
                                                key={spot}
                                                style={[
                                                    styles.spotCell,
                                                    isBooked && styles.spotBooked,
                                                    isSelected && styles.spotSelected,
                                                ]}
                                                onPress={() => { if (!isBooked) setSelectedSpot(spot); }}
                                                disabled={isBooked}
                                                activeOpacity={0.7}
                                            >
                                                <Text style={[styles.spotText, isBooked && styles.spotTextBooked, isSelected && styles.spotTextSelected]}>
                                                    {spot}
                                                </Text>
                                            </TouchableOpacity>
                                        );
                                    })}
                                </View>
                            </View>
                        </View>
                    </ScrollView>

                    {/* Confirm Button */}
                    <View style={styles.footer}>
                        <TouchableOpacity
                            style={[
                                styles.confirmButton,
                                (selectedSpot === null || loading) && styles.confirmButtonDisabled,
                            ]}
                            onPress={handleConfirm}
                            disabled={selectedSpot === null || loading}
                            activeOpacity={0.7}
                        >
                            {loading ? (
                                <ActivityIndicator color={Colors.white} size="small" />
                            ) : (
                                <Text style={styles.confirmText}>
                                    {selectedSpot !== null
                                        ? `CONFIRM SPOT ${selectedSpot}`
                                        : 'SELECT A SPOT'}
                                </Text>
                            )}
                        </TouchableOpacity>
                    </View>
                </View>
            </View>
        </Modal>
    );
}

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: Alpha.black_50,
        justifyContent: 'flex-end',
    },
    sheet: {
        backgroundColor: Colors.peach[50],
        borderTopLeftRadius: BorderRadius['2xl'],
        borderTopRightRadius: BorderRadius['2xl'],
        maxHeight: '85%',
    },
    dragHandleContainer: {
        alignItems: 'center',
        paddingTop: Spacing.sm + 4,
        paddingBottom: Spacing.xs,
    },
    dragHandle: {
        width: 40,
        height: 4,
        borderRadius: 2,
        backgroundColor: Alpha.peach400_30,
    },
    scrollContent: {
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.md,
    },

    // Header
    header: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        alignItems: 'flex-start',
        marginBottom: Spacing.md,
    },
    headerTextWrap: {
        flex: 1,
        marginRight: Spacing.md,
    },
    title: {
        fontSize: FontSize.xl,
        fontWeight: '800',
        color: Colors.olive[600],
        marginBottom: 4,
    },
    headerSubtitle: {
        fontSize: FontSize.xs,
        color: Colors.olive[300],
        fontWeight: '500',
        textTransform: 'uppercase',
        letterSpacing: 1,
    },
    closeButton: {
        width: 36,
        height: 36,
        borderRadius: 18,
        backgroundColor: Alpha.peach200_50,
        alignItems: 'center',
        justifyContent: 'center',
    },

    // Class Info Compact
    infoCard: {
        flexDirection: 'row',
        alignItems: 'center',
        backgroundColor: Alpha.peach200_40,
        borderRadius: BorderRadius.xl,
        padding: Spacing.sm + 4,
        marginBottom: Spacing.lg,
        gap: Spacing.sm + 4,
    },
    infoDateBox: {
        width: 48,
        height: 48,
        borderRadius: BorderRadius.lg,
        backgroundColor: Alpha.terra400_20,
        alignItems: 'center',
        justifyContent: 'center',
    },
    infoDateText: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.terra[400],
    },
    infoDetails: {
        flex: 1,
    },
    infoInstructor: {
        fontSize: FontSize.base,
        fontWeight: '500',
        color: Colors.olive[600],
    },
    infoMeta: {
        fontSize: FontSize.sm,
        color: Colors.olive[300],
        marginTop: 2,
    },
    infoOpenBadge: {
        backgroundColor: Alpha.terra400_10,
        paddingHorizontal: Spacing.sm,
        paddingVertical: Spacing.xs,
        borderRadius: BorderRadius.sm,
    },
    infoOpenText: {
        fontSize: FontSize.xs,
        fontWeight: '700',
        color: Colors.terra[400],
    },

    // Legend
    legend: {
        flexDirection: 'row',
        gap: Spacing.md,
        marginBottom: Spacing.lg,
    },
    legendItem: {
        flexDirection: 'row',
        alignItems: 'center',
        gap: Spacing.sm,
    },
    legendAvailable: {
        width: 14,
        height: 14,
        borderRadius: 7,
        borderWidth: 1.5,
        borderColor: Alpha.peach400_30,
        backgroundColor: 'transparent',
    },
    legendSelected: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Colors.terra[400],
    },
    legendBooked: {
        width: 14,
        height: 14,
        borderRadius: 7,
        backgroundColor: Alpha.peach300_40,
    },
    legendLabel: {
        fontSize: FontSize.xs,
        color: Colors.olive[300],
        fontWeight: '500',
    },

    // Spot Grid
    gridContainer: {
        alignItems: 'center',
        marginBottom: Spacing.md,
    },
    grid: {
        flexDirection: 'row',
        flexWrap: 'wrap',
        gap: SPOT_GAP,
        width: GRID_COLUMNS * SPOT_SIZE + (GRID_COLUMNS - 1) * SPOT_GAP,
    },
    studioLayout: {
        flexDirection: 'row',
        alignItems: 'flex-start',
        justifyContent: 'center',
        gap: Spacing.lg,
    },
    studioColumn: {
        flexDirection: 'column',
        gap: SPOT_GAP,
    },
    studioAisle: {
        width: 1,
        alignSelf: 'stretch',
        backgroundColor: Alpha.peach400_30,
        marginVertical: Spacing.sm,
    },
    spotCell: {
        width: SPOT_SIZE - 8,
        height: SPOT_SIZE + 8,
        borderRadius: BorderRadius.md,
        backgroundColor: Alpha.peach200_40,
        borderWidth: 1,
        borderColor: Alpha.peach400_20,
        justifyContent: 'center',
        alignItems: 'center',
    },
    spotBooked: {
        backgroundColor: Alpha.peach300_30,
        borderColor: Alpha.peach300_30,
    },
    spotSelected: {
        backgroundColor: Colors.terra[400],
        borderColor: Colors.terra[400],
        transform: [{ scale: 1.05 }],
        ...Shadows.lg,
    },
    spotText: {
        fontSize: FontSize.base,
        fontWeight: '700',
        color: Colors.olive[400],
    },
    spotTextBooked: {
        color: Colors.olive[300],
        opacity: 0.4,
    },
    spotTextSelected: {
        color: Colors.white,
    },

    // Footer
    footer: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.md,
        paddingBottom: Spacing['2xl'],
        borderTopWidth: 1,
        borderTopColor: Alpha.peach400_20,
    },
    confirmButton: {
        backgroundColor: Colors.terra[400],
        borderRadius: BorderRadius.xl,
        height: 56,
        alignItems: 'center',
        justifyContent: 'center',
    },
    confirmButtonDisabled: {
        opacity: 0.5,
    },
    confirmText: {
        color: Colors.white,
        fontSize: FontSize.base,
        fontWeight: '800',
        letterSpacing: 0.5,
    },
});
