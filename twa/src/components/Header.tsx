"use client";

import { useRouter } from "next/navigation";
import { UserDisplay } from "./UserDisplay";
import { HeaderCartButton } from "./HeaderCartButton";
import { useCallback } from "react";
import { format, formatDate } from "date-fns";
import { useUser } from "@/api/user/provider";

const MainHeader = () => {
  const { user } = useUser();
  return (
    <div className="sticky top-0 z-30 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
      <div className="flex items-center justify-between px-4 py-3">
        { user?.subscription?.next_payment_at && <div className="flex items-center gap-2 overflow-hidden">
          <span className="material-symbols-outlined text-green-600 dark:text-green-400 filled">verified</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-green-600 dark:text-green-400 uppercase tracking-wide">Subscription
              Active</span>
            <h2 className="text-base font-bold leading-tight truncate">Next payment: {format(new Date(user?.subscription?.next_payment_at), "dd MMM yyyy")}</h2>
          </div>
        </div>}
        <div className="flex items-center gap-3">
          <UserDisplay />
          <HeaderCartButton />
        </div>
      </div>
    </div>
  );
};
const CartHeader = () => {
  const router = useRouter();

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
          My Cart (3)</h2>
        <div className="w-10"></div>
      </div>
    </div>
  );
};


export { MainHeader, CartHeader };
