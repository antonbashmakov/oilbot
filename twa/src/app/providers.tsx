"use client";

import { ApiConfigProvider } from '@/api/apiConfigContext';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LocaleProvider } from '@/app/components/LocaleProvider';
import { CustomerSessionProvider } from '@/app/components/CustomerSessionProvider';

const queryClient = new QueryClient();

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  let baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL || "";

  return (
    <QueryClientProvider client={queryClient}>
      <ApiConfigProvider value={{
        baseUrl,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL as string
      }}>
          <CustomerSessionProvider>
            <LocaleProvider>
              {children}
            </LocaleProvider>
          </CustomerSessionProvider>
      </ApiConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
