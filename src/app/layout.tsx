import type { Metadata } from "next";
import { DM_Serif_Display, Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import AuthProvider from "@/components/layout/AuthProvider";
import { cn } from "@/lib/utils";
import "./globals.css";
import { LayoutContent } from "@/components/layout/LayoutContent";

const dmSerifDisplay = DM_Serif_Display({
  weight: "400",
  subsets: ["latin"],
  variable: "--font-display",
});

const plusJakartaSans = Plus_Jakarta_Sans({
  subsets: ["latin"],
  weight: ["300", "400", "500", "700"],
  variable: "--font-sans",
});

export const metadata: Metadata = {
  title: "SOL Pilates Studio",
  description: "Premium Pilates class booking platform",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={cn("min-h-screen bg-background font-sans antialiased", dmSerifDisplay.variable, plusJakartaSans.variable)}>
        <AuthProvider>
          <LayoutContent>{children}</LayoutContent>
          <Toaster richColors position="top-right" closeButton />
        </AuthProvider>
      </body>
    </html>
  );
}
