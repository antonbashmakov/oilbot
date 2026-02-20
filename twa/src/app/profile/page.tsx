"use client";

import { useGetCustomerOverviewQuery } from '@/api';
import { useCustomer } from '@/api/user/provider';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';

export default function ProfilePage() {
  const { customer } = useCustomer();
  const { data, isLoading, error } = useGetCustomerOverviewQuery(customer?.id);
  const t = useTranslations('common');
  const tProfile = useTranslations('profile');

  // Handle loading state
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center">
          <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
          <p className="mt-4 text-text-sub-light dark:text-text-sub-dark">{t('loading')}</p>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-500">
          <span className="material-symbols-outlined text-4xl">error</span>
          <p className="mt-4">{t('error')}. {t('retry')}.</p>
        </div>
      </div>
    );
  }

  // Format subscription date if available
  const formatSubscriptionDate = (dateString?: string) => {
    if (!dateString) return 'N/A';
    try {
      return format(new Date(dateString), 'dd MMM yyyy');
    } catch {
      return dateString;
    }
  };

  // Get subscription status display
  const getSubscriptionStatus = () => {
    if (!customer?.subscription) return {
      text: tProfile('subscriptionStatus.noSubscription'),
      color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
    };

    const status = customer.subscription.status;
    switch (status) {
      case 'ACTIVE':
        return {
          text: tProfile('subscriptionStatus.active'),
          color: 'bg-green-100 dark:bg-green-900/30 text-green-700 dark:text-green-400'
        };
      case 'PENDING':
        return {
          text: tProfile('subscriptionStatus.pending'),
          color: 'bg-yellow-100 dark:bg-yellow-900/30 text-yellow-700 dark:text-yellow-400'
        };
      case 'CANCELED':
        return {
          text: tProfile('subscriptionStatus.canceled'),
          color: 'bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-400'
        };
      default:
        return {
          text: status,
          color: 'bg-gray-100 dark:bg-gray-900/30 text-gray-700 dark:text-gray-400'
        };
    }
  };

  const subscriptionStatus = getSubscriptionStatus();

  return (
    <>


      {/* Profile Header */}
      <div className="flex flex-col items-center pt-2 pb-6 px-4">
        <div className="relative mb-4">
          <div
            className="bg-center bg-no-repeat bg-cover rounded-full h-28 w-28 border-4 border-white dark:border-surface-dark shadow-lg"
            style={{
              backgroundImage: `url("https://lh3.googleusercontent.com/aida-public/AB6AXuB0me9zfigq1EnW0SSF8rDsQ8gvtbuzKSMPpgbhuk-kBNdBbX1pGIesLjA6rrY3dT1y9Mdrlz-okCtzz2hVN4GPk6Ke2TYurdG1PvhrHOrxXnhH1A2sdMLZKpKqDK8SKyBvPa7DPCclwZnf5-7CgCICZUZ2ESVYDtlc7uamSwBHNc9bqnc6iL_ViebeEP0LEO-LPJrpIyoB8yT5F_lTZAzFu1BMUbQBO9YzAH7q6K3Bq5WiMLe7t_JSFl9aYUygGkKA2T0px0xH8OzK")`,
              backgroundColor: '#f0f0f0'
            }}
            aria-label={tProfile('portraitOf', { name: customer?.first_name || 'User' })}
          />
          {/*<div className="absolute bottom-0 right-0 bg-primary text-white rounded-full p-1.5 border-2 border-white dark:border-surface-dark flex items-center justify-center">
            <span className="material-symbols-outlined text-[16px]">edit</span>
          </div>*/}
        </div>
        <div className="text-center">
          <h1 className="text-2xl font-bold text-gray-900 dark:text-white tracking-tight">
            {customer?.first_name || ''} {customer?.last_name || ''}
          </h1>
          <p className="text-gray-500 dark:text-gray-400 text-sm font-medium mt-1">
            @{customer?.username || tProfile('customer')} • {tProfile('memberSince', { year: '2023' })}
          </p>
        </div>
      </div>


      {/* Wallet / Stats Card */}
      <div className="px-4 mb-6">
        <div className="flex flex-col gap-1 rounded-2xl bg-surface-light dark:bg-surface-dark p-6 shadow-sm border border-gray-100 dark:border-gray-800">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-gray-400">account_balance_wallet</span>
              <p className="text-gray-500 dark:text-gray-400 text-sm font-semibold uppercase tracking-wider">{tProfile('storeCredit')}</p>
            </div>
          </div>
          <div className="flex items-baseline justify-between">
            <p className="text-primary text-4xl font-extrabold tracking-tight">
              {customer?.balance?.value ? `${customer.balance.value.toFixed(2)} ₽` : '0.00 ₽'}
            </p>
            {/*<button className="bg-primary/10 hover:bg-primary/20 text-primary px-4 py-2 rounded-full text-sm font-bold transition-colors flex items-center gap-1">
              <span className="material-symbols-outlined text-[18px]">add</span>
              Add Funds
            </button>*/}
          </div>
        </div>
      </div>

      {/* Subscription Status */}
      {customer?.subscription && (
        <div className="px-4 mb-6">
          <h3 className="text-base font-bold text-gray-900 dark:text-white mb-3 px-1">{t('subscription')}</h3>
          <div className="rounded-2xl bg-surface-light dark:bg-surface-dark p-5 shadow-sm border border-gray-100 dark:border-gray-800 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex gap-4">
              <div className="flex-shrink-0 h-12 w-12 rounded-xl bg-gradient-to-br from-orange-100 to-primary/20 flex items-center justify-center text-primary">
                <span className="material-symbols-outlined text-2xl">workspace_premium</span>
              </div>
              <div className="flex flex-col">
                <div className="flex items-center gap-2">
                  <p className="text-gray-900 dark:text-white text-base font-bold">{tProfile('gourmetClub')}</p>
                  <span className={`${subscriptionStatus.color} text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wide`}>
                    {subscriptionStatus.text}
                  </span>
                </div>
                <p className="text-gray-500 dark:text-gray-400 text-sm mt-0.5">
                  {customer.subscription.next_payment_at
                    ? `${tProfile('nextBilling')} ${formatSubscriptionDate(customer.subscription.next_payment_at)}`
                    : tProfile('noActiveSubscription')}
                </p>
              </div>
            </div>
            { customer.subscription.status === 'ACTIVE' && <div className="pt-2 border-t border-gray-50 dark:border-gray-800">
              <a className="flex items-center justify-center gap-2 w-full bg-gray-50 dark:bg-gray-800/50 hover:bg-gray-100 dark:hover:bg-gray-800 text-gray-700 dark:text-gray-300 py-3 px-4 rounded-xl transition-all active:scale-[0.98]" href="https://t.me/antonoldenberg">
                <span className="material-symbols-outlined text-[20px] text-sky-500">chat</span>
                <span className="font-bold text-sm">{tProfile('cancelSubscription')}</span>
              </a>
              <p className="text-[12px] text-gray-400 dark:text-gray-500 text-center mt-3 leading-relaxed">
                {tProfile('cancelSubscriptionHelp')} <span className="text-primary font-medium">@antonoldenberg</span>
              </p>
            </div>}
            {/*<a className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-1 self-start sm:self-center hover:text-primary transition-colors" href="#">
              Manage
              <span className="material-symbols-outlined text-[18px]">arrow_forward</span>
            </a>*/}
          </div>
        </div>
      )}

      {/* Account Settings List 
      <div className="px-4 flex flex-col gap-3">
        <h3 className="text-base font-bold text-gray-900 dark:text-white px-1">Account Settings</h3>
        
        <button className="group w-full flex items-center justify-between bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all active:scale-[0.99]">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white size-10 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined">person</span>
            </div>
            <span className="text-gray-900 dark:text-white text-base font-medium">Personal Details</span>
          </div>
          <span className="material-symbols-outlined text-gray-400">chevron_right</span>
        </button>

        <button className="group w-full flex items-center justify-between bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all active:scale-[0.99]">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white size-10 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined">location_on</span>
            </div>
            <span className="text-gray-900 dark:text-white text-base font-medium">Address Book</span>
          </div>
          <span className="material-symbols-outlined text-gray-400">chevron_right</span>
        </button>

        <button className="group w-full flex items-center justify-between bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all active:scale-[0.99]">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white size-10 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined">credit_card</span>
            </div>
            <span className="text-gray-900 dark:text-white text-base font-medium">Payment Methods</span>
          </div>
          <span className="material-symbols-outlined text-gray-400">chevron_right</span>
        </button>

        <Link href="/orders" className="group w-full flex items-center justify-between bg-surface-light dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-800 transition-all active:scale-[0.99]">
          <div className="flex items-center gap-4">
            <div className="flex items-center justify-center rounded-lg bg-gray-50 dark:bg-gray-800 text-gray-900 dark:text-white size-10 group-hover:bg-primary/10 group-hover:text-primary transition-colors">
              <span className="material-symbols-outlined">receipt_long</span>
            </div>
            <span className="text-gray-900 dark:text-white text-base font-medium">Order History</span>
          </div>
          <span className="material-symbols-outlined text-gray-400">chevron_right</span>
        </Link>

        <button className="w-full flex items-center justify-center gap-2 mt-4 p-4 rounded-xl border border-transparent text-primary dark:text-red-400 font-bold hover:bg-primary/5 active:bg-primary/10 transition-colors">
          <span className="material-symbols-outlined">logout</span>
          {t('logout')}
        </button>
      </div>
      */}
    </>
  );
}
