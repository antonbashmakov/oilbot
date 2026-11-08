"use client";

import { useState } from "react";
import { useFormatter, useTranslations } from "next-intl";

const MAX_KM = 999_999;
const SLIDER_MAX_KM = 500_000;
const SLIDER_STEP_KM = 5_000;
const PRESETS_KM = [50_000, 100_000, 150_000, 200_000, 250_000];
const DEFAULT_KM = 100_000;

type MileagePickerSheetProps = {
  initialKm?: number;
  onClose: () => void;
  onDone: (km: number) => void;
};

/**
 * Bottom sheet for choosing the car's mileage: a number field, a slider and common values.
 */
const MileagePickerSheet = ({ initialKm, onClose, onDone }: MileagePickerSheetProps) => {
  const t = useTranslations("Mileage");
  const format = useFormatter();
  const [km, setKm] = useState<number>(initialKm ?? DEFAULT_KM);

  const setFromInput = (value: string) => {
    const digits = value.replace(/\D/g, "");
    setKm(digits === "" ? 0 : Math.min(Number(digits), MAX_KM));
  };

  return (
    <div className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm">
      <div className="flex-1 w-full" onClick={onClose} />

      <div role="dialog" aria-modal="true" aria-labelledby="mileage-picker-title" className="relative w-full max-w-chat-max-width mx-auto bg-surface-container border-t border-white/10 rounded-t-[1.5rem] shadow-2xl p-4 sm:p-6 flex flex-col space-y-4">
        <div className="flex flex-col items-center">
          <div className="w-12 h-1.5 rounded-full bg-surface-variant mb-3" />
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">av_timer</span>
              <h2 id="mileage-picker-title" className="font-headline-sm text-headline-sm font-bold text-on-surface">
                {t("sheetTitle")}
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              aria-label={t("close")}
              className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors active:scale-95"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        <label className="block bg-surface-container-low rounded-xl p-3 border border-white/5">
          <span className="block text-[10px] text-on-surface-variant font-label-sm uppercase tracking-wide">{t("inputLabel")}</span>
          <input
            type="text"
            inputMode="numeric"
            value={format.number(km)}
            onChange={(e) => setFromInput(e.target.value)}
            // 16px: iOS Safari zooms the page into inputs with smaller text.
            className="w-full bg-transparent border-0 font-mono-metric text-on-surface font-bold text-[24px] focus:ring-0 focus:outline-none p-0"
          />
        </label>

        <input
          type="range"
          min={0}
          max={SLIDER_MAX_KM}
          step={SLIDER_STEP_KM}
          value={Math.min(km, SLIDER_MAX_KM)}
          onChange={(e) => setKm(Number(e.target.value))}
          aria-label={t("sliderLabel")}
          className="w-full accent-primary"
        />

        <div className="space-y-1.5">
          <div className="text-[11px] text-on-surface-variant font-label-sm">{t("presets")}</div>
          <div className="flex flex-wrap gap-2">
            {PRESETS_KM.map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setKm(preset)}
                className={`px-3 py-1.5 rounded-full border text-label-md font-mono-metric active:scale-95 transition-all ${km === preset ? "bg-primary/15 border-primary text-primary" : "bg-surface-container-low border-white/10 text-on-surface-variant"}`}
              >
                {t("preset", { km: format.number(preset) })}
              </button>
            ))}
          </div>
        </div>

        <button
          type="button"
          onClick={() => onDone(km)}
          disabled={km <= 0}
          className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-label-md font-bold shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:active:scale-100"
        >
          <span className="material-symbols-outlined text-[20px]">check</span>
          <span>{t("done")}</span>
        </button>
      </div>
    </div>
  );
};

export default MileagePickerSheet;
