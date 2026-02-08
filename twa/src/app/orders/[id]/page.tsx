"use client";

import { useRouter, useParams } from "next/navigation";
import { useGetOrderQuery } from "@/api";
import { useUser } from "@/api/user/provider";
import { useState, useEffect, useMemo } from "react";
import { CartItem, OrderPicking, PickingItem } from "@/api/models";

type AggregatedItem = {
      item_id: string;
      name: string;
      totalFraction: number;
      price_for_unit: number;
      category: string;
      quantity: number;
      price: number;
    };

export default function OrderDetailPage() {
  const router = useRouter();
  const params = useParams();
  const { user } = useUser();

  const orderId = params.id as string;

  // Fetch order details using the query hook
  const { data: order, isLoading, error } = useGetOrderQuery(user?.id, orderId);

  console.log("Order data:", order);

  // Aggregate items by item_id
  const aggregatedItems = useMemo(() => {
    if (!order?.items) return [];

    const itemsMap = new Map<string, AggregatedItem>();

    order.items.forEach((item: CartItem) => {
      const existing = itemsMap.get(item.item_id);
      if (existing) {
        // Sum up fractions for same item_id
        existing.totalFraction += item.fraction;
        existing.quantity += item.quantity;
        existing.price += item.price;
      } else {
        itemsMap.set(item.item_id, {
          item_id: item.item_id,
          name: item.name,
          totalFraction: item.fraction,
          price_for_unit: item.price_for_unit,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
        });
      }
    });

    return Array.from(itemsMap.values());
  }, [order]);
  // Aggregate items by item_id
  const aggregatedPickings = useMemo(() => {
    if (!order?.picking?.items) return {};

    const itemsMap : Record<string, AggregatedItem> = {};

    order.picking.items.forEach((item: PickingItem) => {
      const existing = itemsMap[item.item_id];
      if (existing) {
        // Sum up fractions for same item_id
        existing.totalFraction += item.fraction;
        existing.quantity += item.quantity;
        existing.price += item.price;
      } else {
        itemsMap[item.item_id] = {
          item_id: item.item_id,
          name: item.name,
          totalFraction: item.fraction,
          price_for_unit: item.price_for_unit,
          category: item.category,
          quantity: item.quantity,
          price: item.price,
        }
      }
      });

    return itemsMap;
  }, [order]);

  const totalDifference = useMemo(() => {
    if (!order) return 0;
    return (order.total || 0) - (order.picking?.total || 0);
  }, [order?.total, order?.picking?.total]);

  const handleBack = () => {
    router.back();
  };

  const totalDifferenceClass = useMemo(() => {
    if (totalDifference > 0) return "text-green-600 dark:text-green-400";
    if (totalDifference < 0) return "text-red-600 dark:text-red-400";
    return "text-text-sub dark:text-[#dcb8be]";
  }, [totalDifference]);

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
        {/* Refund notification 
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
        */}

        {/* Itemized breakdown */}
        <div className="px-4 mb-6">
          <div className="flex justify-between items-end mb-4 px-1">
            <h3 className="text-text-main dark:text-white text-lg font-bold">Itemized Breakdown</h3>
            <span className="text-text-sub dark:text-[#dcb8be] text-xs font-medium">
              {order ? `Order #${order.id?.substring(0, 8) || 'N/A'}` : 'Order #2394-FDA'}
            </span>
          </div>
          <div className="space-y-4">
            {aggregatedItems.map((item, index) => {
              // Calculate total price for the aggregated item
              const totalPrice = item.price;
              const formattedFraction = item.totalFraction.toFixed(3);
              const formattedPricePerUnit = item.price_for_unit.toFixed(2);
              const formattedTotalPrice = totalPrice.toFixed(2);

              const pickedItem = aggregatedPickings[item.item_id];
              const pickedFraction =  pickedItem?.totalFraction || 0;
              const pickedTotalPrice = pickedItem?.price || 0;
              const formattedPickedFraction = pickedFraction.toFixed(3);
              const formattedPickedTotalPrice = pickedTotalPrice.toFixed(2);
              const diff =  totalPrice - pickedTotalPrice;
              const diffClass = diff > 0 ? "text-green-600 dark:text-green-400" : diff < 0 ? "text-red-600 dark:text-red-400" : "text-text-sub dark:text-[#dcb8be]";
              
              // For now, we'll skip actual fulfilled fields as requested
              // We'll just show the ordered amount
              return (
                <div key={item.item_id || index} className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
                  <div className="flex gap-3 mb-4">
                    <div className="flex-1 min-w-0 flex items-center">
                      <h4 className="font-bold text-text-main dark:text-white text-sm truncate">
                        {item.name}
                      </h4>
                    </div>
                  </div>
                  <div className="space-y-2 border-t border-gray-50 dark:border-white/5 pt-3">
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-text-sub dark:text-[#dcb8be]">
                        Ordered: {formattedFraction} * {formattedPricePerUnit}
                      </span>
                      <span className="font-semibold text-text-main dark:text-white">{formattedTotalPrice}</span>
                    </div>
                    <div className="flex justify-between items-center text-xs">
                      <span className="text-primary font-bold">
                        Actual: {formattedPickedFraction} * {formattedPricePerUnit}
                      </span>
                      <span className="font-bold text-text-main dark:text-white">-{formattedPickedTotalPrice}</span>
                    </div>
                  </div>
                  <div className="mt-3 flex justify-between items-center text-xs">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-text-sub dark:text-[#dcb8be]">
                      Price Difference
                    </span>
                    <span className={`${diffClass} text-sm font-bold text-text-sub dark:text-[#dcb8be]`}>{diff.toFixed(2)}</span>
                  </div>
                </div>
              );
            })}


       
          </div>
        </div>

        {/* Order totals */}
        <div className="px-4 mb-8">
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-md border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="p-5 space-y-4">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-sub dark:text-[#dcb8be]">Original Order Total</span>
                <span className="font-semibold text-text-main dark:text-white">
                  {order?.total?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-sub dark:text-[#dcb8be]">Actual Fulfilled Total</span>
                <span className="font-semibold text-text-main dark:text-white">
                  -{order?.picking?.total?.toFixed(2) || '0.00'}
                </span>
              </div>
              <div className="pt-4 mt-2 border-t border-gray-100 dark:border-white/10 flex justify-between items-center">
                <div>
                  <span className="block text-base font-bold text-primary">Total Difference</span>
                </div>
                <span className={`${totalDifferenceClass} text-2xl font-black text-primary`}>{totalDifference}</span>
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

      {/* Footer buttons 
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
*/}
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
