import { useRef, useEffect, useState } from 'react';
import {
    View,
    Text,
    TouchableOpacity,
    ScrollView,
    StyleSheet,
    NativeScrollEvent,
    NativeSyntheticEvent,
} from 'react-native';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, Shadows, Alpha } from '../constants/theme';
import { generateDays, formatDayName, isSameDay } from './calendarUtils';

interface CalendarStripProps {
    selectedDate: Date;
    onDateSelect: (date: Date) => void;
    daysCount?: number;
}

const DAY_ITEM_WIDTH = 56;
const DAY_ITEM_GAP = 8;
const ITEM_TOTAL_WIDTH = DAY_ITEM_WIDTH + DAY_ITEM_GAP;
const SCROLL_PAGE_ITEMS = 4;

export default function CalendarStrip({
    selectedDate,
    onDateSelect,
    daysCount = 14,
}: CalendarStripProps) {
    const scrollRef = useRef<ScrollView>(null);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    const days = generateDays(today, daysCount);

    const [scrollX, setScrollX] = useState(0);
    const [contentWidth, setContentWidth] = useState(0);
    const [viewportWidth, setViewportWidth] = useState(0);

    useEffect(() => {
        const index = days.findIndex((d) => isSameDay(d, selectedDate));
        if (index >= 0 && scrollRef.current) {
            // Center the selected day in the viewport
            const next = Math.max(0, index * ITEM_TOTAL_WIDTH - ITEM_TOTAL_WIDTH * 2);
            scrollRef.current.scrollTo({ x: next, animated: true });
        }
    }, [selectedDate]);

    const handleScroll = (e: NativeSyntheticEvent<NativeScrollEvent>) => {
        setScrollX(e.nativeEvent.contentOffset.x);
    };

    const scrollBy = (direction: 1 | -1) => {
        if (!scrollRef.current || contentWidth === 0 || viewportWidth === 0) return;
        const maxScroll = Math.max(0, contentWidth - viewportWidth);
        const next = Math.min(
            maxScroll,
            Math.max(0, scrollX + direction * SCROLL_PAGE_ITEMS * ITEM_TOTAL_WIDTH),
        );
        scrollRef.current.scrollTo({ x: next, animated: true });
    };

    const maxScroll = Math.max(1, contentWidth - viewportWidth);
    const canScrollLeft = scrollX > 2;
    const canScrollRight = scrollX < maxScroll - 2;

    // Progress thumb dimensions as % of track
    const thumbRatio =
        contentWidth > 0 && viewportWidth > 0
            ? Math.min(1, viewportWidth / contentWidth)
            : 1;
    const thumbOffsetRatio = maxScroll > 0 ? scrollX / maxScroll : 0;

    const thumbWidthPct = `${thumbRatio * 100}%` as const;
    const thumbLeftPct = `${thumbOffsetRatio * (1 - thumbRatio) * 100}%` as const;

    return (
        <View style={styles.wrapper}>
            <View style={styles.stripRow}>
                <ScrollView
                    ref={scrollRef}
                    horizontal
                    showsHorizontalScrollIndicator={false}
                    onScroll={handleScroll}
                    scrollEventThrottle={16}
                    onContentSizeChange={(w) => setContentWidth(w)}
                    onLayout={(e) => setViewportWidth(e.nativeEvent.layout.width)}
                    contentContainerStyle={styles.container}
                >
                    {days.map((day) => {
                        const isSelected = isSameDay(day, selectedDate);
                        const isToday = isSameDay(day, today);

                        return (
                            <TouchableOpacity
                                key={day.toISOString()}
                                style={[
                                    styles.dayItem,
                                    isToday && !isSelected && styles.dayItemToday,
                                    isSelected && styles.dayItemSelected,
                                ]}
                                onPress={() => onDateSelect(day)}
                                activeOpacity={0.7}
                            >
                                <Text
                                    style={[
                                        styles.dayName,
                                        isSelected && styles.dayNameSelected,
                                    ]}
                                >
                                    {formatDayName(day)}
                                </Text>
                                <Text
                                    style={[
                                        styles.dayNumber,
                                        isSelected && styles.dayNumberSelected,
                                    ]}
                                >
                                    {day.getDate()}
                                </Text>
                                {isToday && !isSelected && <View style={styles.todayDot} />}
                            </TouchableOpacity>
                        );
                    })}
                </ScrollView>

                {/* Left arrow */}
                {canScrollLeft && (
                    <TouchableOpacity
                        style={[styles.arrowButton, styles.arrowLeft]}
                        onPress={() => scrollBy(-1)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                    >
                        <Feather name="chevron-left" size={18} color={Colors.olive[600]} />
                    </TouchableOpacity>
                )}

                {/* Right arrow */}
                {canScrollRight && (
                    <TouchableOpacity
                        style={[styles.arrowButton, styles.arrowRight]}
                        onPress={() => scrollBy(1)}
                        activeOpacity={0.7}
                        hitSlop={{ top: 12, bottom: 12, left: 8, right: 8 }}
                    >
                        <Feather name="chevron-right" size={18} color={Colors.olive[600]} />
                    </TouchableOpacity>
                )}
            </View>

            {/* Scroll progress indicator */}
            <View style={styles.progressTrack}>
                <View
                    style={[
                        styles.progressThumb,
                        { width: thumbWidthPct, left: thumbLeftPct },
                    ]}
                />
            </View>
        </View>
    );
}

const styles = StyleSheet.create({
    wrapper: {
        paddingVertical: Spacing.xs,
    },
    stripRow: {
        position: 'relative',
    },
    container: {
        paddingHorizontal: Spacing.md,
        gap: DAY_ITEM_GAP,
    },
    dayItem: {
        width: DAY_ITEM_WIDTH,
        height: 72,
        alignItems: 'center',
        justifyContent: 'center',
        borderRadius: BorderRadius.lg,
        backgroundColor: 'transparent',
    },
    dayItemToday: {
        backgroundColor: Alpha.peach200_60,
    },
    dayItemSelected: {
        backgroundColor: Colors.primary,
        ...Shadows.lg,
    },
    dayName: {
        fontSize: FontSize.xs,
        color: Colors.olive[400],
        fontWeight: '600',
        marginBottom: 4,
    },
    dayNameSelected: {
        color: Colors.white,
    },
    dayNumber: {
        fontSize: FontSize.lg,
        fontWeight: '700',
        color: Colors.olive[400],
    },
    dayNumberSelected: {
        color: Colors.white,
    },
    todayDot: {
        width: 5,
        height: 5,
        borderRadius: 3,
        backgroundColor: Colors.terra[400],
        marginTop: 4,
    },

    // Navigation arrows
    arrowButton: {
        position: 'absolute',
        top: '50%',
        transform: [{ translateY: -16 }],
        width: 32,
        height: 32,
        borderRadius: 16,
        backgroundColor: Colors.peach[50],
        borderWidth: 1,
        borderColor: Alpha.peach400_35,
        alignItems: 'center',
        justifyContent: 'center',
        ...Shadows.sm,
    },
    arrowLeft: {
        left: 4,
    },
    arrowRight: {
        right: 4,
    },

    // Progress indicator
    progressTrack: {
        height: 3,
        backgroundColor: Alpha.peach400_20,
        borderRadius: 2,
        marginTop: Spacing.sm,
        marginHorizontal: Spacing.md,
        overflow: 'hidden',
        position: 'relative',
    },
    progressThumb: {
        position: 'absolute',
        top: 0,
        height: 3,
        backgroundColor: Colors.terra[400],
        borderRadius: 2,
    },
});
