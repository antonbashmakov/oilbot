import { getRequestConfig } from 'next-intl/server';
import { cookies } from 'next/headers';

export default getRequestConfig(async () => {
  // Provide a static locale, detect locale based on the user's preferences
  // or based on the cookie
  const cookieStore = await cookies();
  const locale = cookieStore.get('locale')?.value || 'en';

  return {
    locale,
    messages: (await import(`../messages/${locale}.json`)).default
  };
});
