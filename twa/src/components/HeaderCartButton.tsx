"use client";

import { useCartStore } from '@/api';
import { useCustomer } from '@/api/user/provider';
import { useState, useEffect, useCallback } from 'react';
import Link from 'next/link';

export const HeaderCartButton: React.FC = () => {
  const { customer } = useCustomer();
  const { getCartCount } = useCartStore(customer?.id);
  
  const cartCount = getCartCount();
  const [badgeScale, setBadgeScale] = useState(1);

  // Animate badge when cart count changes
  useEffect(() => {
    if (cartCount > 0) {
      setBadgeScale(1.3);
      const timer = setTimeout(() => setBadgeScale(1), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  const getCartHref = useCallback(() => {
    if (!customer || !customer.stats) {
      return "/";
    }

    if(customer.subscription?.status === "ACTIVE" || (customer.stats.number_of_free_orders >= 1)) return "/cart";
    if(customer.balance.value >= 300) return "/cart";

    return "/subscription";
  }, [customer?.stats?.number_of_fulfilled_orders, customer?.stats?.number_of_active_orders]);

  const cartHref = getCartHref();

  return (
    <Link 
      href={cartHref}
      className="relative flex size-10 items-center justify-center rounded-full bg-background-light dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors"
      aria-label="Shopping cart"
    >
      <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">
        shopping_cart
      </span>
      
      {/* Cart badge with count */}
      {cartCount > 0 && (
        <div 
          className="absolute top-1.5 right-1.5 h-5 w-5 rounded-full bg-primary text-white 
                     flex items-center justify-center text-xs font-bold transition-transform duration-300 ring-2 ring-white dark:ring-surface-dark"
          style={{ transform: `scale(${badgeScale})` }}
        >
          {cartCount > 9 ? '9+' : cartCount}
        </div>
      )}
    </Link>
  );
};
