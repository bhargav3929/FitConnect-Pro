import { ScrollView, View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { Feather } from '@expo/vector-icons';
import { Colors, Spacing, FontSize, BorderRadius, FontFamily, Alpha } from '../constants/theme';

export default function AboutScreen() {
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
                <Text style={styles.headerTitle}>ABOUT SOL</Text>
                <View style={{ width: 40 }} />
            </View>

            <ScrollView
                style={styles.container}
                contentContainerStyle={styles.contentContainer}
                showsVerticalScrollIndicator={false}
            >
                {/* Bio */}
                <View style={styles.eyebrowPill}>
                    <Text style={styles.eyebrowText}>OUR BIO</Text>
                </View>
                <Text style={styles.heading}>YOUR BODY IS THE SUN</Text>

                <Text style={styles.paragraph}>
                    At Sol Pilates Studio, we believe your body is the SUN your life revolves around.
                </Text>
                <Text style={styles.paragraph}>
                    When it&rsquo;s in pain, everything feels heavier. When it&rsquo;s strong, everything feels possible.
                </Text>
                <Text style={styles.paragraph}>
                    That&rsquo;s why we built a method rooted in three things: strength, intention and sustainability. We combine Pilates with strength training principles and a rehab mindset. So you&rsquo;re not just working out, you&rsquo;re moving out of pain and into a better quality of life.
                </Text>
                <Text style={styles.paragraph}>
                    No extremes. No quick fixes. Just intentional movement that helps you stand taller, move freer and feel at home in your body again.
                </Text>
                <Text style={styles.emphasis}>
                    Because when your sol is strong, your whole life gets lighter.
                </Text>

                <View style={styles.divider} />

                {/* Founder Story */}
                <View style={styles.eyebrowPill}>
                    <Text style={styles.eyebrowText}>FOUNDER STORY</Text>
                </View>
                <Text style={styles.heading}>FROM ENGINEERING TO MOVEMENT</Text>

                <Text style={styles.paragraph}>
                    I didn&rsquo;t come from a traditional fitness background; I came from engineering.
                </Text>
                <Text style={styles.paragraph}>
                    With a Master&rsquo;s in Electrical Engineering and years spent in high-performance environments, I&rsquo;ve always approached problems the same way: understand the system deeply before trying to fix it.
                </Text>
                <Text style={styles.paragraph}>
                    Over time, I started seeing the human body the same way; as an ecosystem. Pain, stiffness, and weakness aren&rsquo;t random. They&rsquo;re patterns. And when you train with intention, those patterns change.
                </Text>
                <Text style={styles.paragraph}>
                    That&rsquo;s how Sol Pilates Studio was born.
                </Text>
                <Text style={styles.paragraph}>
                    The name Sol means &lsquo;Sun&rsquo; and I chose it because your body is the sun your life revolves around. When it hurts&hellip; your work, your relationships, your energy, your joy &mdash; all of it dims. When it&rsquo;s strong, everything else lights up.
                </Text>
                <Text style={styles.paragraph}>
                    My method combines Pilates with strength training principles to create workouts that aren&rsquo;t just effective, but sustainable. Especially for people who are short on time but are tired of living with pain, stiffness, or that &ldquo;something&rsquo;s off&rdquo; feeling.
                </Text>
                <Text style={styles.paragraph}>
                    Today, I work with busy professionals, young moms and aging adults who want to feel capable in their own bodies again. Not to push harder, but to build something that lasts.
                </Text>
                <Text style={styles.emphasis}>
                    Because the goal was never to chase a certain look. It&rsquo;s to help you feel good in the life you&rsquo;re actually living.
                </Text>
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
    container: { flex: 1 },
    contentContainer: {
        paddingHorizontal: Spacing.lg,
        paddingTop: Spacing.xl,
        paddingBottom: 80,
    },
    eyebrowPill: {
        alignSelf: 'flex-start',
        backgroundColor: Alpha.terra400_10,
        borderRadius: BorderRadius.full,
        paddingHorizontal: Spacing.md - 4,
        paddingVertical: 4,
        marginBottom: Spacing.md,
    },
    eyebrowText: {
        fontFamily: FontFamily.sansBold,
        fontSize: FontSize.xs,
        color: Colors.terra[400],
        letterSpacing: 1.5,
    },
    heading: {
        fontFamily: FontFamily.display,
        fontSize: FontSize['3xl'],
        color: Colors.olive[600],
        letterSpacing: -0.5,
        marginBottom: Spacing.lg,
    },
    paragraph: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.base,
        color: Colors.olive[400],
        lineHeight: 24,
        marginBottom: Spacing.md,
    },
    emphasis: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.base,
        color: Colors.olive[600],
        lineHeight: 24,
        marginTop: Spacing.sm,
    },
    divider: {
        height: 1,
        backgroundColor: Alpha.olive400_18,
        marginVertical: Spacing.xl,
    },
});
