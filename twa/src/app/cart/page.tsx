"use client";

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { useCartStore } from '@/api';
import { useUser } from '@/api/user/provider';

import _ from 'lodash';
import { CartItem } from '@/api/models';

export default function CartPage() {
  const { user } = useUser();
  const { getCartItems, removeFromCart, getCartTotal, addToCart, isLoading } = useCartStore(user?.id);

  const [items, setItems] = useState<CartItem[]>([]);
  const [itemGroups, setItemGroups] = useState<Record<string, typeof cartItems>>({});

  const cartItems = getCartItems();
  const cartTotal = getCartTotal();

  useEffect(() => {
    const itemGroups = _.groupBy(cartItems, 'item_id');

    const representatives = Object.keys(itemGroups).map(itemId => {
      const group = itemGroups[itemId];
      // If there are multiple entries for the same item, consolidate them
      const representativeItem = group[0];
      representativeItem.quantity = group.length;
      return representativeItem;
    });

    setItems(_.sortBy(representatives, 'name'));
    setItemGroups(itemGroups);

  }, [cartItems]);

  const handleQuantityChange = async (itemId: string, delta: number) => {

    if (delta < 0) {
      console.log('Removing item from cart:', itemGroups);

      await removeFromCart({ cartItemId: itemGroups[itemId][0].id });

      return;
    }

    await addToCart(itemId);
  };

  const handleRemoveItem = (itemId: string) => {
    removeFromCart({ itemId });
  };

  const handleCheckout = () => {
    // In a real app, you would navigate to checkout page
    console.log('Proceeding to checkout with items:', cartItems);
    alert(`Proceeding to checkout with ${cartItems.length} items. Total: $${totalAmount.toFixed(2)}`);
  };

  // Mock images for demonstration
  const mockImages = [
    'https://lh3.googleusercontent.com/aida-public/AB6AXuAIow-8ESJRqmDF46HALfhPsB08ajJ0PgZj8Ysw6nSMKI1PEkD-owCwV-PkBFeGKtRYAgMcXrmpDT7SdiZOuY5w-D80dT0U8VfYBLrlvbSwkby0PuEtYWu4acHCBorpYRCIBnpy3h1d28xdheV192qzUCm0sQ6yK0UeSD4nNVJj-4qBc19OlTL43Lm_cIpshUYVMgKT2s17PSJmeY2QsWoAMcw0U_uLI7psPBOmkTHMFW46c-c4lWnIdLxf-cduxI7DPEEKJ9iWwr0n',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuDnxTwvFfBfY71tmkKm_b7wbJtVhb2iRexHer3ihnb_rokTq3JgYTeZdU7-oSq4yogu3tCAy8Yv2vtwMaU0lYQ-8vXCm51yddsP4hzpgXdnoX4yqgl_WquAGbUNKvGPHVVveu0EoalownrGwioNUQDOmNsyiZXl0GPJ07wWbi3lhH8DsJiEYMERP44ah9q4cw-I8agrWMlWScKCBxqXFGcZDjclh9gm-zTjUlIImMkTkmTfaALiVBcZ6Q1bTqPDBHSzyTLESYRvJnZ5',
    'https://lh3.googleusercontent.com/aida-public/AB6AXuCOog6N7Cy9UA1m4epH86bBgydklkZmuTCk4gg7G7WKKst-i9bd-PNLiwy8bGIN0uV9-ApLdvSlkmnpwrx-KwRTpBLWbI3tDm0C0pZxZ9xYV-yCuFG0WZvrQ6f79bBru3eotrInsBt0zwQhzyMBsr4q6I-6gGinaOT53ukT2j2AVBoqd3lqCQQ1rl6wuMNGHg8kAd0WsQ7onsIL0lTry-lDKEWc3PT48Nr0GNDrHj1jFG_Y5st73SntmFyuLxUgaI3P4A_FMGfC6SOq'
  ];

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
              const imageIndex = index % mockImages.length;

              return (
                <div
                  key={item.id || item.item_id}
                  className="group relative flex gap-4 bg-white dark:bg-white/5 p-3 rounded-xl shadow-sm border border-gray-100 dark:border-white/5 transition-transform active:scale-[0.99]"
                >
                  {/* Image */}
                  <div className="relative shrink-0 overflow-hidden rounded-lg w-24 h-24 bg-gray-100">
                    <div
                      className="w-full h-full bg-center bg-cover"
                      style={{ backgroundImage: `url(${mockImages[imageIndex]})` }}
                      aria-label={item.name || 'Product image'}
                    />
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
                        ${(item.price_for_unit || 0).toFixed(2)} / {item.group || 'unit'}
                      </p>
                    </div>

                    <div className="flex items-end justify-between mt-2">
                      <p className="text-primary font-bold text-lg">${itemTotal.toFixed(2)}</p>

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
              <h3 className="text-text-main-light dark:text-text-main-dark text-lg font-bold mb-2">Your cart is empty</h3>
              <p className="text-text-sub-light dark:text-text-sub-dark text-sm text-center mb-6">
                Add some delicious items to get started
              </p>
              <Link
                href="/"
                className="bg-primary hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/30 transition-all"
              >
                Browse Products
              </Link>
            </div>
          )}
        </div>

        {/* Price Breakdown */}
        {cartItems.length > 0 && (
          <div className="px-4 py-4 mt-2">
            <div
              className="flex gap-3 bg-amber-50 dark:bg-amber-900/10 p-4 rounded-xl border border-amber-100 dark:border-amber-900/20">
              <span className="material-symbols-outlined text-amber-600 dark:text-amber-500 shrink-0">info</span>
              <p className="text-sm font-medium text-amber-900 dark:text-amber-100 leading-relaxed">
                This is your last purchase without subscription and next time you will have to subscribe.
              </p>
            </div>
          </div>
        )}
      </div>

      {/* Sticky Footer for Checkout - Only shown when cart has items */}
      {cartItems.length > 0 && (
        <div className="fixed bottom-16 left-0 right-0 max-w-md mx-auto p-4 z-40">
          <button
            onClick={handleCheckout}
            className="w-full bg-primary hover:bg-red-600 text-white font-bold py-4 px-6 rounded-xl shadow-lg shadow-primary/30 flex items-center justify-between active:scale-[0.98] transition-all"
          >
            <span>Checkout</span>
            <span>${cartTotal.toFixed(2)}</span>
          </button>
        </div>
      )}
    </>
  );
}
