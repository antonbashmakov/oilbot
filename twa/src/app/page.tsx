"use client";

import { useEffect, useState } from 'react';
import { useGetItemsQuery } from '@/api';
import { ProductGridCard } from '@/components/ProductGridCard';
import type { ItemOverview } from '@/api/models';
import { categories } from '@/data/products';
import { useTranslations } from 'next-intl';

import _ from 'lodash';
import { useCustomer } from '@/api/user/provider';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const { data, isLoading, error } = useGetItemsQuery(selectedCategory);
  const t = useTranslations('common');
  const { customer } = useCustomer();

  const [items, setItems] = useState<ItemOverview[]>([]);

  useEffect(() => {
    if (!data) return;
    const items = _.sortBy(_.sortBy(data, ['category', 'name']), item => !item.deliveries || item.deliveries.length === 0);
    setItems(items);
  }, [data, selectedCategory]);

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


  return (
    <>

      {/* Sticky Header Group  */}
      <div className="sticky top-0 z-30 bg-surface-light/95 dark:bg-surface-dark/95 backdrop-blur-md border-b border-gray-100 dark:border-white/5">
        <div className="flex gap-3 overflow-x-auto px-4 pb-4 pt-1 no-scrollbar">
          {categories.map((category) => (
            <button
              key={category.id}
              onClick={() => setSelectedCategory(category.id)}
              className={`group flex h-10 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm transition-all active:scale-95 ${selectedCategory === category.id
                ? 'bg-primary shadow-primary/30'
                : 'bg-white dark:bg-white/10 border border-gray-100 dark:border-white/5 hover:bg-gray-50 dark:hover:bg-white/20'
                }`}
            >
              <span
                className={`material-symbols-outlined text-[20px] ${selectedCategory === category.id ? 'text-white' : 'text-text-main-light dark:text-text-main-dark'
                  }`}
              >
                {category.icon}
              </span>
              <p
                className={`text-sm ${selectedCategory === category.id
                  ? 'text-white font-bold'
                  : 'text-text-main-light dark:text-text-main-dark font-medium'
                  }`}
              >
                {t(`category.${category.id.toLowerCase()}` as 'all' | 'meat' | 'sea' | 'cheese') || category.name}
              </p>
            </button>
          ))}
        </div>
      </div>


      {/* Product Grid */}
      {items && items.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 p-4">
          {items?.map((item, index: number) => (
            <ProductGridCard key={item.id || `item-${index}`} item={item} isMember={!!customer?.is_member} />
          ))}
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center">
          <div className="text-center">
            <span className="material-symbols-outlined text-4xl text-text-sub-light dark:text-text-sub-dark">inventory_2</span>
            <p className="mt-4 text-text-sub-light dark:text-text-sub-dark">{t('noProducts')}</p>
          </div>
        </div>
      )}
    </>
  );
}
