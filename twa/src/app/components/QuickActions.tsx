"use client";

import { useTranslations } from "next-intl";

type QuickActionsProps = {
  onMileage: () => void;
};

const BUTTON = "shrink-0 flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-surface-container-low border border-secondary/30 text-secondary text-label-md hover:bg-secondary/10 active:scale-95 transition-all disabled:opacity-40 disabled:hover:bg-surface-container-low disabled:active:scale-100";

/**
 * Actions under the last message of the chat. Changing the car and the fuel type are not
 * implemented yet, so their buttons are disabled.
 */
const QuickActions = ({ onMileage }: QuickActionsProps) => {
  const t = useTranslations("QuickActions");

  return (
    <div role="group" aria-label={t("label")} className="flex items-center gap-2 overflow-x-auto no-scrollbar -mx-layout-margin-mobile px-layout-margin-mobile">
      <button type="button" onClick={onMileage} className={BUTTON}>
        <span className="material-symbols-outlined text-[15px]">speed</span>
        <span>{t("mileage")}</span>
      </button>
      <button type="button" disabled title={t("soon")} className={BUTTON}>
        <span className="material-symbols-outlined text-[15px]">directions_car</span>
        <span>{t("changeCar")}</span>
      </button>
      <button type="button" disabled title={t("soon")} className={BUTTON}>
        <span className="material-symbols-outlined text-[15px]">local_gas_station</span>
        <span>{t("fuelType")}</span>
      </button>
    </div>
  );
};

export default QuickActions;
