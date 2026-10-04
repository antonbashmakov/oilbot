"use client";

import { Product } from "@/api/models";
import Image from "next/image";
import { useState } from "react";
import CheckoutSheet, { PRODUCT_IMAGE } from "./CheckoutSheet";

const GoodsItem = ({ item, priority }: { item: Product; priority?: boolean }) => {
  const [checkoutOpen, setCheckoutOpen] = useState(false);

  return (
    <div className="snap-center shrink-0 w-[275px] bg-surface-container rounded-xl border border-white/10 p-3.5 flex flex-col justify-between relative shadow-lg">
      <div>
        <div className="flex items-center justify-between gap-1 mb-2">
          <span className="px-2 py-0.5 rounded-full bg-tertiary/15 text-tertiary font-label-sm text-[10px] border border-tertiary/30 font-semibold tracking-wide">
            {item.features?.oem_approvals?.splice(0, 1).join("/")}
          </span>
          <span className="text-primary font-label-sm text-[10px] font-mono-metric font-bold uppercase">
            {item.features?.sae}
          </span>
        </div>
        <div className="flex items-baseline justify-between mb-2">
          <h3 className="font-headline-sm text-headline-sm text-on-surface font-bold leading-tight">
            {item.name}
          </h3>
        </div>
        <div className="flex items-center gap-1 text-[11px] text-on-surface-variant font-label-sm mb-3">
          <span
            className="material-symbols-outlined text-primary-container text-[14px]"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            star
          </span>
          <span className="text-on-surface font-bold">5</span>
          <span>(10 reviews)</span>
          <span className="mx-1 text-outline-variant">•</span>
          <span className="text-secondary-fixed-dim"></span>
        </div>
        <div className="w-full h-32 bg-surface-container-lowest rounded-lg mb-3 flex items-center justify-center p-2 relative overflow-hidden border border-white/5">
          <Image
            className="h-full w-auto object-contain filter drop-shadow-[0_4px_12px_rgba(0,0,0,0.8)]"
            src={PRODUCT_IMAGE}
            alt={item.name}
            width={150}
            height={150}
            priority={priority}
          />
          <span className="absolute bottom-1.5 right-2 font-mono-metric text-[10px] text-on-surface-variant bg-surface-variant/80 px-1.5 py-0.5 rounded">
            {item.unit}
          </span>
        </div>
      </div>
      <div className="pt-1 border-t border-white/5 flex items-center justify-between gap-2">
        <div>
          <div className="font-mono-metric text-lg font-bold text-on-surface">{item.price} ₽</div>
          <div className="font-label-sm text-[10px] text-on-surface-variant tracking-tight">
            {(item.price).toFixed(2)} / {item.unit}
          </div>
        </div>
        <button
          type="button"
          onClick={() => setCheckoutOpen(true)}
          className="flex items-center gap-1.5 px-4 py-2 bg-primary-container hover:bg-primary text-on-primary-container font-label-md font-bold rounded-lg active:scale-95 transition-all shadow-md"
        >
          <span className="material-symbols-outlined text-[16px]" style={{ fontVariationSettings: "'FILL' 1" }}>
            bolt
          </span>
          <span>Buy</span>
        </button>
      </div>
      <CheckoutSheet
        key={`checkout-${checkoutOpen}`}
        item={item}
        open={checkoutOpen}
        onClose={() => setCheckoutOpen(false)}
        image={PRODUCT_IMAGE}
      />
    </div>
  );
};

export default GoodsItem;