import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { ClerkProvider } from "@clerk/nextjs";
import { ThemeProvider } from "@/components/theme-provider";
import { ConditionalHeader } from "@/components/conditional-header";
import { BoltBadgeFloating } from "@/components/ui/bolt-badge";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Sirpi - AI-Native DevOps Automation",
  description: "Transform any GitHub repository into production-ready infrastructure with AI-powered analysis and deployment automation.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <ClerkProvider>
      <html lang="en" suppressHydrationWarning>
        <body
          className={`${geistSans.variable} ${geistMono.variable} antialiased bg-black text-white`}
          suppressHydrationWarning
        >
          <ThemeProvider>
            <ConditionalHeader />
            <main className="relative">{children}</main>
            <BoltBadgeFloating />
          </ThemeProvider>
        </body>
      </html>
    </ClerkProvider>
  );
}