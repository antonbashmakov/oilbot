"use client";

import { useRouter } from "next/navigation";
import { HeaderCartButton } from "./HeaderCartButton";
import { format } from "date-fns";
import { useTranslations } from 'next-intl';
import ShareButton from "./ShareButton";
import Link from "next/link";
import { useCustomer } from "@/api/user/provider";

const MainHeader = () => {
  const { customer, isLoading } = useCustomer();
  const t = useTranslations('header');

  return (
    <div className="sticky top-0 z-30 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
      <div className="flex items-center justify-between px-4 py-3">
        {!customer && !isLoading && <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex items-center gap-2 overflow-hidden bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/50">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 filled">warning</span>
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-amber-800 dark:text-amber-200 leading-tight truncate">{t('noUser')}</h2>
            </div>
          </div>
        </div>
        }
        {!customer && isLoading && <div className="flex items-center gap-2 overflow-hidden">
          <div className="flex items-center gap-2 overflow-hidden bg-amber-50 dark:bg-amber-900/20 px-3 py-1.5 rounded-lg border border-amber-200 dark:border-amber-800/50">
            <span className="material-symbols-outlined text-amber-600 dark:text-amber-400 filled">warning</span>
            <div className="flex flex-col">
              <h2 className="text-sm font-bold text-amber-800 dark:text-amber-200 leading-tight truncate">{t('loadingUser')}</h2>
            </div>
          </div>
        </div>
        }
        {customer && customer.subscription?.status === "ACTIVE" && customer?.subscription?.next_payment_at && <div className="flex items-center gap-2 overflow-hidden">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400 filled">verified</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">
              {t('subscription.active')}
            </span>
            <h2 className="text-base font-bold leading-tight truncate">
              {t('nextPayment')}: {format(new Date(customer?.subscription?.next_payment_at), "dd MMM yyyy")}
            </h2>
          </div>
        </div>
        }
        {(customer && customer.subscription?.status === "CANCELED" || customer?.subscription?.status === "CANCELED_PAYMENT_OVERDUE") && customer?.subscription?.canceled_at && <div className="flex items-center gap-2 overflow-hidden">
          <span className="material-symbols-outlined text-primary">stars</span>
          <div className="flex flex-col">
            <span
              className="text-xs font-medium text-text-sub-light dark:text-text-sub-dark uppercase tracking-wide">
              {t('subscription.label')}
            </span>
            <h2 className="text-base font-bold leading-tight truncate">
              {t('canceledAt')}: {format(new Date(customer?.subscription?.canceled_at), "dd MMM yyyy")}
            </h2>
          </div>
        </div>
        }
        {(customer && !customer.subscription && ((customer?.stats?.number_of_free_orders || 0) == 1)) && <div className="flex items-center gap-2 overflow-hidden">
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
        {(customer && !customer.subscription && ((customer?.stats?.number_of_free_orders || 0) < 1)) && <div className="flex items-center gap-2 overflow-hidden">
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
        {customer && <div className="flex items-center gap-3">
          {/*<UserDisplay />*/}
          <HeaderCartButton />
        </div>}
      </div>
    </div>
  );
};
const HeaderWithShareButton = () => {

  return (
    <div className="flex items-center justify-between align-center bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
      <Link
        href="/"
        className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-text-light dark:text-text-dark transition-colors"
      >
        <span className="material-symbols-outlined">arrow_back_ios_new</span>
      </Link>
      <div className="flex items-center justify-between px-4 py-3">

        <div className="flex items-center gap-3">
          {/*<UserDisplay />*/}
          <ShareButton />
          <HeaderCartButton />
        </div>
      </div>
    </div>
  );
};

const Header = ({ children }: { children: React.ReactNode }) => {
  return (
    <div
      className="sticky top-0 z-50 bg-white/95 dark:bg-[#2a171a]/95 backdrop-blur-sm border-b border-gray-100 dark:border-white/10">
      <div className="flex items-center px-4 py-4 justify-between">
        <Link
          href="/"
          className="flex items-center justify-center w-10 h-10 rounded-full hover:bg-gray-100 dark:hover:bg-white/10 text-text-light dark:text-text-dark transition-colors"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </Link>
        {children}
        <div className="w-10"></div>
      </div>
    </div>
  );
};

const CartHeader = () => {
  const router = useRouter();
  const t = useTranslations('header');

  return (<Header>
    <h2
      className="text-text-light dark:text-text-dark text-lg font-bold leading-tight tracking-tight text-center">
      {t('myCart')}
    </h2>
  </Header>);
};

const OrdersHeader = () => {
  const router = useRouter();
  const t = useTranslations('header');

  return (
    <Header>
      <h2
        className="text-text-light dark:text-text-dark text-lg font-bold leading-tight tracking-tight text-center">
        {t('myOrders')}
      </h2>
    </Header>
  );
};

const ProfileHeader = () => {
  const router = useRouter();
  const t = useTranslations('header');

  return (
    <Header>
      <h2
        className="text-text-light dark:text-text-dark text-lg font-bold leading-tight tracking-tight text-center">
        {t('profile')}
      </h2>
    </Header>
  );
};


export { MainHeader, CartHeader, OrdersHeader, ProfileHeader, HeaderWithShareButton };
