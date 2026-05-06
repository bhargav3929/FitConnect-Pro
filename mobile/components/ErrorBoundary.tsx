import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, ScrollView } from 'react-native';
import { Colors, Spacing, FontSize, BorderRadius, FontFamily } from '../constants/theme';

interface Props {
    children: React.ReactNode;
}

interface State {
    error: Error | null;
}

export class ErrorBoundary extends React.Component<Props, State> {
    state: State = { error: null };

    static getDerivedStateFromError(error: Error): State {
        return { error };
    }

    componentDidCatch(error: Error, info: React.ErrorInfo) {
        // Surfacing once to console is enough; ship a real reporter (Sentry/Crashlytics) later.
        console.warn('ErrorBoundary caught:', error, info.componentStack);
    }

    handleReset = () => {
        this.setState({ error: null });
    };

    render() {
        if (!this.state.error) return this.props.children;

        return (
            <View style={styles.container}>
                <ScrollView contentContainerStyle={styles.content}>
                    <Text style={styles.title}>Something went wrong</Text>
                    <Text style={styles.subtitle}>
                        The app hit an unexpected error. Try again, or restart the app if it
                        keeps happening.
                    </Text>
                    {__DEV__ && (
                        <Text style={styles.devError}>{this.state.error.message}</Text>
                    )}
                    <TouchableOpacity
                        style={styles.button}
                        onPress={this.handleReset}
                        activeOpacity={0.85}
                    >
                        <Text style={styles.buttonText}>TRY AGAIN</Text>
                    </TouchableOpacity>
                </ScrollView>
            </View>
        );
    }
}

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: Colors.background,
    },
    content: {
        flexGrow: 1,
        justifyContent: 'center',
        padding: Spacing.xl,
    },
    title: {
        fontFamily: FontFamily.display,
        fontSize: FontSize['3xl'],
        color: Colors.olive[600],
        textAlign: 'center',
        marginBottom: Spacing.md,
    },
    subtitle: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.base,
        color: Colors.olive[400],
        textAlign: 'center',
        lineHeight: 22,
        marginBottom: Spacing.xl,
    },
    devError: {
        fontFamily: FontFamily.sans,
        fontSize: FontSize.xs,
        color: Colors.error,
        textAlign: 'center',
        marginBottom: Spacing.xl,
        paddingHorizontal: Spacing.md,
    },
    button: {
        backgroundColor: Colors.terra[400],
        borderRadius: BorderRadius.xl,
        paddingVertical: Spacing.md,
        alignItems: 'center',
    },
    buttonText: {
        fontFamily: FontFamily.sansExtra,
        fontSize: FontSize.sm,
        color: Colors.white,
        letterSpacing: 1.5,
    },
});
