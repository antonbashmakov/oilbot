"use client";

import { useEffect, useState } from 'react';

import { ApiConfigProvider } from '@/api/apiConfigContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';



const queryClient = new QueryClient();


export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  const [locale, setLocale] = useState<string>('ru');

  useEffect(() => {
    // Get locale from cookie
    const cookieLocale = document.cookie
      .split('; ')
      .find(row => row.startsWith('locale='))
      ?.split('=')[1] || 'ru';

    setLocale(cookieLocale);
  }, []);


  let baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL || "";

  return (
    <QueryClientProvider client={queryClient}>
      <ApiConfigProvider value={{
        baseUrl,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL as string
      }}>
        {children}
      </ApiConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
