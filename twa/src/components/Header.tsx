"use client";

import { useRouter } from "next/navigation";
import { HeaderCartButton } from "./HeaderCartButton";
import { useCallback } from "react";
import { format, formatDate } from "date-fns";
import { useUser } from "@/api/user/provider";
import { useTranslations } from 'next-intl';

const MainHeader = () => {
  const { user } = useUser();
  const t = useTranslations('header');

  return (
    <div className="sticky top-0 z-30 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
      <div className="flex items-center justify-between px-4 py-3">
        {user?.subscription?.status === "ACTIVE" && user?.subscription?.next_payment_at && <div className="flex items-center gap-2 overflow-hidden">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400 filled">verified</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
              {t('subscription.active')}
            </span>
            <h2 className="text-base font-bold leading-tight truncate">
              {t('nextPayment')}: {format(new Date(user?.subscription?.next_payment_at), "dd MMM yyyy")}
            </h2>
          </div>
        </div>
        }
        {user?.subscription?.status === "CANCELED" && user?.subscription?.canceled_at && <div className="flex items-center gap-2 overflow-hidden">
          <span className="material-symbols-outlined text-primary">stars</span>
          <div className="flex flex-col">
            <span
              className="text-xs font-medium text-text-sub-light dark:text-text-sub-dark uppercase tracking-wide">
              {t('subscription.label')}
            </span>
            <h2 className="text-base font-bold leading-tight truncate">
              {t('canceledAt')}: {format(new Date(user?.subscription?.canceled_at), "dd MMM yyyy")}
            </h2>
          </div>
        </div>
        }
        {(!user?.subscription && ((user?.stats?.number_of_free_orders || 0) == 1 )) && <div className="flex items-center gap-2 overflow-hidden">
          <span className="material-symbols-outlined text-primary">card_giftcard</span>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-text-sub-light dark:text-text-sub-dark uppercase tracking-wide">
             {t('freePlan')}
            </span>
            <h2 className="text-base font-bold leading-tight truncate">
              {t('oneFreeOrderLeft')}
            </h2>
          </div>
        </div>
        }
        {(!user?.subscription && ((user?.stats?.number_of_free_orders || 0) < 1 )) && <div className="flex items-center gap-2 overflow-hidden">
          <span className="material-symbols-outlined text-primary">card_giftcard</span>
          <div className="flex flex-col">
            <span className="text-xs font-medium text-text-sub-light dark:text-text-sub-dark uppercase tracking-wide">
             {t('freePlan')}
            </span>
            <h2 className="text-base font-bold leading-tight truncate">
              {t('noFreeOrderLeft')}
            </h2>
          </div>
        </div>
        }
        <div className="flex items-center gap-3">
          {/*<UserDisplay />*/}
          <HeaderCartButton />
        </div>
      </div>
    </div>
  );
};

const CartHeader = () => {
  const router = useRouter();
  const t = useTranslations('header');

  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <div
      className="sticky top-0 z-50 bg-white/95 dark:bg-[#2a171a]/95 backdrop-blur-sm border-b border-gray-100 dark:border-white/10">
      <div className="flex items-center px-4 py-4 justify-between">
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-text-light dark:text-text-dark transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2
          className="text-text-light dark:text-text-dark text-lg font-bold leading-tight tracking-tight text-center">
          {t('myCart')}
        </h2>
        <div className="w-10"></div>
      </div>
    </div>
  );
};
const OrdersHeader = () => {
  const router = useRouter();
  const t = useTranslations('header');

  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <div
      className="sticky top-0 z-50 bg-white/95 dark:bg-[#2a171a]/95 backdrop-blur-sm border-b border-gray-100 dark:border-white/10">
      <div className="flex items-center px-4 py-4 justify-between">
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-text-light dark:text-text-dark transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2
          className="text-text-light dark:text-text-dark text-lg font-bold leading-tight tracking-tight text-center">
          {t('myOrders')}
        </h2>
        <div className="w-10"></div>
      </div>
    </div>
  );
};

const ProfileHeader = () => {
  const router = useRouter();
  const t = useTranslations('header');

  const handleBack = useCallback(() => {
    router.push("/");
  }, [router]);

  return (
    <div
      className="sticky top-0 z-50 bg-white/95 dark:bg-[#2a171a]/95 backdrop-blur-sm border-b border-gray-100 dark:border-white/10">
      <div className="flex items-center px-4 py-4 justify-between">
        <button
          onClick={handleBack}
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-text-light dark:text-text-dark transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2
          className="text-text-light dark:text-text-dark text-lg font-bold leading-tight tracking-tight text-center">
          {t('profile')}
        </h2>
        <div className="w-10"></div>
      </div>
    </div>
  );
};

export { MainHeader, CartHeader, OrdersHeader, ProfileHeader };
