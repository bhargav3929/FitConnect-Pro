import type { Config } from "tailwindcss";
import tailwindcssAnimate from "tailwindcss-animate";

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
                /* SOL v2 — Warm Peach / Olive / Terracotta Named Scales */
                peach: {
                    50: "#FAF3EB",
                    100: "#F5E8D8",
                    200: "#F0D8C0",
                    300: "#E4C8AB",
                    400: "#D4B494",
                    500: "#C4A080",
                },
                olive: {
                    300: "#8A947A",
                    400: "#64704F",
                    500: "#566044",
                    600: "#4A5438",
                    700: "#354024",
                },
                terra: {
                    300: "#FF8A5D",
                    400: "#FF6A3D",
                    500: "#E4572E",
                    600: "#B83A1F",
                },
                warmDark: {
                    600: "#4A3830",
                    700: "#3B2F28",
                    800: "#2C2420",
                    900: "#0B0F19",
                },
                brand: {
                    primary: "#FF6A3D",
                    secondary: "#FFB347",
                    accent: "#4A5438",
                    ink: "#0B0F19",
                    surface: "#F5E8D8",
                    paper: "#FAF3EB",
                },
                /* SOL Member/Admin Area — Dark Earthy Palette */
                forest: {
                    600: "#2A3328",
                    700: "#1E2620",
                    800: "#171E16",
                    950: "#0C120B",
                },
                gold: {
                    300: "#E2C476",
                    400: "#D4A24C",
                    500: "#B8862E",
                },
                sand: {
                    200: "#EDE6DA",
                },
                sage: {
                    300: "#9DAA8F",
                    400: "#7A8A6C",
                    500: "#5E6D52",
                },
                terracotta: {
                    400: "#C06744",
                },
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
                'glow': '0 0 24px rgba(218, 96, 39, 0.25)',
                'glow-lg': '0 0 40px rgba(218, 96, 39, 0.4)',
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
    plugins: [tailwindcssAnimate],
};
export default config;
