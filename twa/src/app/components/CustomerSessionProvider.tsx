"use client";

import React, { createContext, useContext, useEffect, useState } from "react";
import { ApiConfigProvider, useApiConfig } from "@/api/apiConfigContext";
import { validateUser } from "@/api";
import { CustomerSession } from "@/api/models";

export type SessionStatus = "loading" | "outside-telegram" | "failed" | "ready";

type CustomerSessionContext = {
  status: SessionStatus;
  customer?: CustomerSession;
};

const context = createContext<CustomerSessionContext>({ status: "loading" });

const signIn = async (): Promise<CustomerSessionContext> => {
  const webApp = window.Telegram?.WebApp;

  if (!webApp?.initData) {
    return { status: "outside-telegram" };
  }

  webApp.ready();
  webApp.expand();

  try {
    const customer: CustomerSession = await validateUser(webApp.initData);
    return { status: "ready", customer };
  } catch {
    return { status: "failed" };
  }
};

/**
 * Signs the customer in with the Telegram Mini App init data and passes the customer token to the
 * API client. The token lives in memory only.
 */
export const CustomerSessionProvider: React.FC<React.PropsWithChildren> = ({ children }) => {
  const apiConfig = useApiConfig();
  const [session, setSession] = useState<CustomerSessionContext>({ status: "loading" });

  useEffect(() => {
    let active = true;

    signIn().then((result) => {
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
