"use client";

import { ReactNode, useEffect, useState } from 'react';
import { NextIntlClientProvider } from 'next-intl';
// import { useCustomer } from '@/api/user/provider';

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  // const { customer } = useCustomer();
  const [messages, setMessages] = useState<Record<string, any> | null>(null);
  
  // Determine locale from user's language_code
  const locale =  "ru";//customer?.language_code || "ru";
  
  useEffect(() => {
    // Dynamically load messages based on locale
    const loadMessages = async () => {
      try {
        const module = await import(`../../../messages/${locale}.json`);
        setMessages(module.default);
      } catch (error) {
        console.error('Failed to load messages:', error);
        // Fallback to empty messages
        setMessages({});
      }
    };
    
    loadMessages();
  }, [locale]);
  
  // Don't render until messages are loaded
  if (!messages) {
    return null;
  }
  
  return (
    <NextIntlClientProvider locale={locale} messages={messages}>
      {children}
    </NextIntlClientProvider>
  );
}
