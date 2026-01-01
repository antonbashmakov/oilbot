"use client";

import { useCartStore } from '@/api';
import { useUser } from '@/api/user/provider';
import { useState, useEffect } from 'react';

export const HeaderCartButton: React.FC = () => {
  const { user } = useUser();
  const { getCartCount } = useCartStore(user?.id);
  
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

  const handleCartClick = () => {
    // Navigate to cart page or open cart drawer
    console.log('Cart clicked, count:', cartCount);
    // In a real app, you would navigate to cart page or open a cart drawer
    alert(`Cart has ${cartCount} item${cartCount !== 1 ? 's' : ''}`);
  };

  return (
    <button 
      onClick={handleCartClick}
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
    </button>
  );
};
