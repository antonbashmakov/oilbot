import { navItems } from "@/data/products";
import { usePathname } from "next/navigation";
import Link from "next/link";
import { useTranslations } from 'next-intl';

export function Navigation() {

  const pathname = usePathname();
  const t = useTranslations('navigation');
  const isLandingPage = pathname === "/";  

  if(!isLandingPage) {
    return null;
  }

  // Determine which nav item is active based on current path
  const getNavItemHref = (item: typeof navItems[0]) => {
    switch(item.label) {
      case 'Home':
        return '/';
      case 'Orders':
        return '/orders';
      case 'Profile':
        return '/profile';
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
          
          return (
            <Link
              key={item.id}
              href={href}
              className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
                active
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
