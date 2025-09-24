import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { SiteHeader } from "@/components/layout/SiteHeader";
import { AppProviders } from "@/app/providers";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Алабуга: Командный Центр",
  description:
    "Геймифицированная HR-платформа с визуальным конструктором кампаний и ИИ-ассистентами.",
  keywords: [
    "HR",
    "gamification",
    "nextjs",
    "ai",
    "ala-buga",
    "campaign builder",
  ],
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ru">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <AppProviders>
          <SiteHeader />
          {children}
        </AppProviders>
      </body>
    </html>
  );
}
