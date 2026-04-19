import { useEffect } from 'react';
import { Redirect } from 'expo-router';
import { View, ActivityIndicator, StyleSheet } from 'react-native';
import { useClientAuthStore } from '@fitconnect/shared/stores/clientAuthStore';
import { Colors } from '../constants/theme';

export default function Index() {
    const { isAuthenticated, isLoading, initAuth } = useClientAuthStore();

    useEffect(() => {
        const unsubscribe = initAuth();
        return unsubscribe;
    }, []);

    if (isLoading) {
        return (
            <View style={styles.container}>
                <ActivityIndicator size="large" color={Colors.primary} />
            </View>
        );
    }

    if (isAuthenticated) {
        return <Redirect href="/(tabs)" />;
    }

    return <Redirect href="/login" />;
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: Colors.background,
    },
});
