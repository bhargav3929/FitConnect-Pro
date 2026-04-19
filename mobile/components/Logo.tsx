import { Image, ImageStyle, StyleProp } from 'react-native';

type LogoVariant = 'terra' | 'cream';

interface LogoProps {
    variant?: LogoVariant;
    height?: number;
    style?: StyleProp<ImageStyle>;
}

const SOURCES: Record<LogoVariant, number> = {
    terra: require('../assets/sol-logo-terra.png'),
    cream: require('../assets/sol-logo-cream.png'),
};

export default function Logo({ variant = 'terra', height = 56, style }: LogoProps) {
    return (
        <Image
            source={SOURCES[variant]}
            resizeMode="contain"
            // The logo PNG is square (400×400) with baked-in whitespace around the
            // "sol" wordmark. Matching the container's aspect to the image's aspect
            // avoids `resizeMode="contain"` creating extra empty space on each side.
            style={[{ height, width: height }, style]}
            accessibilityLabel="SOL Pilates Studio"
        />
    );
}
