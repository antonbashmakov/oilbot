import type { Metadata } from "next";
import { Plus_Jakarta_Sans } from "next/font/google";
import { Providers } from "./providers";
import {  navItems } from '@/data/products';

import "./globals.css";

import { UserDisplay } from '@/components/UserDisplay';
import { HeaderCartButton } from '@/components/HeaderCartButton';

const plusJakartaSans = Plus_Jakarta_Sans({
  variable: "--font-plus-jakarta-sans",
  subsets: ["latin"],
  weight: ["200", "300", "400", "500", "600", "700", "800"],
});

export const metadata: Metadata = {
  title: "Product Feed - Food Delivery",
  description: "Premium food delivery with the finest ingredients",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" className="light">
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
              <div className="sticky top-0 z-30 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
                <div className="flex items-center justify-between px-4 py-3">
                  <div className="flex items-center gap-2 overflow-hidden">
                    <span className="material-symbols-outlined text-primary">location_on</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-medium text-text-sub-light dark:text-text-sub-dark uppercase tracking-wide">Delivering to</span>
                      <h2 className="text-base font-bold leading-tight truncate">Downtown, Market St.</h2>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <UserDisplay />
                    <HeaderCartButton />
                  </div>
                </div>
              </div>
            {children}
            {/* Bottom Navigation */}
            <div className="fixed bottom-0 left-0 w-full z-40 bg-surface-light dark:bg-surface-dark border-t border-gray-100 dark:border-white/5 px-4 pb-6 pt-2">
              <div className="flex items-center justify-between">
                {navItems.map((item) => (
                  <a
                    key={item.id}
                    href="#"
                    className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${item.active
                      ? 'text-primary'
                      : 'text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark'
                      }`}
                  >
                    <span className={`material-symbols-outlined ${item.active ? 'filled' : ''}`}>
                      {item.icon}
                    </span>
                    <span
                      className={`text-[10px] ${item.active ? 'font-bold' : 'font-medium'}`}
                    >
                      {item.label}
                    </span>
                  </a>
                ))}
              </div>
            </div>
          </div>

        </Providers>
      </body>
    </html>
  );
}
