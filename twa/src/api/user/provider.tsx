"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useGetCartItemsQuery, validateUser } from '..';

import bridge from '@vkontakte/vk-bridge';
import { CustomerOverview } from '../models';
/*
interface Customer {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  is_bot?: boolean;
}
*/
interface UserContextType {
  customer: CustomerOverview | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [customer, setCustomer] = useState<CustomerOverview | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Initialize Telegram Web App and fetch user
  useEffect(() => {
    const init = (initData: string) => {
      try {

        if (initData.startsWith("tgWebAppData")) {
          initData = decodeURIComponent(initData.split("=")[1] || "");
        }

        console.log('Init data:', initData);
        validateUser(initData).then(customer => {

          setCustomer(customer);
          // Convert Telegram user to AppUser

          const tg = (window as any).Telegram?.WebApp;

          if (!tg) return;

          tg.expand();

          // Set Telegram theme parameters as CSS variables
          if (tg.themeParams) {
            document.documentElement.style.setProperty('--tg-theme-bg-color', tg.themeParams.bg_color || '#ffffff');
            document.documentElement.style.setProperty('--tg-theme-text-color', tg.themeParams.text_color || '#000000');
            document.documentElement.style.setProperty('--tg-theme-hint-color', tg.themeParams.hint_color || '#999999');
            document.documentElement.style.setProperty('--tg-theme-link-color', tg.themeParams.link_color || '#2481cc');
            document.documentElement.style.setProperty('--tg-theme-button-color', tg.themeParams.button_color || '#2481cc');
            document.documentElement.style.setProperty('--tg-theme-button-text-color', tg.themeParams.button_text_color || '#ffffff');
          }

          // Set viewport to prevent zoom on mobile
          tg.enableClosingConfirmation();
          tg.disableVerticalSwipes();

        }).catch(err => {
          console.warn('User was now validated properly', err);
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing Telegram Web App:', error);
        setIsError(true);
        setIsLoading(false);
      }
    };

    // Load Telegram Web App script if not already loaded
    if (typeof window !== 'undefined') {
      console.log('Initializing frontend app', window.location.href);
      setIsLoading(true);

      /** 
       * Try init data from URL first. It will be sent on first run.
       * Telegram sends init data after # sign while VK sends it after ? sign, so we need to check both. 
       * Also, we need to remove tgWebAppVersion parameter if it exists, because it can cause issues with validation on server side.
       */
      let initData: string | null | "" = (window.location.href.split("#")[1] || window.location.href.split("?")[1] || "").replace(/&tgWebAppVersion.*$/, "");

      if (initData) {
        // save in storage for later use, because both VK and Telegram would send them once.
        sessionStorage.setItem("initData", initData);
      }

      if (!initData) {
        // we didn't find data in URL, try to get it from storage. 
        initData = sessionStorage.getItem("initData");
      }

      if (!initData) {
        // No init data found, we cant validate user it is error. Ideally we should never get here, because Telegram should always send init data, but just in case.
        setIsLoading(false);
        return;
      }

      if (initData.indexOf("sign") === -1) { // is tg webapp
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-web-app.js';
        script.async = true;
        script.onload = () => init((window as any).Telegram?.WebApp.initData);
        script.onerror = () => {
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } else {
        bridge.send("VKWebAppInit");
        init(initData);
      }

    } else {
      // Server-side rendering, set loading to false on client side
      setIsLoading(false);
    }
  }, []);

  const refetch = () => {
    // For now, just reset and reinitialize
    setIsLoading(true);
    setIsError(false);
    // Re-initialization will happen in useEffect
  };

  useGetCartItemsQuery(customer?.id);

  const value: UserContextType = {
    customer,
    isLoading,
    isError,
    refetch,
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
};

export const useCustomer = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useCustomer must be used within a UserProvider');
  }
  return context;
};
