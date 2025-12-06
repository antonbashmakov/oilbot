import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import { Providers } from "./providers";
import "./globals.css";
import { ColorModeProvider, DarkMode } from "@/components/ui/color-mode";
import TopBar from "@/components/ui/TopBar";
import AuthWrapper from "./AuthWrapper";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "CRM Dashboard",
  description: "Delivery and order management dashboard",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} antialiased`}
      >
        <Providers>
          <DarkMode>
            <AuthWrapper>
              <TopBar />
              {children}
            </AuthWrapper>
          </DarkMode>
        </Providers>
      </body>
    </html>
  );
}
