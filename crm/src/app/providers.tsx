"use client";

import { ChakraProvider } from "@chakra-ui/react";
import { theme } from "@/theme";
import { NextIntlClientProvider } from 'next-intl';
import { useEffect, useState } from 'react';

import { ApiConfigProvider } from '@/api/apiConfigContext';
import { UserProvider } from '@/api/user/provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DndProvider } from 'react-dnd';
import { HTML5Backend } from 'react-dnd-html5-backend';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';

// Import translation files statically
import enMessages from '../messages/en.json';
import ruMessages from '../messages/ru.json';
import svMessages from '../messages/sv.json';

const queryClient = new QueryClient();

const messagesMap = {
  en: enMessages,
  ru: ruMessages,
  "sv-se": svMessages,
};

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [locale, setLocale] = useState<string>('en');

  useEffect(() => {
    // Get locale from cookie
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] || 'en';

    setLocale(cookieLocale);
  }, []);

  let baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL || "wrong";

  return (
    <ChakraProvider value={theme}>
      <QueryClientProvider client={queryClient}>
        <ApiConfigProvider value={{
          baseUrl,
          siteUrl: process.env.NEXT_PUBLIC_SITE_URL as string
        }}>
          <DndProvider backend={HTML5Backend}>

            <UserProvider>
              <NextIntlClientProvider locale={locale} messages={messagesMap[locale as keyof typeof messagesMap] || messagesMap.en}>

                {children}
              </NextIntlClientProvider>

            </UserProvider>
          </DndProvider>
        </ApiConfigProvider>
        <ReactQueryDevtools initialIsOpen={false} />
      </QueryClientProvider>
    </ChakraProvider>
  );
};
