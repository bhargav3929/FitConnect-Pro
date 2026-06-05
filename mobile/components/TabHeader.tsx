import { View, StyleSheet } from 'react-native';
import Logo from './Logo';
import { Colors, Spacing } from '../constants/theme';

interface TabHeaderProps {
    logoHeight?: number;
}

// Fixed top header — identical position/padding on every tab screen.
// Mount this directly inside SafeAreaView (NOT inside a ScrollView) so it stays pinned.
export default function TabHeader({ logoHeight = 56 }: TabHeaderProps) {
    return (
        <View style={styles.container}>
            <Logo height={logoHeight} />
        </View>
    );
}

const styles = StyleSheet.create({
    container: {
        flexDirection: 'row',
        alignItems: 'center',
        paddingLeft: Spacing.lg,
        paddingRight: Spacing.lg,
        paddingVertical: 0,
        marginBottom: Spacing.sm,
        backgroundColor: Colors.background,
    },
});
