import { Image, ImageStyle, StyleProp } from 'react-native';

interface LogoProps {
    height?: number;
    style?: StyleProp<ImageStyle>;
}

// Asset is rasterised from public/images/sol-logo-terra.svg, tight-cropped to the
// mark. Keep this in sync with the PNG's pixel dimensions.
const LOGO_ASPECT_RATIO = 1200 / 978;
const LOGO_SOURCE = require('../assets/sol-logo-terra-display.png');

export default function Logo({ height = 56, style }: LogoProps) {
    return (
        <Image
            source={LOGO_SOURCE}
            resizeMode="contain"
            style={[{ height, width: height * LOGO_ASPECT_RATIO }, style]}
            accessibilityLabel="Sol Pilates Studio"
        />
    );
}
