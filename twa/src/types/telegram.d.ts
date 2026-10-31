// The part of the Telegram Mini App API (https://telegram.org/js/telegram-web-app.js) this app uses.
interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
}

// The user the Telegram Login Widget (telegram-widget.js) passes to its data-onauth callback.
interface TelegramLoginUser {
  id: number;
  first_name: string;
  last_name?: string;
  username?: string;
  photo_url?: string;
  auth_date: number;
  hash: string;
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
  onTelegramAuth?: (user: TelegramLoginUser) => void;
}
