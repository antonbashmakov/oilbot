"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiConfigProvider, useApiConfig } from "@/api/apiConfigContext";
import { validateUser } from "@/api";
import { CustomerSession } from "@/api/models";
import { createDevInitData } from "@/utils/devTelegram";

export type SessionStatus = "loading" | "outside-telegram" | "failed" | "ready";

type CustomerSessionContext = {
  status: SessionStatus;
  customer?: CustomerSession;
};

const context = createContext<CustomerSessionContext>({ status: "loading" });

const signIn = async (): Promise<CustomerSessionContext> => {
  const webApp = window.Telegram?.WebApp;
  const initData = webApp?.initData || await createDevInitData();

  if (!initData) {
    return { status: "outside-telegram" };
  }

  webApp?.ready();
  webApp?.expand();

  try {
    const customer: CustomerSession = await validateUser(initData);
    return { status: "ready", customer };
  } catch {
    return { status: "failed" };
  }
};

// One sign-in per page load, also when React runs the effect twice (Strict Mode in dev).
let signInOnce: Promise<CustomerSessionContext> | undefined;

/**
 * Signs the customer in with the Telegram Mini App init data and passes the customer token to the
 * API client. The token lives in memory only.
 */
export const CustomerSessionProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const apiConfig = useApiConfig();
  const [session, setSession] = useState<CustomerSessionContext>({ status: "loading" });

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

  return (
    <context.Provider value={session}>
      <ApiConfigProvider value={{ ...apiConfig, token: session.customer?.token }}>
        {children}
      </ApiConfigProvider>
    </context.Provider>
  );
};

export const useCustomerSession = (): CustomerSessionContext => useContext(context);
