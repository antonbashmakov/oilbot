"use client";

import React from "react";
import { useCustomerSession } from "./CustomerSessionProvider";
import TelegramLoginButton from "./TelegramLoginButton";

const Notice = ({ icon, text, children }: React.PropsWithChildren<{ icon: string; text: string }>) => (
  <main className="flex-1 w-full max-w-chat-max-width mx-auto pt-20 px-layout-margin-mobile flex flex-col items-center justify-center gap-3 text-center">
    <span className="material-symbols-outlined text-secondary text-[32px]">{icon}</span>
    <p className="font-body-md text-on-surface">{text}</p>
    {children}
  </main>
);

const BOT_USERNAME = process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME;

/**
 * Shows its children only after the customer has signed in through Telegram: in the Mini App
 * automatically, in a web browser with the Telegram login button.
 */
const SessionGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { status, loginWithTelegram } = useCustomerSession();

  if (status === "loading") {
    return <Notice icon="hourglass_empty" text="Загрузка…" />;
  }

  if (status === "login-required" || status === "login-failed") {
    const text = status === "login-failed" ?
      "Не удалось войти через Telegram. Попробуйте ещё раз." :
      "Войдите через Telegram, чтобы продолжить.";

    return (
      <Notice icon="send" text={text}>
        {BOT_USERNAME ?
          <TelegramLoginButton botUsername={BOT_USERNAME} onAuth={loginWithTelegram} /> :
          <p className="font-label-sm text-on-surface-variant">Вход не настроен: задайте NEXT_PUBLIC_TELEGRAM_BOT_USERNAME.</p>}
      </Notice>
    );
  }

  if (status === "failed") {
    return <Notice icon="error" text="Не удалось войти. Закройте и откройте приложение снова." />;
  }

  return <>{children}</>;
};

export default SessionGate;
