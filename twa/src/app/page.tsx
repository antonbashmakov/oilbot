"use client";

import { useEffect, useState } from 'react';
import { useGetItemsQuery } from '@/api';
import { format } from "date-fns";
import { CartButton } from '@/components/CartButton';
import { ItemOverview } from '@/api/models';
import { categories, IMAGE_TO_UUIDS } from '@/data/products';
import { useTranslations } from 'next-intl';

import _ from 'lodash';
import Link from 'next/link';

export default function Home() {
  const [selectedCategory, setSelectedCategory] = useState<string>('ALL');
  const { data, isLoading, error } = useGetItemsQuery(selectedCategory);
  const t = useTranslations('common');

  const [items, setItems] = useState<ItemOverview[]>([]);

  useEffect(() => {
    if (!data) return;
    const items = _.sortBy(data, ['category', 'name']);
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
                {t(`category.${category.id.toLowerCase()}` as any) || category.name}
              </p>
            </button>
          ))}
        </div>
      </div>


      {/* Product Grid */}
      {items && items.length > 0 ? (
        <div className="grid grid-cols-2 gap-x-4 gap-y-6 p-4">
          {items?.map((item, index: number) => {
            const delivery = item.deliveries[0];

            return (
              <Link
                key={item.id || `item-${index}`} 
                href={`/items/${item.id}`}
                className="flex flex-col group/card"
              >
                <div className="relative  mb-3 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5">
                  {/* Image - using CDN with progressive loading (thumbnail first, then high-res) */}
                  <div
                    className="w-full aspect-square bg-center bg-cover transition-transform duration-500 group-hover/card:scale-105 relative"
                    style={{
                      backgroundImage: item.id && IMAGE_TO_UUIDS[item.id] ?  `url(https://5rnru2cecx.ucarecd.net/${IMAGE_TO_UUIDS[item.id]}/-/preview/100x100/)` : 'none',
                      backgroundColor: 'transparent',
                    }}
                    aria-label={item.name || 'Product image'}
                  >
                    {item.id && (
                      <img
                        src={IMAGE_TO_UUIDS[item.id] ? `https://5rnru2cecx.ucarecd.net/${IMAGE_TO_UUIDS[item.id]}/-/preview/400x400/` : undefined}
                        alt={item.name || 'Product image'}
                        className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300"
                        loading="lazy"
                        onLoad={(e) => {
                          e.currentTarget.classList.remove('opacity-0');
                          e.currentTarget.classList.add('opacity-100');
                        }}
                        onError={(e) => {
                          // If high-res fails, keep showing thumbnail
                          e.currentTarget.style.display = 'none';
                        }}
                      />
                    )}
                  </div>

                  {/* Quick Add FAB */}
                  <div className="absolute bottom-2 right-2" onClick={(e) => e.preventDefault()}>
                  <CartButton
                    itemId={item.id || `item-${index}`}
                    itemData={{
                      name: item.name,
                      price: item.fraction_price_out,
                      fraction: item.fraction,
                      group: item.group,
                      price_for_unit: item.fraction_price_out,
                      quantity: 1,
                    }}
                    
                  />
                  </div>

                </div>

                <div className="flex flex-col gap-1">
                  <h3 className="text-text-main-light dark:text-text-main-dark text-base font-bold leading-tight">
                    {item.name || `Product ${index + 1}`}
                  </h3>
                  <div className="flex items-baseline gap-1">
                    <span className="text-primary text-lg font-bold">{(item.fraction_price_out || 0).toFixed(0)} ₽</span>
                    <span className="text-text-sub-light dark:text-text-sub-dark text-xs font-medium">/ {item.unit_description}</span>                    
                  </div>
                  {item.is_weighted && <span className="text-text-sub-light dark:text-text-sub-dark text-xs font-medium">{t('weight', { fraction:item.fraction, unit: item.unit })}</span>}
                  {delivery?.delivery_end && <div className="flex items-center gap-1.5 mt-1">
                    <span
                      className={`material-symbols-outlined text-[14px] text-green-600 dark:text-green-400`}
                    >
                      local_shipping
                    </span>
                    <p className="text-text-sub-light dark:text-text-sub-dark text-xs font-medium">
                      {format(new Date(delivery.delivery_end), "dd MMM yyyy")}
                    </p>
                  </div>}
                </div>
              </Link>
            );
          })}
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
