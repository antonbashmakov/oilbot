"use client";

import { useRouter } from "next/navigation";

type HeaderProps = {
  title?: string;
  badge?: string;
  statusText?: string;
  vehicle?: string;
  onBack?: () => void;
};

const Header = ({
  title = "LubeBot AI",
  badge = "DIAG",
  statusText = "Online - Engine Diagnostician",
  vehicle = "Škoda",
  onBack,
}: HeaderProps) => {
  const router = useRouter();

  const handleBack = () => {
    if (onBack) {
      onBack();
      return;
    }

    if (typeof window !== "undefined" && window.history.length > 1) {
      router.back();
      return;
    }

    router.push("/");
  };

  return (
    <header className="fixed top-0 left-0 w-full z-50 flex items-center justify-between px-layout-margin-mobile h-16 bg-surface shadow-sm">
      <div className="flex items-center gap-space-xs">
        <button
          type="button"
          aria-label="Go back"
          onClick={handleBack}
          className="w-10 h-10 rounded-lg flex items-center justify-center text-on-surface-variant hover:bg-surface-container-high transition-colors active:scale-95 transition-transform duration-150"
        >
          <span className="material-symbols-outlined text-[22px]">arrow_back</span>
        </button>
        <div className="relative flex items-center justify-center w-10 h-10 rounded-lg bg-surface-container border border-white/5">
          <span
            className="material-symbols-outlined text-secondary text-[22px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            smart_toy
          </span>
          <span className="absolute -top-0.5 -right-0.5 flex h-2.5 w-2.5">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-tertiary opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-tertiary border-2 border-surface"></span>
          </span>
        </div>
        <div className="flex flex-col ml-0.5">
          <div className="flex items-center gap-1.5">
            <span className="font-headline-sm text-headline-sm font-bold text-primary tracking-tight">
              {title}
            </span>
            <span className="inline-flex items-center px-1.5 py-0.2 bg-tertiary/10 text-tertiary text-[9px] font-label-sm font-semibold rounded tracking-wider border border-tertiary/20">
              {badge}
            </span>
          </div>
          <div className="flex items-center gap-1">
            <span className="w-1.5 h-1.5 rounded-full bg-tertiary animate-pulse"></span>
            <span className="font-label-sm text-label-sm text-on-surface-variant tracking-normal">
              {statusText}
            </span>
          </div>
        </div>
      </div>
      <div className="flex items-center gap-1.5 bg-surface-container-high px-2.5 py-1.5 rounded-lg border border-white/5 shadow-inner">
        <span className="material-symbols-outlined text-primary text-[18px]">directions_car</span>
        <span className="font-mono-metric text-label-sm text-on-surface font-semibold tracking-wide">
          {vehicle}
        </span>
      </div>
    </header>
  );
};

export default Header;
