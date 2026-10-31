"use client";

import React from "react";
import { useCustomerSession } from "./CustomerSessionProvider";

const Notice = ({ icon, text }: { icon: string; text: string }) => (
  <main className="flex-1 w-full max-w-chat-max-width mx-auto pt-20 px-layout-margin-mobile flex flex-col items-center justify-center gap-3 text-center">
    <span className="material-symbols-outlined text-secondary text-[32px]">{icon}</span>
    <p className="font-body-md text-on-surface">{text}</p>
  </main>
);

/**
 * Shows its children only after the customer has signed in through Telegram.
 */
const SessionGate: React.FC<React.PropsWithChildren> = ({ children }) => {
  const { status } = useCustomerSession();

  if (status === "loading") {
    return <Notice icon="hourglass_empty" text="Загрузка…" />;
  }

  if (status === "outside-telegram") {
    return <Notice icon="send" text="Откройте приложение в Telegram." />;
  }

  if (status === "failed") {
    return <Notice icon="error" text="Не удалось войти. Закройте и откройте приложение снова." />;
  }

  return <>{children}</>;
};

export default SessionGate;
