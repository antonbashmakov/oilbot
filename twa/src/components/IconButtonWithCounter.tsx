"use client";

import { useState, useEffect } from 'react';
import Link from 'next/link';

export type IconButtonWithCounterProps = {
  icon: string;
  count: number;
  href: string;
  ariaLabel: string;
  disabled: boolean;
};

export const IconButtonWithCounter: React.FC<IconButtonWithCounterProps> = ({ icon, count, href, ariaLabel, disabled }) => {
  const [badgeScale, setBadgeScale] = useState(1);
  const [currentCount, setCurrentCount] = useState(count);

  // Animate badge when count changes
  useEffect(() => {
    if (currentCount > 0) {
      setBadgeScale(1.3);
      const timer = setTimeout(() => setBadgeScale(1), 300);
      return () => clearTimeout(timer);
    }
  }, [currentCount]);

  useEffect(() => {
    setCurrentCount(count);
  }, [count]);

  return (
    <DisableableLink disabled={disabled} href={href} ariaLabel={ariaLabel}>
      <span className="material-symbols-outlined text-text-main-light dark:text-text-main-dark">
        {icon}
      </span>

      {/* Badge with count */}
      {currentCount > 0 && (
        <div
          className="absolute -top-1.5 -right-1.5 h-5 w-5 rounded-full bg-primary text-white 
                     flex items-center justify-center text-xs font-bold transition-transform duration-300 ring-2 ring-white dark:ring-surface-dark"
          style={{ transform: `scale(${badgeScale})` }}
        >
          {currentCount > 9 ? '9+' : currentCount}
        </div>
      )}
    </DisableableLink>
  );
}

const DisableableLink: React.FC<{ disabled?: boolean, children?: React.ReactNode, href: string, ariaLabel: string }> = ({ disabled, children, href, ariaLabel }) => {
  if (disabled) {
    return <div
      className="relative flex size-10 items-center justify-center rounded-full bg-background-light dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors"
      aria-label={ariaLabel}
    >
      {children}
    </div>

  }
  return (
    <Link
      href={href}
      className="relative flex size-10 items-center justify-center rounded-full bg-background-light dark:bg-white/10 hover:bg-gray-100 dark:hover:bg-white/20 transition-colors"
      aria-label={ariaLabel}
    >
      {children}
    </Link>
  );
};