"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";
import MileagePickerSheet from "./MileagePickerSheet";

type MileageWidgetProps = {
  shownAt: Date;
  onSubmit: (km: number) => void;
};

/**
 * Asks for the car's mileage (TWA-04); the chosen value goes to the chat through `onSubmit`.
 */
const MileageWidget = ({ shownAt, onSubmit }: MileageWidgetProps) => {
  const t = useTranslations("Mileage");
  const format = useFormatter();
  const [km, setKm] = useState<number | undefined>();
  const [pickerOpen, setPickerOpen] = useState(false);

  const handleDone = (value: number) => {
    setKm(value);
    setPickerOpen(false);
    onSubmit(value);
  };

  return (
    <div className="flex flex-col items-start max-w-[94%] space-y-1">
      <div className="bg-surface-container-low border border-primary/30 border-l-2 border-l-primary rounded-[1rem_1rem_1rem_0.25rem] p-3.5 shadow-sm text-on-surface font-body-md text-body-md space-y-2.5 w-full">
        <div className="flex items-center justify-between">
          <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded bg-primary/10 border border-primary/20 text-primary font-label-sm text-[11px]">
            <span className="material-symbols-outlined text-[14px]">speed</span>
            <span>{t("badge")}</span>
          </div>
          <span className="font-mono-metric text-[11px] text-on-surface-variant">{t("step", { step: 2, total: 2 })}</span>
        </div>
        <p className="leading-relaxed text-on-surface text-[13px]">{t("prompt")}</p>
        <div className="flex items-center justify-between bg-surface-container rounded-lg p-2.5 border border-white/5">
          <div className="flex items-center gap-2">
            <span className="material-symbols-outlined text-primary text-[20px]">av_timer</span>
            <div>
              <div className="text-[10px] text-on-surface-variant font-label-sm uppercase tracking-wide">{t("odometer")}</div>
              <div className="font-mono-metric text-on-surface font-bold text-[15px]">
                {km === undefined ? t("notSet") : t("value", { km: format.number(km) })}
              </div>
            </div>
          </div>
          <button
            type="button"
            onClick={() => setPickerOpen(true)}
            className="flex items-center gap-1 px-3 py-1.5 bg-primary-container hover:bg-primary text-on-primary-container rounded-lg font-label-md font-bold text-[12px] active:scale-95 transition-all shadow-sm"
          >
            <span className="material-symbols-outlined text-[15px]">tune</span>
            <span>{t("choose")}</span>
          </button>
        </div>
      </div>
      <div className="flex items-center gap-1 pl-1 text-on-surface-variant font-label-sm text-[11px]">
        <span className="material-symbols-outlined text-[13px] text-primary">psychology</span>
        <span>{format.dateTime(shownAt, { hour: "2-digit", minute: "2-digit" })}</span>
      </div>
      {pickerOpen && (
        <MileagePickerSheet initialKm={km} onClose={() => setPickerOpen(false)} onDone={handleDone} />
      )}
    </div>
  );
};

export default MileageWidget;
