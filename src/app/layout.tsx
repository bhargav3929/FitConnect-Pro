import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Toaster } from "sonner";
import { cn } from "@/lib/utils";
import "./globals.css";
import { LayoutContent } from "@/components/layout/LayoutContent";
import { SitePasswordGate } from "@/components/layout/SitePasswordGate";

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
      <body className={cn("min-h-screen font-sans antialiased", plusJakartaSans.variable)}>
        <SitePasswordGate>
          <LayoutContent>{children}</LayoutContent>
        </SitePasswordGate>
        <Toaster richColors position="top-right" closeButton />
      </body>
    </html>
  );
}
