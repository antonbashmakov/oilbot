"use client";

import { useCreateSubscription } from "@/api";
import { useUser } from "@/api/user/provider";
import { useState } from "react";
import { useTranslations } from 'next-intl';

export default function SubscriptionPage() {
  const { user } = useUser();
  const createSubscriptionMutation = useCreateSubscription(user?.id);
  const [isProcessing, setIsProcessing] = useState(false);
  const [isChecked, setIsChecked] = useState(false);
  const t = useTranslations('subscription');

  const handleClose = () => {
    window.location.href = "/";
  };

  const handleSubscribe = async () => {
    if (!user?.id) {
      alert(t('loginRequired'));
      return;
    }

    if (isProcessing) return;

    setIsProcessing(true);
    try {
      // Generate a unique idempotency key
      const idempotencyKey = `subscription-${user.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const res: any = await createSubscriptionMutation.mutateAsync({ idempotencyKey });

      // Check if response has paymentUrl (similar to checkout flow)
      if (res.paymentUrl && typeof window !== 'undefined') {
        window.location.href = res.paymentUrl;
      }
    } catch (error: any) {
      console.error('Subscription failed:', error);
      // Show error message
      const errorMessage = error?.error?.message || error?.message || t('subscriptionFailed');
      alert(`${t('error')}: ${errorMessage}`);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <>
      {/* Close button */}
      <div className="absolute top-0 right-0 z-20 p-6">
        <button
          onClick={handleClose}
          className="flex items-center justify-center w-10 h-10 rounded-full bg-gray-200/50 dark:bg-white/10 backdrop-blur-md text-gray-900 dark:text-white transition-colors hover:bg-gray-300/50 dark:hover:bg-white/20"
        >
          <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
            close
          </span>
        </button>
      </div>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-8 pt-8 pb-6 text-center">
        {/* Premium icon */}
        <div className="w-24 h-24 rounded-full bg-primary/10 flex items-center justify-center mb-8 text-primary shadow-sm">
          <span className="material-symbols-outlined" style={{ fontSize: "48px" }}>
            workspace_premium
          </span>
        </div>

        {/* Title */}
        <h2 className="text-gray-900 dark:text-white text-3xl font-extrabold leading-tight tracking-tight mb-4">
          {t('title')}
        </h2>

        {/* Description */}
        <p className="text-gray-500 dark:text-gray-400 text-base font-medium leading-relaxed mb-10 max-w-xs mx-auto">
          {t('description')}
        </p>

        {/* Features list */}
        <div className="w-full max-w-xs space-y-5 mb-8 text-left">
          {/* Feature 1: Free Priority Delivery */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                local_shipping
              </span>
            </div>
            <div>
              <span className="block text-gray-900 dark:text-white font-bold text-sm">
                {t('features.freeDelivery.title')}
              </span>
              <span className="block text-gray-500 dark:text-gray-400 text-xs">
                {t('features.freeDelivery.description')}
              </span>
            </div>
          </div>

          {/* Feature 2: Exclusive Cuts */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                restaurant_menu
              </span>
            </div>
            <div>
              <span className="block text-gray-900 dark:text-white font-bold text-sm">
                {t('features.exclusiveCuts.title')}
              </span>
              <span className="block text-gray-500 dark:text-gray-400 text-xs">
                {t('features.exclusiveCuts.description')}
              </span>
            </div>
          </div>

          {/* Feature 3: Member-Only Prices */}
          <div className="flex items-center gap-4">
            <div className="flex-shrink-0 text-primary">
              <span className="material-symbols-outlined" style={{ fontSize: "24px" }}>
                sell
              </span>
            </div>
            <div>
              <span className="block text-gray-900 dark:text-white font-bold text-sm">
                {t('features.memberPrices.title')}
              </span>
              <span className="block text-gray-500 dark:text-gray-400 text-xs">
                {t('features.memberPrices.description')}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with subscribe button */}
      <div className="w-full px-8 pb-10 mt-auto">

        <div className="flex flex-col gap-6">
          <label className="flex items-start gap-3 cursor-pointer group">
            <div className="relative flex items-center pt-0.5">
              <input
                className="peer h-5 w-5 rounded border-gray-300 text-primary focus:ring-primary dark:bg-gray-800 dark:border-gray-700 transition-all cursor-pointer"
                id="terms-checkbox" type="checkbox"
                checked={isChecked}
                onChange={(e) => setIsChecked(e.target.checked)} />
            </div>
            <span className="text-sm text-gray-600 dark:text-gray-400 leading-snug">
              {t('termsAgreement.prefix', { price: '300' })}{" "}
              <a
                className="text-primary font-semibold underline underline-offset-2 hover:text-red-600 transition-colors"
                href="https://drive.google.com/file/d/1w4xuVLY5EqdAfi79pVlE3I3VIkhmtAIm/view?usp=sharing"
              >
                {t('termsAgreement.link')}
              </a>
              {t('termsAgreement.suffix')}
            </span>
          </label>


          <button
            onClick={handleSubscribe}
            disabled={isProcessing || createSubscriptionMutation.isPending || !user?.id || !isChecked}
            className="w-full bg-primary hover:bg-red-600 active:scale-[0.98] transition-all text-white font-bold h-14 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-center gap-2 group mb-4 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isProcessing || createSubscriptionMutation.isPending ? (
              <>
                <span className="text-lg">{t('processing')}</span>
                <span className="material-symbols-outlined animate-spin" style={{ fontSize: "20px" }}>
                  refresh
                </span>
              </>
            ) : (
              <>
                <span className="text-lg">{t('subscribe')}</span>
                <span className="w-1.5 h-1.5 rounded-full bg-white/40"></span>
                <span className="text-lg">300/{t('month')}</span>
                <span className="material-symbols-outlined group-hover:translate-x-1 transition-transform" style={{ fontSize: "20px" }}>
                  arrow_forward
                </span>
              </>
            )}
          </button>
        </div>
        <p className="text-center text-xs text-gray-400 dark:text-gray-500 leading-normal">
          {t('agreement.prefix')}{" "}
          <a
            className="text-gray-800 dark:text-gray-300 underline decoration-gray-300 dark:decoration-gray-600 underline-offset-2 hover:text-primary transition-colors"
            href="https://drive.google.com/file/d/1w4xuVLY5EqdAfi79pVlE3I3VIkhmtAIm/view?usp=sharing"
          >
            {t('agreement.link')}
          </a>{" "}
          {t('agreement.suffix')}
        </p>
      </div>
    </>
  );
}
