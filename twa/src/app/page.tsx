"use client";

import { useState } from 'react';
import { useGetItemsQuery } from '@/api';
import { categories, navItems } from '@/data/products';
import { format } from "date-fns";
import { UserDisplay } from '@/components/UserDisplay';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const { data: items, isLoading, error } = useGetItemsQuery(selectedCategory);

  // Handle loading state
  if (isLoading) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark font-display text-text-main-light dark:text-text-main-dark selection:bg-primary/20">
        <div className="sticky top-0 z-30 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-text-sub-light dark:text-text-sub-dark uppercase tracking-wide">Delivering to</span>
                <h2 className="text-base font-bold leading-tight truncate">Downtown, Market St.</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserDisplay />
              <button className="relative flex size-10 items-center justify-center rounded-full bg-background-light dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">shopping_cart</span>
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-surface-dark"></span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <div className="inline-block h-8 w-8 animate-spin rounded-full border-4 border-solid border-primary border-r-transparent align-[-0.125em] motion-reduce:animate-[spin_1.5s_linear_infinite]"></div>
            <p className="mt-4 text-text-sub-light dark:text-text-sub-dark">Loading products...</p>
          </div>
        </div>
      </div>
    );
  }

  // Handle error state
  if (error) {
    return (
      <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark font-display text-text-main-light dark:text-text-main-dark selection:bg-primary/20">
        <div className="sticky top-0 z-30 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
          <div className="flex items-center justify-between px-4 py-3">
            <div className="flex items-center gap-2 overflow-hidden">
              <span className="material-symbols-outlined text-primary">location_on</span>
              <div className="flex flex-col">
                <span className="text-xs font-medium text-text-sub-light dark:text-text-sub-dark uppercase tracking-wide">Delivering to</span>
                <h2 className="text-base font-bold leading-tight truncate">Downtown, Market St.</h2>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <UserDisplay />
              <button className="relative flex size-10 items-center justify-center rounded-full bg-background-light dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors">
                <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">shopping_cart</span>
                <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-surface-dark"></span>
              </button>
            </div>
          </div>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center text-red-500">
            <span className="material-symbols-outlined text-4xl">error</span>
            <p className="mt-4">Failed to load products. Please try again.</p>
          </div>
        </div>
      </div>
    );
  }


  return (
    <div className="relative flex h-full min-h-screen w-full flex-col overflow-x-hidden pb-24 bg-background-light dark:bg-background-dark font-display text-text-main-light dark:text-text-main-dark selection:bg-primary/20">
      {/* Sticky Header Group */}
      <div className="sticky top-0 z-30 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
        {/* Top App Bar */}
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-2 overflow-hidden">
            <span className="material-symbols-outlined text-primary">location_on</span>
            <div className="flex flex-col">
              <span className="text-xs font-medium text-text-sub-light dark:text-text-sub-dark uppercase tracking-wide">Delivering to</span>
              <h2 className="text-base font-bold leading-tight truncate">Downtown, Market St.</h2>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <UserDisplay />
            <button className="relative flex size-10 items-center justify-center rounded-full bg-background-light dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors">
              <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">shopping_cart</span>
              <span className="absolute top-1.5 right-1.5 h-2.5 w-2.5 rounded-full bg-primary ring-2 ring-white dark:ring-surface-dark"></span>
            </button>
          </div>
        </div>

        {/* Categories Chips */}
        <div className="flex gap-3 overflow-x-auto px-4 pb-4 pt-1 no-scrollbar">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.name.toLowerCase())}
              className={`group flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm transition-all active:scale-95 ${
                selectedCategory === category.name.toLowerCase()
                  ? 'bg-primary shadow-primary/30'
                  : 'bg-white dark:bg-white/10 border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/20'
              }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${
                  selectedCategory === category.name.toLowerCase() ? 'text-white' : 'text-text-main-light dark:text-text-main-dark'
                }`}
              >
                {category.icon}
              </span>
              <p
                className={`text-sm ${
                  selectedCategory === category.name.toLowerCase()
                    ? 'text-white font-bold'
                    : 'text-text-main-light dark:text-text-main-dark font-medium'
                }`}
              >
                {category.name}
              </p>
            </button>
          ))}
        </div>
      </div>

      {/* Product Grid */}
      {items && items.length  > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 p-4">
          {items?.map((item, index: number) => {
            // Determine delivery info based on index
            const deliveryOptions = [
              { time: 'Tomorrow, 10 AM', icon: 'local_shipping' as const },
              { time: 'Today, 6 PM', icon: 'bolt' as const },
              { time: 'Tomorrow, 10 AM', icon: 'local_shipping' as const },
              { time: 'Fri, 2 PM', icon: 'local_shipping' as const },
              { time: 'Sat, 9 AM', icon: 'local_shipping' as const },
              { time: 'Today, 5 PM', icon: 'bolt' as const },
            ];
            const delivery = item.deliveries[0];
            
            // Determine badge based on index
            let badge = undefined;
            if (index === 0) {
              badge = { text: 'Best Seller', type: 'best-seller' as const };
            } else if (index === 4) {
              badge = { text: 'New Arrival', type: 'new-arrival' as const };
            }
            
            return (
              <div key={item.id || `item-${index}`} className="flex flex-col group/card">
                <div className="relative mb-3 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5">
                  {/* Image - using placeholder since API doesn't provide images */}
                  <div
                    className="w-full aspect-[4/3] bg-center bg-cover transition-transform duration-500 group-hover/card:scale-105"
                    style={{ 
                      backgroundImage: `url(https://via.placeholder.com/300x200/cccccc/666666?text=${encodeURIComponent(item.name || 'Product')})`
                    }}
                    aria-label={item.name || 'Product image'}
                  />

                  {/* Quick Add FAB */}
                  <button className="absolute bottom-2 right-2 flex size-10 items-center justify-center rounded-full bg-white dark:bg-surface-dark text-primary shadow-lg transition-transform active:scale-90 hover:bg-primary hover:text-white">
                    <span className="material-symbols-outlined">add</span>
                  </button>

                  {/* Badge */}
                  {badge && (
                    <div
                      className={`absolute top-2 left-2 rounded-lg backdrop-blur-sm px-2 py-1 ${
                        badge.type === 'best-seller'
                          ? 'bg-black/60'
                          : 'bg-primary/90'
                      }`}
                    >
                      <span className="text-[10px] font-bold text-white tracking-wide uppercase">
                        {badge.text}
                      </span>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-text-main-light dark:text-text-main-dark text-base font-bold leading-tight">
                    {item.name || `Product ${index + 1}`}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-primary text-lg font-bold">{(item.fraction_price_out || 0).toFixed(0)} ₽</span>
                    <span className="text-text-sub-light dark:text-text-sub-dark text-xs font-medium">/ {item.unit_description}</span>
                  </div>
                  <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`material-symbols-outlined text-[14px] text-green-600 dark:text-green-400`}
                    >
                      local_shipping
                    </span>
                    <p className="text-text-sub-light dark:text-text-sub-dark text-xs font-medium">
                      {format(new Date(delivery.delivery_end), "dd MMM yyyy")}
                    </p>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-text-sub-light dark:text-text-sub-dark">inventory_2</span>
            <p className="mt-4 text-text-sub-light dark:text-text-sub-dark">No products found in this category.</p>
          </div>
        </div>
      )}

      {/* Bottom Navigation */}
      <div className="fixed bottom-0 left-0 w-full z-40 bg-surface-light dark:bg-surface-dark border-t border-gray-100 dark:border-white/5 px-4 pb-6 pt-2">
        <div className="flex items-center justify-between">
          {navItems.map((item) => (
            <a
              key={item.id}
              href="#"
              className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                item.active
                  ? 'text-primary'
                  : 'text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark'
              }`}
            >
              <span className={`material-symbols-outlined ${item.active ? 'filled' : ''}`}>
                {item.icon}
              </span>
              <span
                className={`text-[10px] ${item.active ? 'font-bold' : 'font-medium'}`}
              >
                {item.label}
              </span>
            </a>
          ))}
        </div>
      </div>
    </div>
  );
}
