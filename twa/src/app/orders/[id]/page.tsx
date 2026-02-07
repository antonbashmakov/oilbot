"use client";

import { useRouter, useParams } from "next/navigation";
import { useGetOrderQuery } from "@/api";
import { useUser } from "@/api/user/provider";
import { useState, useEffect } from "react";

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();
  
  const orderId = params.id as string;
  
  // Fetch order details using the query hook
  const { data: order, isLoading, error } = useGetOrderQuery(user?.id, orderId);

  const handleBack = () => {
    router.back();
  };

  const handleViewBalance = () => {
    // Navigate to store balance page
    router.push("/profile");
  };

  const handleHelp = () => {
    // Open help or contact support
    window.open("https://t.me/posebestoimosti_saratov", "_blank");
  };

  // Show loading state
  if (isLoading) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark group/design-root overflow-hidden shadow-2xl">
        <div className="flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-10">
          <button
            onClick={handleBack}
            className="text-text-main dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
            Loading...
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined animate-spin text-primary text-4xl mb-4">
              refresh
            </span>
            <p className="text-text-sub dark:text-[#dcb8be]">Loading order details...</p>
          </div>
        </div>
      </div>
    );
  }

  // Show error state
  if (error) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark group/design-root overflow-hidden shadow-2xl">
        <div className="flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-10">
          <button
            onClick={handleBack}
            className="text-text-main dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
            aria-label="Go back"
          >
            <span className="material-symbols-outlined">arrow_back_ios_new</span>
          </button>
          <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
            Error
          </h2>
        </div>
        <div className="flex-1 flex items-center justify-center p-8">
          <div className="text-center">
            <span className="material-symbols-outlined text-red-500 text-4xl mb-4">
              error
            </span>
            <p className="text-text-main dark:text-white font-medium mb-2">Failed to load order details</p>
            <p className="text-text-sub dark:text-[#dcb8be] text-sm mb-4">Please try again later</p>
            <button
              onClick={() => window.location.reload()}
              className="px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
            >
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark group/design-root overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-10">
        <button
          onClick={handleBack}
          className="text-text-main dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
          Fulfillment Details
        </h2>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto pb-44 no-scrollbar">
        {/* Refund notification */}
        <div className="px-4 pt-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 p-4 rounded-xl">
            <div className="flex gap-3 items-start">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 mt-0.5">
                account_balance_wallet
              </span>
              <div>
                <p className="text-green-800 dark:text-green-300 font-bold text-sm leading-tight">
                  Refund Processed
                </p>
                <p className="text-green-700/80 dark:text-green-400/80 text-xs mt-1">
                  A total of <span className="font-bold text-green-800 dark:text-green-300">$0.60</span> has been credited
                  back to your store balance.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized breakdown */}
        <div className="px-4 mb-6">
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="text-text-main dark:text-white text-lg font-bold">Itemized Breakdown</h3>
            <span className="text-text-sub dark:text-[#dcb8be] text-xs font-medium">
              {order ? `Order #${order.id?.substring(0, 8) || 'N/A'}` : 'Order #2394-FDA'}
            </span>
          </div>
          <div className="space-y-4">
            {/* Item 1: Premium Ribeye Steak */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
              <div className="flex gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 bg-cover bg-center shadow-inner"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCRQnrZqEdMJggfCSqNWIUakd43HcQv1sVHSvJ0uhLLGGWLIEO-DTfTQYjJ0rTpVMq3DjbwjPGOafYdFrJb8u5HCyqQfzL12_XwNBlF-Pq5DMpWuMllv1Z3ponocH91-wGhXiUTxcZEENNq6Rd4GovL2B4llfYlrjp3ZAuXKx8FMTNwJqoBCEpkj6uRw3v5016O7GpmcNoBOM32DUgYTjIyCZIjbcOEv6pZPy0xLZIGpNxZEaAMQs9A2wpqWdWgql7FVAz7lBXJh3O4')" }}
                />
                <div className="flex-1 min-w-0 flex items-center">
                  <h4 className="font-bold text-text-main dark:text-white text-sm truncate">
                    Premium Ribeye Steak
                  </h4>
                </div>
              </div>
              <div className="space-y-2 border-t border-gray-50 dark:border-white/5 pt-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-sub dark:text-[#dcb8be]">Ordered: 0.50kg * $30.00</span>
                  <span className="font-semibold text-text-main dark:text-white">$15.00</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-primary font-bold">Actual: 0.48kg * $30.00</span>
                  <span className="font-bold text-text-main dark:text-white">$14.40</span>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center bg-gray-50 dark:bg-black/20 px-3 py-2 rounded-lg border border-gray-100 dark:border-white/5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-sub dark:text-[#dcb8be]">
                  Price Difference
                </span>
                <span className="text-sm font-bold text-green-600 dark:text-green-400">-$0.60</span>
              </div>
            </div>

            {/* Item 2: Atlantic Salmon Fillet */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 opacity-90">
              <div className="flex gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDmNoUvnbFnhJGMGhn64mTlA8bG9lKeHSwGa1ZXUTlo-0--cR6B4ilGVpoat-cKca2dIKS0LodtNtnOkYVBspVUh1bmmtiAdaOt1ivJccpHPZK4Tmbvo2LW3tWR_XRoGXANTJWFTkVg8q-PPIAPeZ7UGMHL255lF-aduxjkDsStc3WLXbSzyyWbqIuPYWpmSlL96J_YI7yjYtxC1kKR-E9APW2XFptE9H3lhtysyxyw7Srig_nPofB9js4E8bjJxBTTKyc2MfUz3IHt')" }}
                />
                <div className="flex-1 min-w-0 flex items-center">
                  <h4 className="font-bold text-text-main dark:text-white text-sm truncate">
                    Atlantic Salmon Fillet
                  </h4>
                </div>
              </div>
              <div className="space-y-2 border-t border-gray-50 dark:border-white/5 pt-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-sub dark:text-[#dcb8be]">Ordered: 1.00 unit * $22.00</span>
                  <span className="font-semibold text-text-main dark:text-white">$22.00</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-sub dark:text-[#dcb8be] font-medium">Actual: 1.00 unit * $22.00</span>
                  <span className="font-bold text-text-main dark:text-white">$22.00</span>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center bg-gray-50 dark:bg-black/20 px-3 py-2 rounded-lg border border-gray-100 dark:border-white/5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-sub dark:text-[#dcb8be]">
                  Price Difference
                </span>
                <span className="text-sm font-bold text-text-sub dark:text-[#dcb8be]">$0.00</span>
              </div>
            </div>

            {/* Item 3: Aged Gouda */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 opacity-90">
              <div className="flex gap-3 mb-4">
                <div 
                  className="w-12 h-12 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDyOaocTfH__x4hEJgYhag5RoiNJ4GRbsSWMlaLcKmMNYBhajnvbW8fy9P0ZYtsx4tPMNUoFMX18l1i0hHhmaWU30iXyCgyMKrq37czY7_TCcVYyrV3RXpiGp93ojrGo3HXU3GZzfxop-VeTG0fvJ2YjS-gFlAfJtG4i10T-NQ1tntuJlEf5Q0tqaE0dwAV2O1zFUCHIdtl5qfaU4KRpY-7P9JGFjcSWdm_Qb5qdOUgl-llR9H8g6p6xQFAdExKrKEy1UR4a0b9-dII')" }}
                />
                <div className="flex-1 min-w-0 flex items-center">
                  <h4 className="font-bold text-text-main dark:text-white text-sm truncate">
                    Aged Gouda
                  </h4>
                </div>
              </div>
              <div className="space-y-2 border-t border-gray-50 dark:border-white/5 pt-3">
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-sub dark:text-[#dcb8be]">Ordered: 0.20kg * $62.50</span>
                  <span className="font-semibold text-text-main dark:text-white">$12.50</span>
                </div>
                <div className="flex justify-between items-center text-xs">
                  <span className="text-text-sub dark:text-[#dcb8be] font-medium">Actual: 0.20kg * $62.50</span>
                  <span className="font-bold text-text-main dark:text-white">$12.50</span>
                </div>
              </div>
              <div className="mt-3 flex justify-between items-center bg-gray-50 dark:bg-black/20 px-3 py-2 rounded-lg border border-gray-100 dark:border-white/5">
                <span className="text-[11px] font-bold uppercase tracking-wider text-text-sub dark:text-[#dcb8be]">
                  Price Difference
                </span>
                <span className="text-sm font-bold text-text-sub dark:text-[#dcb8be]">$0.00</span>
              </div>
            </div>
          </div>
        </div>

        {/* Order totals */}
        <div className="px-4 mb-8">
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-md border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-sub dark:text-[#dcb8be]">Original Order Total</span>
                <span className="font-semibold text-text-main dark:text-white">$49.50</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-sub dark:text-[#dcb8be]">Actual Fulfilled Total</span>
                <span className="font-semibold text-text-main dark:text-white">$48.90</span>
              </div>
              <div className="pt-4 mt-2 border-t border-gray-100 dark:border-white/10 flex justify-between items-center">
                <div>
                  <span className="block text-base font-bold text-primary">Total Difference</span>
                  <span className="text-[11px] text-green-600 dark:text-green-400 font-medium">
                    Credited to Balance
                  </span>
                </div>
                <span className="text-2xl font-black text-primary">$0.60</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 px-5 py-3 border-t border-gray-100 dark:border-white/10">
              <p className="text-[10px] text-text-sub dark:text-[#dcb8be] text-center uppercase tracking-wide font-medium">
                Final totals adjusted for exact weighed weights
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="absolute bottom-0 left-0 w-full bg-white/95 dark:bg-background-dark/95 backdrop-blur-lg border-t border-gray-100 dark:border-white/5 p-4 flex flex-col gap-3 z-20 pb-8 rounded-t-2xl shadow-[0_-8px_20px_rgba(0,0,0,0.08)]">
        <button
          onClick={handleViewBalance}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98] shadow-lg shadow-primary/20"
        >
          <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
          View Store Balance
        </button>
        <button
          onClick={handleHelp}
          className="w-full bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-text-main dark:text-white font-bold h-12 rounded-xl border border-gray-200 dark:border-white/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[18px]">help_outline</span>
          Support / Weighing Policy
        </button>
      </div>

      {/* Global styles for scrollbar */}
      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}
