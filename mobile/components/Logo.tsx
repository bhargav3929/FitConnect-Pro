import { Image, ImageStyle, StyleProp } from 'react-native';

type LogoVariant = 'terra' | 'cream';

interface LogoProps {
    variant?: LogoVariant;
    height?: number;
    style?: StyleProp<ImageStyle>;
}

const SOURCES: Record<LogoVariant, number> = {
    terra: require('../assets/sol-wordmark-terra.png'),
    cream: require('../assets/sol-wordmark-cream.png'),
};

const WORDMARK_ASPECT_RATIO = 316 / 262;

export default function Logo({ variant = 'terra', height = 56, style }: LogoProps) {
    return (
        <Image
            source={SOURCES[variant]}
            resizeMode="contain"
            style={[{ height, width: height * WORDMARK_ASPECT_RATIO }, style]}
            accessibilityLabel="SOL Pilates Studio"
        />
    );
}
