"use client";

import { useCallback, useMemo } from 'react';
import Link from 'next/link';
import { useCartStore, useCheckout } from '@/api';
import { useCustomer } from '@/api/user/provider';
import { useTranslations } from 'next-intl';

import _ from 'lodash';
import { IMAGE_TO_UUIDS } from '@/data/products';
import { useRouter } from "next/navigation";

export default function CartPage() {
  const { customer } = useCustomer();
  const router = useRouter();
  const { getCartItems, removeFromCart, getCartTotal, addToCart, isLoading } = useCartStore(customer?.id);
  const checkoutMutation = useCheckout(customer?.id);
  const t = useTranslations('cart');

  const cartItems = useMemo(() => {
    if (!customer?.id) return [];
    return getCartItems();
  }, [getCartItems, customer?.id]);

  const cartTotal = getCartTotal();

  const itemGroups = useMemo(() => {
    return _.groupBy(cartItems, 'item_id');
  }, [cartItems]);

  const items = useMemo(() => {
    const representatives = Object.keys(itemGroups).map(itemId => {
      const group = itemGroups[itemId];
      const baseItem = group[0];

      return {
        ...baseItem,
        quantity: group.length
      };
    });

    return _.sortBy(representatives, 'name');
  }, [itemGroups]);


  const handleQuantityChange = useCallback(async (itemId: string, delta: number) => {

    if (delta < 0) {
      await removeFromCart({ cartItemId: itemGroups[itemId][0].id });

      return;
    }

    await addToCart(itemId);
  }, [addToCart, itemGroups, removeFromCart]);

  const handleRemoveItem = useCallback((itemId: string) => {
    removeFromCart({ itemId });
  }, [removeFromCart]);

  const handleCheckout = useCallback(async () => {
    if (!customer?.id || cartItems.length === 0) {
      return;
    }

    try {
      // Generate a unique idempotency key
      const idempotencyKey = `checkout-${customer.id}-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;

      const res: any = await checkoutMutation.mutateAsync({ idempotencyKey });
      if (!res.payments || !res.payments.length && typeof window !== 'undefined') {
        throw new Error('No payment methods returned');
      }
      if (res.payments.length === 1 && res.payments[0].payment_url && typeof window !== 'undefined') {
        window.location.href = res.payments[0].payment_url;
      }
      if (res.payments.length > 1 && typeof window !== 'undefined') {
        router.push("/orders");
      }
    } catch (error) {
      console.error('Checkout failed:', error);
      // In a real app, you would show an error message to the user
      alert(t('checkoutFailed'));
    }
  }, [customer?.id, cartItems, checkoutMutation, t]);

  return (
    <>
      {/* Custom Cart Header - This replaces the default page header */}


      {/* Main Content Area */}
      <div className="pb-24">
        {/* Cart Items List */}
        <div className="flex flex-col gap-1 p-4">
          {items.length > 0 ? (
            items.map((item, index) => {
              const quantity = item.quantity;
              const itemTotal = (item.price || 0) * quantity;

              return (
                <div
                  key={item.id || item.item_id}
                  className="group relative flex gap-4 bg-white dark:bg-white/5 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 transition-transform active:scale-[0.99]"
                >
                  <div
                    className="relative shrink-0 overflow-hidden rounded-lg w-24 h-24 bg-gray-100"
                    style={{
                      backgroundImage: item.item_id && IMAGE_TO_UUIDS[item.item_id] ? `url(https://5rnru2cecx.ucarecd.net/${IMAGE_TO_UUIDS[item.item_id]}/-/preview/100x100/)` : 'none',
                      backgroundColor: 'transparent',
                    }}
                    aria-label={item.name || 'Product image'}
                  >
                    {item.id && (
                      <img
                        src={IMAGE_TO_UUIDS[item.item_id] ? `https://5rnru2cecx.ucarecd.net/${IMAGE_TO_UUIDS[item.item_id]}/-/preview/400x400/` : undefined}
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

                  {/* Content */}
                  <div className="flex flex-1 flex-col justify-between py-1">
                    <div>
                      <div className="flex justify-between items-start">
                        <h3 className="text-text-main-light dark:text-text-main-dark text-base font-bold leading-snug line-clamp-2">
                          {item.name || `Item ${index + 1}`}
                        </h3>
                        <button
                          onClick={() => handleRemoveItem(item.item_id)}
                          className="text-text-sub-light dark:text-text-sub-dark hover:text-primary transition-colors"
                        >
                          <span className="material-symbols-outlined text-xl">delete</span>
                        </button>
                      </div>
                      <p className="text-text-sub-light dark:text-text-sub-dark text-xs font-medium mt-1">
                        {(item.price_for_unit || 0).toFixed(2)} ₽ / {item.group || 'unit'}
                      </p>
                    </div>

                    <div className="flex items-end justify-between mt-2">
                      <p className="text-primary font-bold text-lg">{itemTotal.toFixed(2)} ₽</p>

                      {/* Stepper */}
                      <div className="flex items-center bg-gray-50 dark:bg-white/10 rounded-lg p-1 gap-1 border border-gray-100 dark:border-transparent">
                        <button
                          onClick={() => handleQuantityChange(item.item_id, -1)}
                          disabled={isLoading || item.quantity <= 1}
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-white dark:bg-white/20 text-text-main-light dark:text-text-main-dark shadow-sm hover:bg-gray-50 active:scale-90 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">remove</span>
                        </button>
                        <input
                          className="w-8 p-0 text-center bg-transparent border-none text-text-main-light dark:text-text-main-dark text-sm font-semibold focus:ring-0"
                          readOnly
                          type="number"
                          value={quantity}
                        />
                        <button
                          onClick={() => handleQuantityChange(item.item_id, 1)}
                          disabled={isLoading}
                          className="w-7 h-7 flex items-center justify-center rounded-md bg-primary text-white shadow-sm shadow-primary/30 hover:bg-primary/90 active:scale-90 transition-all"
                        >
                          <span className="material-symbols-outlined text-sm">add</span>
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="flex flex-col items-center justify-center py-12">
              <span className="material-symbols-outlined text-6xl text-text-sub-light dark:text-text-sub-dark mb-4">
                shopping_cart
              </span>
              <h3 className="text-text-main-light dark:text-text-main-dark text-lg font-bold mb-2">{t('emptyCart')}</h3>
              <p className="text-text-sub-light dark:text-text-sub-dark text-sm text-center mb-6">
                {t('addItemsPrompt')}
              </p>
              <Link
                href="/"
                className="bg-primary hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/30 transition-all"
              >
                {t('browseProducts')}
              </Link>
            </div>
          )}
        </div>

        {/* Price Breakdown 
        {cartItems.length > 0 && (
          <div className="px-4 py-4 mt-2">
            <div
              className="flex gap-3 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 shrink-0">info</span>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 leading-relaxed">
                {t('subscriptionWarning')}
              </p>
            </div>
          </div>
        )}
          */}
      </div>
      

      {/* Sticky Footer for Checkout - Only shown when cart has items */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto p-4 z-40">
          <button
            onClick={handleCheckout}
            disabled={isLoading || checkoutMutation.isPending}
            className="w-full bg-primary hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-between active:scale-[0.98] transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span>
              {checkoutMutation.isPending ? t('processing') : t('checkout')}
            </span>
            <span>{cartTotal.toFixed(2)} ₽</span>
          </button>
        </div>
      )}
    </>
  );
}
