"use client";

import React, { createContext, useContext, ReactNode, useState, useEffect } from 'react';
import { useGetCartItemsQuery, validateTelegramUser } from '..';
import { CustomerOverview } from '../models';
import { useRouter } from "next/navigation";

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
  const router = useRouter()

  // Initialize Telegram Web App and fetch user
  useEffect(() => {
    const initTelegram = () => {
      try {

        console.log('window.location.href', window.location.href);
        //const initData =  (window as any).Telegram?.WebApp ? (window as any).Telegram?.WebApp.initData : window.location.href.split("?")[1] || "";
        let initData =  (window.location.href.split("#")[1] || window.location.href.split("?")[1] || "").replace(/&tgWebAppVersion.*$/, "");
        //let initData = "tgWebAppData=user%3D%257B%2522id%2522%253A270053857%252C%2522first_name%2522%253A%2522Anton%2522%252C%2522last_name%2522%253A%2522%25C3%2596ldenberg%2522%252C%2522username%2522%253A%2522antonoldenberg%2522%252C%2522language_code%2522%253A%2522en%2522%252C%2522is_premium%2522%253Atrue%252C%2522allows_write_to_pm%2522%253Atrue%252C%2522photo_url%2522%253A%2522https%253A%255C%252F%255C%252Ft.me%255C%252Fi%255C%252Fuserpic%255C%252F320%255C%252Fqp4hk15qeVGYzV4WX9tt5JoE6IIf3iBpXWT80kJC5to.svg%2522%257D%26chat_instance%3D-2470516004042899611%26chat_type%3Dprivate%26auth_date%3D1771352597%26signature%3DucELZrU9XEXK4JQpnnkIQYpnF6e_csQokMErg7yAWj-Y9vBGeM6PV3Wvq4UhjotYXRJ-8lV0Udz3S_ajGMEGAQ%26hash%3D2d5f168ed2097271a8743fc7c612ef2e9d8c47913181092e62e67d42dde117e0&tgWebAppVersion";

        if (initData.startsWith("tgWebAppData")) {
          initData = decodeURIComponent(initData.split("=")[1] || "");
        }

        console.log('Telegram init data:', initData);
        // Check if we're in a Telegram Web App

        validateTelegramUser(initData).then(customer => {
          // Expand the app to full height

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


        /*
        const startParam = tg.initDataUnsafe?.start_param;
        // const startParam = "JTdCJTIydHlwZSUyMiUzQSUyMnBhdGglMjIlMkMlMjJ2YWx1ZSUyMiUzQSUyMiUyRml0ZW1zJTJGZWZlMTAxOTMtN2JmOC00NTc4LTlmMjctNDI3ZGMzNDI3MmEyJTIyJTdE";
        if (startParam && !sessionStorage.getItem(startParam)) {
          const json = JSON.parse(decodeURIComponent(atob(startParam)));
          sessionStorage.setItem(startParam, "1");
          if (json.type === "path") {
            return router.replace(json.value);
          }
        }
        */


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
      console.log('Initializing VK Bridge', window.location.href);
      bridge.send("VKWebAppInit");
      initTelegram();
      /*
      if (!(window as any).Telegram?.WebApp) {
        const script = document.createElement('script');
        script.src = 'https://telegram.org/js/telegram-web-app.js';
        script.async = true;
        script.onload = initTelegram;
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
        initTelegram();
      }
      */
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
