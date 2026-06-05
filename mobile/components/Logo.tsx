import { Image, ImageStyle, StyleProp } from 'react-native';

interface LogoProps {
    height?: number;
    style?: StyleProp<ImageStyle>;
}

const LOGO_ASPECT_RATIO = 1084 / 900;
const LOGO_SOURCE = require('../assets/sol-logo-terra-display.png');

export default function Logo({ height = 56, style }: LogoProps) {
    return (
        <Image
            source={LOGO_SOURCE}
            resizeMode="contain"
            style={[{ height, width: height * LOGO_ASPECT_RATIO }, style]}
            accessibilityLabel="SOL Pilates Studio"
        />
    );
}
