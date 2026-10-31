"use client";

import React, { createContext, useCallback, useContext, useEffect, useState } from "react";
import { ApiConfigProvider, useApiConfig } from "@/api/apiConfigContext";
import { authenticateTelegramLogin, validateUser } from "@/api";
import { CustomerSession, TelegramLoginData } from "@/api/models";
import { createDevInitData } from "@/utils/devTelegram";

// failed: the Mini App sign-in was refused; login-failed: the browser Telegram login was refused.
export type SessionStatus = "loading" | "login-required" | "login-failed" | "failed" | "ready";

type SessionState = {
  status: SessionStatus;
  customer?: CustomerSession;
};

type CustomerSessionContext = SessionState & {
  loginWithTelegram: (user: TelegramLoginData) => void;
};

const context = createContext<CustomerSessionContext>({ status: "loading", loginWithTelegram: () => {} });

// The Telegram Login Widget data of this tab, sent again after a reload while it is accepted.
const TELEGRAM_LOGIN_KEY = "telegram-login";

const readStoredLogin = (): TelegramLoginData | undefined => {
  try {
    const raw = sessionStorage.getItem(TELEGRAM_LOGIN_KEY);
    return raw ? JSON.parse(raw) : undefined;
  } catch {
    return undefined;
  }
};

const storeLogin = (data?: TelegramLoginData) => {
  try {
    if (data) sessionStorage.setItem(TELEGRAM_LOGIN_KEY, JSON.stringify(data));
    else sessionStorage.removeItem(TELEGRAM_LOGIN_KEY);
  } catch {
    // sessionStorage unavailable: the login lasts until the next reload
  }
};

const signInWithTelegramLogin = async (data: TelegramLoginData): Promise<SessionState> => {
  try {
    const customer = await authenticateTelegramLogin(data);
    storeLogin(data);
    return { status: "ready", customer };
  } catch {
    storeLogin(undefined);
    return { status: "login-failed" };
  }
};

const signIn = async (): Promise<SessionState> => {
  const webApp = window.Telegram?.WebApp;
  const initData = webApp?.initData || await createDevInitData();

  if (initData) {
    webApp?.ready();
    webApp?.expand();

    try {
      const customer: CustomerSession = await validateUser(initData);
      return { status: "ready", customer };
    } catch {
      return { status: "failed" };
    }
  }

  // A web browser: the Telegram login of this tab, else the login button.
  const stored = readStoredLogin();
  if (!stored) return { status: "login-required" };

  const session = await signInWithTelegramLogin(stored);
  return session.status === "ready" ? session : { status: "login-required" };
};

// One sign-in per page load, also when React runs the effect twice (Strict Mode in dev).
let signInOnce: Promise<SessionState> | undefined;

/**
 * Signs the customer in with the Telegram Mini App init data, or in a web browser with the
 * Telegram Login Widget, and passes the customer token to the API client. The token lives in
 * memory only.
 */
export const CustomerSessionProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const apiConfig = useApiConfig();
  const [session, setSession] = useState<SessionState>({ status: "loading" });

  useEffect(() => {
    let active = true;

    signInOnce ??= signIn();
    signInOnce.then((result) => {
      if (active) setSession(result);
    });

    return () => {
      active = false;
    };
  }, []);

  const loginWithTelegram = useCallback((user: TelegramLoginData) => {
    setSession({ status: "loading" });
    signInWithTelegramLogin(user).then(setSession);
  }, []);

  return (
    <context.Provider value={{ ...session, loginWithTelegram }}>
      <ApiConfigProvider value={{ ...apiConfig, token: session.customer?.token }}>
        {children}
      </ApiConfigProvider>
    </context.Provider>
  );
};

export const useCustomerSession = (): CustomerSessionContext => useContext(context);
