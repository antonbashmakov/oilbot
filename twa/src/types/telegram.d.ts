// The part of the Telegram Mini App API (https://telegram.org/js/telegram-web-app.js) this app uses.
interface TelegramWebApp {
  initData: string;
  ready: () => void;
  expand: () => void;
}

interface Window {
  Telegram?: {
    WebApp?: TelegramWebApp;
  };
}
