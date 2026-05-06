import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, FontFamily, Alpha } from '../constants/theme';

export default function ShopScreen() {
    const router = useRouter();

    return (
        <SafeAreaView style={styles.safeArea} edges={['top']}>
            <View style={styles.header}>
                <TouchableOpacity
                    onPress={() => router.back()}
                    style={styles.backBtn}
                    activeOpacity={0.7}
                >
                    <Feather name="arrow-left" size={22} color={Colors.olive[600]} />
                </TouchableOpacity>
                <Text style={styles.headerTitle}>SHOP</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                <View style={styles.card}>
                    <View style={styles.iconCircle}>
                        <Feather name="shopping-bag" size={32} color={Colors.terra[400]} />
                    </View>
                    <View style={styles.pill}>
                        <Text style={styles.pillText}>COMING SOON</Text>
                    </View>
                    <Text style={styles.heading}>STUDIO MERCH IS ON THE WAY</Text>
                    <Text style={styles.paragraph}>
                        We&rsquo;re curating a small line of apparel, mats, and accessories crafted to match the studio&rsquo;s feel. Check back soon.
                    </Text>
                </View>
            </ScrollView>
        </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    safeArea: { flex: 1, backgroundColor: Colors.background },
    header: {
        flexDirection: 'row',
        alignItems: 'center',
        justifyContent: 'space-between',
        paddingHorizontal: Spacing.lg,
        paddingVertical: Spacing.md,
        borderBottomWidth: 1,
        borderBottomColor: Alpha.olive400_12,
    },
    backBtn: {
        width: 40,
        height: 40,
        borderRadius: 20,
        alignItems: 'center',
        justifyContent: 'center',
        backgroundColor: Colors.peach[100],
    },
    headerTitle: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.sm,
        color: Colors.olive[600],
        letterSpacing: 2,
    },
    contentContainer: {
        padding: Spacing.lg,
        paddingTop: Spacing['2xl'],
    },
    card: {
        backgroundColor: Colors.peach[50],
        borderRadius: BorderRadius['2xl'],
        borderWidth: 1,
        borderColor: Alpha.terra400_18,
        padding: Spacing.xl,
        alignItems: 'center',
    },
    iconCircle: {
        width: 72,
        height: 72,
        borderRadius: 36,
        backgroundColor: Alpha.terra400_10,
        alignItems: 'center',
        justifyContent: 'center',
        marginBottom: Spacing.md,
    },
    pill: {
        backgroundColor: Alpha.terra400_12,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md - 2,
        paddingVertical: 4,
        marginBottom: Spacing.md,
    },
    pillText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.terra[400],
        letterSpacing: 2,
    },
    heading: {
        fontFamily: FontFamily.display,
        fontSize: FontSize['2xl'],
        color: Colors.olive[600],
        letterSpacing: -0.3,
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    paragraph: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.sm,
        color: Colors.olive[400],
        lineHeight: 22,
        textAlign: 'center',
    },
});
