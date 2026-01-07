"use client";

import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import { MainHeader, CartHeader, OrdersHeader, ProfileHeader } from "@/components/Header";

import "./globals.css";

import { usePathname } from "next/navigation";
import { useCallback } from "react";
import { Navigation } from "@/components/Navigation";

const PATH_TO_HEADER_MAP: Record<string, React.FC> = {
  "/cart": CartHeader,
  "/orders": OrdersHeader,
  "/profile": ProfileHeader,
  "/": MainHeader,
};

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});



export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {

  const pathname = usePathname();

  const Header = useCallback(() => {
    const HeaderComponent = PATH_TO_HEADER_MAP[pathname || "/"];
    if(!HeaderComponent) return null;
    return <HeaderComponent />;
  }, [pathname]);

  // Default locale is 'ru' as per requirements
  // The actual locale based on user's language_code will be handled by LocaleProvider
  const locale = 'ru';

  return (
    <html lang={locale} className="light">
      <head>
        {/* Material Symbols */}
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:wght,FILL@100..700,0..1&display=swap"
          rel="stylesheet"
        />
      </head>
      <body className={`${plusJakartaSans.variable} antialiased`}>
        <Providers>
          <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark font-display text-text-main-light dark:text-text-main-dark selection:bg-primary/20">
            <Header />
            {children}
            <Navigation />
          </div>
        </Providers>
      </body>
    </html>
  );
}
