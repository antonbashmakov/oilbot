import { navItems } from "@/data/products";
import { usePathname } from "next/navigation";

export function Navigation() {

  const pathname = usePathname();
  const isLandingPage = pathname === "/";  

  if(!isLandingPage) {
    return null;
  }

  return (
    <div className="fixed bottom-0 left-0 w-full z-40 bg-surface-light dark:bg-surface-dark border-t border-gray-100 dark:border-white/5 px-4 pb-6 pt-2">
      <div className="flex items-center justify-between">
        {navItems.map((item) => (
          <a
            key={item.id}
            href="#"
            className={`flex flex-1 flex-col items-center justify-center gap-1 transition-colors ${
              item.active
                ? "text-primary"
                : "text-text-sub-light dark:text-text-sub-dark hover:text-text-main-light dark:hover:text-text-main-dark"
            }`}
          >
            <span className={`material-symbols-outlined ${item.active ? "filled" : ""}`}>
              {item.icon}
            </span>
            <span className={`text-[10px] ${item.active ? "font-bold" : "font-medium"}`}>
              {item.label}
            </span>
          </a>
        ))}
      </div>
    </div>
  );
}
