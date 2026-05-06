import type { Config } from "tailwindcss";
import { COLORS } from "./shared/src/theme/colors";

const config: Config = {
    darkMode: "class",
    content: [
        "./src/pages/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/components/**/*.{js,ts,jsx,tsx,mdx}",
        "./src/app/**/*.{js,ts,jsx,tsx,mdx}",
    ],
    theme: {
        extend: {
            fontFamily: {
                display: ['var(--font-display)', 'serif'],
                sans: ['var(--font-sans)', 'sans-serif'],
            },
            colors: {
                background: 'hsl(var(--background))',
                foreground: 'hsl(var(--foreground))',
                card: {
                    DEFAULT: 'hsl(var(--card))',
                    foreground: 'hsl(var(--card-foreground))'
                },
                popover: {
                    DEFAULT: 'hsl(var(--popover))',
                    foreground: 'hsl(var(--popover-foreground))'
                },
                primary: {
                    DEFAULT: 'hsl(var(--primary))',
                    foreground: 'hsl(var(--primary-foreground))'
                },
                secondary: {
                    DEFAULT: 'hsl(var(--secondary))',
                    foreground: 'hsl(var(--secondary-foreground))'
                },
                muted: {
                    DEFAULT: 'hsl(var(--muted))',
                    foreground: 'hsl(var(--muted-foreground))'
                },
                accent: {
                    DEFAULT: 'hsl(var(--accent))',
                    foreground: 'hsl(var(--accent-foreground))'
                },
                destructive: {
                    DEFAULT: 'hsl(var(--destructive))',
                    foreground: 'hsl(var(--destructive-foreground))'
                },
                border: 'hsl(var(--border))',
                input: 'hsl(var(--input))',
                ring: 'hsl(var(--ring))',
                chart: {
                    '1': 'hsl(var(--chart-1))',
                    '2': 'hsl(var(--chart-2))',
                    '3': 'hsl(var(--chart-3))',
                    '4': 'hsl(var(--chart-4))',
                    '5': 'hsl(var(--chart-5))'
                },
                /* SOL v3 — Centralized colors from shared/src/theme/colors.ts */
                peach: {
                    50: COLORS.peach[50],
                    100: COLORS.peach[100],
                    200: COLORS.peach[200],
                    300: COLORS.peach[300],
                    400: COLORS.peach[400],
                    500: COLORS.peach[500],
                },
                olive: {
                    300: COLORS.olive[300],
                    400: COLORS.olive[400],
                    500: COLORS.olive[500],
                    600: COLORS.olive[600],
                    700: COLORS.olive[700],
                },
                terra: {
                    300: COLORS.gold[300],
                    400: COLORS.gold[400],
                    500: COLORS.gold[500],
                    600: COLORS.primary.terraDarker,
                },
                warmDark: {
                    700: COLORS.peach[100],
                    800: COLORS.peach[50],
                    900: COLORS.peach[50],
                },
                forest: {
                    600: COLORS.peach[100],
                    700: COLORS.peach[200],
                    800: COLORS.peach[50],
                    950: COLORS.peach[50],
                },
                gold: {
                    300: COLORS.gold[300],
                    400: COLORS.gold[400],
                    500: COLORS.gold[500],
                },
                sand: {
                    200: COLORS.peach[100],
                },
                sage: {
                    300: COLORS.olive[300],
                    400: COLORS.olive[300],
                    500: COLORS.olive[400],
                },
                terracotta: {
                    400: COLORS.primary.terra,
                },
                'error-hover': COLORS.errorHover,
            },
            borderRadius: {
                lg: 'var(--radius)',
                md: 'calc(var(--radius) - 2px)',
                sm: 'calc(var(--radius) - 4px)'
            },
            boxShadow: {
                'sm': '0 1px 2px 0 rgb(0 0 0 / 0.05)',
                'md': '0 4px 6px -1px rgb(0 0 0 / 0.1), 0 2px 4px -2px rgb(0 0 0 / 0.1)',
                'lg': '0 10px 15px -3px rgb(0 0 0 / 0.1), 0 4px 6px -4px rgb(0 0 0 / 0.1)',
                'xl': '0 20px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)',
                'glow': '0 0 24px rgba(0, 0, 0, 0.15)',
                'glow-lg': '0 0 40px rgba(0, 0, 0, 0.2)',
            },
            keyframes: {
                "accordion-down": {
                    from: { height: "0" },
                    to: { height: "var(--radix-accordion-content-height)" },
                },
                "accordion-up": {
                    from: { height: "var(--radix-accordion-content-height)" },
                    to: { height: "0" },
                },
                "gradient-xy": {
                    "0%, 100%": {
                        "background-size": "400% 400%",
                        "background-position": "left center"
                    },
                    "50%": {
                        "background-size": "200% 200%",
                        "background-position": "right center"
                    }
                },
                "fade-in-up": {
                    "0%": {
                        opacity: "0",
                        transform: "translateY(20px)"
                    },
                    "100%": {
                        opacity: "1",
                        transform: "translateY(0)"
                    }
                },
                "shimmer": {
                    "100%": {
                        transform: "translateX(100%)"
                    }
                }
            },
            animation: {
                "accordion-down": "accordion-down 0.2s ease-out",
                "accordion-up": "accordion-up 0.2s ease-out",
                "gradient-xy": "gradient-xy 15s ease infinite",
                "fade-in-up": "fade-in-up 0.5s ease-out forwards",
                "shimmer": "shimmer 2s infinite",
            }
        }
    },
    plugins: [require("tailwindcss-animate")],
};
export default config;
