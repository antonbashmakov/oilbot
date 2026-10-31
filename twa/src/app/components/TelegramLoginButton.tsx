"use client";

import { useEffect, useRef } from "react";

type TelegramLoginButtonProps = {
  botUsername: string;
  onAuth: (user: TelegramLoginUser) => void;
};

/**
 * The Telegram Login Widget (core.telegram.org/widgets/login-legacy) of the bot. It works only on
 * the domain linked to the bot with /setdomain in @BotFather.
 */
const TelegramLoginButton = ({ botUsername, onAuth }: TelegramLoginButtonProps) => {
  const container = useRef<HTMLDivElement>(null);
  const onAuthRef = useRef(onAuth);

  useEffect(() => {
    onAuthRef.current = onAuth;
  }, [onAuth]);

  useEffect(() => {
    const element = container.current;
    if (!element) return;

    window.onTelegramAuth = (user) => onAuthRef.current(user);

    const script = document.createElement("script");
    script.async = true;
    script.src = "https://telegram.org/js/telegram-widget.js?22";
    script.setAttribute("data-telegram-login", botUsername);
    script.setAttribute("data-size", "large");
    script.setAttribute("data-onauth", "onTelegramAuth(user)");
    element.appendChild(script);

    return () => {
      element.innerHTML = "";
      delete window.onTelegramAuth;
    };
  }, [botUsername]);

  return <div ref={container} />;
};

export default TelegramLoginButton;
