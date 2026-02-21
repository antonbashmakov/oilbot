"use client";

import { useParams, useRouter } from 'next/navigation';
import { useGetItemQuery, useCartStore } from '@/api';
import { useCustomer } from '@/api/user/provider';
import { IMAGE_TO_UUIDS } from '@/data/products';
import { useTranslations } from 'next-intl';
import { format } from 'date-fns';
import { useEffect, useState } from 'react';


export default function ItemDetailPage() {
  const params = useParams();
  const router = useRouter();
  const itemId = params.itemId as string;
  const { customer } = useCustomer();
  const customerId = customer?.id;

  const { data: item, isLoading, error } = useGetItemQuery(customerId, itemId);
  const t = useTranslations('common');
  const itemT = useTranslations('itemDetail');

  const [quantity, setQuantity] = useState(1);
  const [isAddingToCart, setIsAddingToCart] = useState(false);
  const [isMember, setIsMember] = useState(false);
  const { addToCart, getItemCountInCart } = useCartStore(customerId);
  const cartCount = getItemCountInCart(itemId);

  useEffect(() => {
    setIsMember(customer?.subscription?.status === "ACTIVE");
  }, [customer?.subscription?.status]);

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
  if (error || !item) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="text-center text-red-500">
          <span className="material-symbols-outlined text-4xl">error</span>
          <p className="mt-4">{t('error')}. {t('retry')}.</p>
        </div>
      </div>
    );
  }

  const imageUuid = IMAGE_TO_UUIDS[item.id];
  const thumbnailUrl = imageUuid ? `https://5rnru2cecx.ucarecd.net/${imageUuid}/-/preview/100x100/` : undefined;
  const highResUrl = imageUuid ? `https://5rnru2cecx.ucarecd.net/${imageUuid}/-/preview/800x800/` : undefined;

  const delivery = item.deliveries?.[0];
  const price = isMember ? item.fraction_price_out : item.non_member_fraction_price_out;
  const totalPrice = price * quantity;

  return (
    <div className="relative min-h-screen flex flex-col  bg-white dark:bg-surface-dark">
      {/* Main Content */}
      <main className="flex-1 overflow-y-auto no-scrollbar pb-32">
        {/* Product Image with progressive loading */}
        <div className="aspect-square w-full relative overflow-hidden bg-gray-100 dark:bg-white/5">
          <div
            className="w-full h-full bg-center bg-cover relative"
            style={{
              backgroundImage: thumbnailUrl ? `url(${thumbnailUrl})` : 'none',
              backgroundColor: 'transparent',
            }}
            aria-label={item.name || 'Product image'}
          >
            {imageUuid && (
              <img
                src={highResUrl}
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
          <button className="absolute bottom-4 right-4 flex items-center justify-center size-12 rounded-full bg-white dark:bg-surface-dark shadow-lg text-primary active:scale-90 transition-transform">
            <span className="material-symbols-outlined filled">favorite</span>
          </button>
        </div>

        {/* Product Details */}
        <div className="px-5 pt-6 flex flex-col gap-4">
          <div className="flex flex-col gap-1">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-1.5 text-gray-500 dark:text-text-sub-dark">
                <span className="material-symbols-outlined text-sm filled">favorite</span>
                <span className="text-sm font-semibold">{item.stats?.number_of_likes} {itemT('likes')}</span>
              </div>
            </div>
            <h1 className="text-2xl font-extrabold text-gray-900 dark:text-text-main-dark">
              {item.name || 'Product'}
            </h1>
            <div className="flex flex-col gap-2 mt-3">
              <div className="flex items-center justify-between rounded-xl  ">
                <div className="flex flex-col">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-primary">{t('yourPrice')}</span>
                  <div className="flex items-baseline">
                    <span className="text-2xl font-bold text-primary">{price.toFixed(0)} ₽</span>
                    <span className="text-sm font-medium text-gray-500 dark:text-text-sub-dark ml-1">/ {item.unit_description} </span> {item.is_weighted && <span className="text-sm font-medium text-gray-500 dark:text-text-sub-dark ml-1">(≈{item.fraction}{item.unit}) </span>}
                  </div>
                </div>
                <div className="flex flex-col items-end">
                  <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">{isMember ? t('nonMembers') : t('clubMembers')} {t('price')}</span>
                  <span className="text-lg text-gray-400 line-through">{isMember ? item.non_member_fraction_price_out : item.fraction_price_out}</span>
                </div>
              </div>
            </div>
            <div className="mt-3 p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl flex gap-2.5">
              <span className="material-symbols-outlined text-gray-400 dark:text-text-sub-dark text-lg flex-shrink-0">info</span>
              <p className="text-[16px] leading-relaxed text-gray-500 dark:text-text-sub-dark font-medium">
                {item.is_weighted ? itemT('priceInfoWeighted', { unit: item.unit, fraction: item.fraction }) : itemT('priceInfoPackaged', { unit: item.unit, fraction: item.fraction })}
              </p>
            </div>
            {!isMember && <div className="mt-4 p-4 bg-black rounded-2xl text-white shadow-xl overflow-hidden relative">
              <div className="absolute top-0 right-0 p-2 opacity-80 text-white" >
                <span className="material-symbols-outlined text-6xl">workspace_premium</span>
              </div>
              <div className="relative z-10 flex flex-col gap-3">
                <div className="flex flex-col gap-1">
                  <span className="text-primary font-bold text-sm">{itemT('memberSavings')}</span>
                  <p className="text-sm font-medium leading-snug">{itemT('memberSavingsDescription', { savings: item.non_member_fraction_price_out - item.fraction_price_out })}</p>
                </div>
                <button
                  onClick={() => router.push('/subscription')}
                  className="w-full bg-white text-black font-bold py-2.5 rounded-xl text-sm active:scale-[0.98] transition-all">
                  {itemT('subscribeNow')}
                </button>
              </div>
            </div>}
          </div>

          <div className="h-px bg-gray-100 dark:bg-white/10 w-full"></div>

          <div className="flex flex-col gap-2">
            <h3 className="font-bold text-gray-900 dark:text-text-main-dark uppercase text-xs tracking-widest">
              {itemT('productDetails')}
            </h3>
            <p className="text-gray-600 dark:text-text-sub-dark text-sm leading-relaxed">
              {item.description || itemT('noDescription')}
            </p>
          </div>
          {/* Delivery Information 
          <div className="grid grid-cols-2 gap-3 mt-2">
            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl flex flex-col items-center text-center gap-1">
              <span className="material-symbols-outlined text-gray-400 dark:text-text-sub-dark text-xl">nutrition</span>
              <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-text-sub-dark">Protein</span>
              <span className="text-sm font-bold text-gray-900 dark:text-text-main-dark">22g</span>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 p-3 rounded-xl flex flex-col items-center text-center gap-1">
              <span className="material-symbols-outlined text-gray-400 dark:text-text-sub-dark text-xl">restaurant</span>
              <span className="text-[10px] font-bold uppercase text-gray-400 dark:text-text-sub-dark">Calories</span>
              <span className="text-sm font-bold text-gray-900 dark:text-text-main-dark">280 kcal</span>
            </div>
          </div>
          */}

          {/* Delivery Information */}
          {delivery && (
            <div className="mt-4 p-3 bg-gray-50 dark:bg-white/5 border border-gray-100 dark:border-white/10 rounded-xl">
              <div className="flex items-center gap-2 mb-2">
                <span className="material-symbols-outlined text-green-600 dark:text-green-400">local_shipping</span>
                <h4 className="font-bold text-gray-900 dark:text-text-main-dark text-sm">{itemT('deliveryAvailable')}</h4>
              </div>
              <p className="text-gray-600 dark:text-text-sub-dark text-sm">
                {itemT('deliveryBy', { date: format(new Date(delivery.delivery_end), "dd MMM yyyy") })}
              </p>
            </div>
          )}
        </div>
      </main>

      {/* Footer with Add to Cart */}
      <footer className="fixed bottom-0 left-0 right-0 bg-white/90 dark:bg-surface-dark/90 backdrop-blur-xl border-t border-gray-100 dark:border-white/10 px-5 pt-4 pb-8 z-50">
        <div className="flex items-center gap-4">
          {/*
          <div className="flex items-center bg-gray-100 dark:bg-white/10 rounded-xl h-14 p-1">
            <button 
              className="size-10 flex items-center justify-center text-gray-900 dark:text-text-main-dark hover:bg-white dark:hover:bg-white/20 rounded-lg transition-colors"
              onClick={() => setQuantity(prev => Math.max(1, prev - 1))}
            >
              <span className="material-symbols-outlined text-xl">remove</span>
            </button>
            <span className="w-8 text-center font-bold text-gray-900 dark:text-text-main-dark">{quantity}</span>
            <button 
              className="size-10 flex items-center justify-center text-gray-900 dark:text-text-main-dark hover:bg-white dark:hover:bg-white/20 rounded-lg transition-colors"
              onClick={() => setQuantity(prev => prev + 1)}
            >
              <span className="material-symbols-outlined text-xl">add</span>
            </button>
          </div>
          */}
          <button
            onClick={async () => {
              if (!customerId) return;
              setIsAddingToCart(true);
              try {
                await addToCart(itemId);
                // Success - could show feedback
              } catch (error) {
                console.error('Failed to add to cart:', error);
              } finally {
                setIsAddingToCart(false);
              }
            }}
            disabled={isAddingToCart || !customerId}
            className="flex-1 h-14 bg-primary hover:bg-red-600 active:bg-red-700 text-white rounded-xl font-bold text-lg tracking-wide shadow-lg shadow-red-500/30 flex items-center justify-center gap-2 transition-all active:scale-[0.98] disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {isAddingToCart ? (
              <div className="inline-block h-6 w-6 animate-spin rounded-full border-2 border-solid border-white border-r-transparent align-[-0.125em]"></div>
            ) : (
              <>
                <span>{itemT('addToCart')}</span>
                <div className="w-px h-4 bg-white/20 mx-1"></div>
                <span className="text-sm font-bold">+{totalPrice.toFixed(0)} ₽</span>
              </>
            )}
          </button>
        </div>
        <div className="h-1 w-32 bg-gray-200 dark:bg-white/20 rounded-full mx-auto mt-6"></div>
      </footer>
    </div>
  );
}
