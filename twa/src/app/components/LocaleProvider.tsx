"use client";

import { ReactNode } from 'react';
import { NextIntlClientProvider } from 'next-intl';
import messages from '../../../messages/ru.json';

// The interface is Russian only (TWA-03); the messages are bundled, so nothing waits for them.
const locale = "ru";
// Times are shown in the device's time zone (customers are in many regions).
const timeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

interface LocaleProviderProps {
  children: ReactNode;
}

export function LocaleProvider({ children }: LocaleProviderProps) {
  return (
    <NextIntlClientProvider locale={locale} messages={messages} timeZone={timeZone}>
      {children}
    </NextIntlClientProvider>
  );
}
