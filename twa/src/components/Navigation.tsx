import { navItems } from "@/data/products";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from 'next-intl';
import { HeaderCartButton } from "./HeaderCartButton";
import { IconButtonWithCounter } from "./IconButtonWithCounter";
import { useCustomer } from "@/api/user/provider";
import { useCartStore } from "@/api";

export function Navigation() {

  const pathname = usePathname();
  const t = useTranslations('navigation');
  const isLandingPage = pathname === "/";
  const { customer } = useCustomer();

  const { getCartCount } = useCartStore(customer?.id);

  const cartCount = getCartCount();

  if (!isLandingPage) {
    return null;
  }

  // Determine which nav item is active based on current path
  const getNavItemHref = (item: typeof navItems[0]) => {
    switch (item.label) {
      case 'Home':
        return '/';
      case 'Orders':
        return '/orders';
      case 'Profile':
        return '/profile';
      case 'Cart':
        return '/cart';
      default:
        return '#';
    }
  };

  // Since this component only shows on landing page, all items are inactive except Home
  const isItemActive = (item: typeof navItems[0]) => {
    return item.label === 'Home'; // Only Home is active on landing page
  };

  // Map nav items to translated labels
  const translatedNavItems = navItems.map(item => {
    const translationKey = item.label.toLowerCase() as 'home' | 'search' | 'orders' | 'profile';
    return {
      ...item,
      translatedLabel: t(translationKey) || item.label
    };
  });

  return (
    <div className="fixed bottom-0 left-0 w-full z-40 bg-surface-light dark:bg-surface-dark border-t border-gray-100 dark:border-white/5 px-4 pb-6 pt-2">
      <div className="flex items-center justify-between">
        {translatedNavItems.map((item) => {
          const href = getNavItemHref(item);
          const active = isItemActive(item);

          if (item.label === 'Cart') {
            return <ButtonContainer active={active}><IconButtonWithCounter disabled={!customer} icon="shopping_cart" count={cartCount} href="/cart" ariaLabel="Cart" /></ButtonContainer>;
          }
          if (item.label === 'Orders') {
            return <ButtonContainer active={active}><IconButtonWithCounter disabled={!customer} icon="receipt_long" count={customer?.stats?.number_of_active_orders || 0} href="/orders" ariaLabel="Orders" /></ButtonContainer>;
          }

          return (
            <Link
              key={item.id}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${active
                ? "text-primary"
                : "text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark"
                }`}
            >
              <span className={`material-symbols-outlined ${active ? "filled" : ""}`}>
                {item.icon}
              </span>
              <span className={`text-[10px] ${active ? "font-bold" : "font-medium"}`}>
                {item.translatedLabel}
              </span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}

const ButtonContainer: React.FC<{ children: React.ReactNode; active: boolean }> = ({ children, active }) => {
  return (
    <div className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${active
      ? "text-primary"
      : "text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark"
      }`}>
      {children}
    </div>
  );
};