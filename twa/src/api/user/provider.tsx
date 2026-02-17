"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useGetCartItemsQuery, validateTelegramUser } from '..';
import { CustomerOverview } from '../models';

import bridge from '@vkontakte/vk-bridge';

// Mock user object as provided in the task
const MOCK_USER: AppCustomer = {
  id: "270053857",
  is_mock: true,
  is_bot: null,
  language_code: "ru",
  last_name: "Öldenberg",
  username: "antonoldenberg",
  first_name: "Anton",// Added for consistency
  balance: {
    id: "270053857",
    owner: {
      id: "270053857"
    },
    value: 0,
    created_at: new Date(),
    updated_at: new Date(),
  },
  stats: {
    id: "270053857",
    number_of_free_orders: 0,
    number_of_orders: 0,
    number_of_canceled_orders: 0,
    number_of_fulfilled_orders: 0,
    number_of_active_orders: 0,
    number_of_paid_months: 0,
    paid_in_total: 0,
  },
  subscription: {
    status: "CANCELED",
    next_payment_at: "2025-11-23T00:00:00.000Z",
    canceled_at: "2025-11-23T00:00:00.000Z",
    fee: 300,
    id: "270053857",
  }
};

// Type for Telegram Web App user
interface TelegramUser {
  id: number;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  is_bot?: boolean;
}

// Type for our app user (combining Telegram and mock user fields)
interface AppUser {
  id: string;
  first_name?: string;
  last_name?: string;
  username?: string;
  language_code?: string;
  is_premium?: boolean;
  is_bot?: boolean | null;
  // Additional fields that might be useful
  is_mock?: boolean;
}

interface AppCustomer extends CustomerOverview {
  is_mock: boolean
}

interface UserContextType {
  user: AppCustomer | null;
  telegramUser: TelegramUser | null;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}



export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const [telegramUser, setTelegramUser] = useState<TelegramUser | null>(null);
  const [appUser, setAppUser] = useState<AppCustomer | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [isError, setIsError] = useState(false);

  // Initialize Telegram Web App and fetch user
  useEffect(() => {
    const initTelegram = (initData: string) => {
      try {

        if (initData.startsWith("tgWebAppData")) {
          initData = decodeURIComponent(initData.split("=")[1] || "");
        }

        console.log('Telegram init data:', initData);
        validateTelegramUser(initData).then(customer => {

          setTelegramUser(customer);

          // Convert Telegram user to AppUser
          setAppUser({
            ...customer,
            is_mock: false,
          });

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
          setAppUser({
            ...MOCK_USER,
            is_mock: true,
          });
        });

        setIsLoading(false);
      } catch (error) {
        console.error('Error initializing Telegram Web App:', error);
        setIsError(true);
        setIsLoading(false);

        // Fallback to mock user on error
        setAppUser({
          ...MOCK_USER,
          is_mock: true,
        });
      }
    };

    // Load Telegram Web App script if not already loaded
    if (typeof window !== 'undefined') {
      console.log('Initializing frontend app', window.location.href);

      let initData = (window.location.href.split("#")[1] || window.location.href.split("?")[1] || "").replace(/&tgWebAppVersion.*$/, "");

      if (initData.indexOf("sign") === -1) { // is tg webapp
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-web-app.js';
        script.async = true;
        script.onload = () => initTelegram((window as any).Telegram?.WebApp.initData);
        script.onerror = () => {
          console.error('Failed to load Telegram Web App script');
          // Fallback to mock user
          setAppUser({
            ...MOCK_USER,
            is_mock: true,
          });
          setIsLoading(false);
        };
        document.head.appendChild(script);
      } else {
        bridge.send("VKWebAppInit");
        initTelegram(initData);
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

  useGetCartItemsQuery(appUser?.id);

  const value: UserContextType = {
    user: appUser,
    telegramUser,
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

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
