"use client";

import { ApiConfigProvider } from '@/api/apiConfigContext';
import { UserProvider } from '@/api/user/provider';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactQueryDevtools } from '@tanstack/react-query-devtools';
import { LocaleProvider } from '@/components/LocaleProvider';

const queryClient = new QueryClient();

export const Providers: React.FC<React.PropsWithChildren> = ({ children }) => {
  let baseUrl = process.env.NEXT_PUBLIC_BASE_API_URL || "";

  return (
    <QueryClientProvider client={queryClient}>
      <ApiConfigProvider value={{
        baseUrl,
        siteUrl: process.env.NEXT_PUBLIC_SITE_URL as string
      }}>
        <UserProvider>
          <LocaleProvider>
            {children}
          </LocaleProvider>
        </UserProvider>
      </ApiConfigProvider>
      <ReactQueryDevtools initialIsOpen={false} />
    </QueryClientProvider>
  );
};
