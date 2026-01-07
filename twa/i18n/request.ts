import { getRequestConfig } from 'next-intl/server';

// Define supported locales
export const locales = ['ru', 'en'] as const;
export type Locale = (typeof locales)[number];
export const defaultLocale: Locale = 'ru';

export default getRequestConfig(async ({ requestLocale }) => {
  // Use the request locale or default to 'ru'
  const resolvedRequestLocale = await requestLocale;
  let locale = resolvedRequestLocale as Locale | undefined;
  
  if (!locale || !locales.includes(locale)) {
    locale = defaultLocale;
  }

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
