"use client";

import { useState, useEffect } from 'react';
import { useCartStore } from '@/api';
import { useUser } from '@/api/user/provider';

interface CartButtonProps {
  itemId: string;
  itemData?: {
    name?: string;
    price?: number;
    fraction?: number;
    group?: string;
    price_for_unit?: number;
    quantity?: number;
  };
  className?: string;
}

export const CartButton: React.FC<CartButtonProps> = ({ 
  itemId, 
  itemData,
  className = '' 
}) => {
  const { user } = useUser();
  const { addToCart, getItemCountInCart, isLoading } = useCartStore(user?.id);
  
  const [isAnimating, setIsAnimating] = useState(false);
  const [showSuccess, setShowSuccess] = useState(false);
  const cartCount = (getItemCountInCart(itemId));
  
  const handleAddToCart = async () => {
    if (!user?.id) {
      console.error('No user ID available for cart');
      return;
    }
    
    setIsAnimating(true);
    
    try {
      await addToCart(itemId);
      
      // Show success animation
      setShowSuccess(true);
      setTimeout(() => setShowSuccess(false), 2000);
      
    } catch (error) {
      console.error('Failed to add to cart:', error);
    } finally {
      setIsAnimating(false);
    }
  };

  // Cart bage animation
  const [badgeScale, setBadgeScale] = useState(1);
  
  useEffect(() => {
    if (cartCount > 0) {
      setBadgeScale(1.3);
      const timer = setTimeout(() => setBadgeScale(1), 300);
      return () => clearTimeout(timer);
    }
  }, [cartCount]);

  return (
    <div className="relative flex justify-end items-center">
      <button
        onClick={handleAddToCart}
        disabled={isLoading || isAnimating || !user?.id}
        className={`
          relative flex size-10 items-center justify-center rounded-full 
          bg-white dark:bg-surface-dark text-primary shadow-lg 
          transition-all duration-300 active:scale-90 
          hover:bg-primary hover:text-white
          disabled:opacity-50 disabled:cursor-not-allowed
          ${className}
          ${isAnimating ? 'scale-110' : ''}
          ${showSuccess ? 'bg-green-500 text-white' : ''}
        `}
        aria-label="Add to cart"
      >
        {/* Animated plus icon */}
        <span className={`material-symbols-outlined transition-all duration-300 ${
          showSuccess ? 'scale-0 absolute' : 'scale-100'
        }`}>
          add
        </span>
        
        {/* Success checkmark */}
        <span className={`material-symbols-outlined transition-all duration-300 ${
          showSuccess ? 'scale-100' : 'scale-0 absolute'
        }`}>
          check
        </span>
        
        {/* Ripple animation effect */}
        {isAnimating && (
          <div className="absolute inset-0 rounded-full border-2 border-primary animate-ping"></div>
        )}
      </button>
      
      {/* Cart badge with count */}
      {cartCount > 0 && (
        <div 
          className="absolute -top-1 -right-1 h-5 w-5 rounded-full bg-primary text-white 
                     flex items-center justify-center text-xs font-bold transition-transform duration-300"
          style={{ transform: `scale(${badgeScale})` }}
        >
          {cartCount > 9 ? '9+' : cartCount}
        </div>
      )}
      
      {/* Flying animation element (would be more complex with actual DOM element flying to cart) */}
      {isAnimating && (
        <div className="absolute inset-0 pointer-events-none">
          <div className="absolute top-0 left-0 w-4 h-4 bg-primary rounded-full animate-fly-to-cart"></div>
        </div>
      )}
    </div>
  );
};

// Add CSS for the flying animation
const CartButtonStyles = () => (
  <style jsx global>{`
    @keyframes fly-to-cart {
      0% {
        transform: translate(0, 0) scale(1);
        opacity: 1;
      }
      100% {
        transform: translate(100px, -100px) scale(0);
        opacity: 0;
      }
    }
    
    .animate-fly-to-cart {
      animation: fly-to-cart 0.8s ease-in-out forwards;
    }
    
    @keyframes ping {
      75%, 100% {
        transform: scale(1.5);
        opacity: 0;
      }
    }
    
    .animate-ping {
      animation: ping 0.5s cubic-bezier(0, 0, 0.2, 1);
    }
  `}</style>
);

export default CartButton;
