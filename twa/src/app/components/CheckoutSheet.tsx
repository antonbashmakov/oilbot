"use client";

import { Product } from "@/api/models";
import Image from "next/image";
import { useCallback, useState } from "react";

export type PaymentMethod = "sbp" | "card";

/**
 * Fallback product image. The `Product` model exposes no image field yet,
 * so the same asset used by `GoodsItem` is reused here.
 */
export const PRODUCT_IMAGE =
  "https://lh3.googleusercontent.com/aida-public/AB6AXuA-1pILp6nZiqo2BpeOZ0u6LMcQuG7EMseaae9xKpC_FkUVEwxlDFbhn0QuEM3eQZu4S-f0WZnuEtHur9OSIv64-9OZ6l6bn-eXpE2MtIVWnuzxGq9PJmijP5GMSSlbEgSA5q1GRPVRlNCNCZGY9wBoyTOQtwrbA6fVKPe-LLv2bg16cb2AMqIgIf9QPwQIsbmSdpATxUSWKqD2rED2PGVDJvD7jkh_TJHE_rSZZAJm7lk0hsgWze7DVw";

const formatPrice = (value: number) => `${value.toLocaleString("ru-RU")} ₽`;

type CheckoutSheetProps = {
  item: Product | null;
  open: boolean;
  onClose: () => void;
  image?: string;
  onPay?: (method: PaymentMethod) => void;
};

const CheckoutSheet = ({
  item,
  open,
  onClose,
  image = PRODUCT_IMAGE,
  onPay,
}: CheckoutSheetProps) => {
  const [quantity, setQuantity] = useState(1);
  const [address, setAddress] = useState("");

  const handleDecrement = useCallback(() => {
    setQuantity((q) => Math.max(1, q - 1));
  }, []);

  const handleIncrement = useCallback(() => {
    setQuantity((q) => q + 1);
  }, []);

  const handlePay = useCallback(
    (method: PaymentMethod) => {
      if (address.trim().length === 0) return;
      onPay?.(method);
    },
    [address, onPay]
  );

  if (!open || !item) return null;

  const oem = item.features?.oem_approvals?.slice(0, 1).join("/");
  const addressError = address.trim().length === 0;
  const total = item.price * quantity;

  return (
    <div
      id="checkout-sheet-overlay"
      className="fixed inset-0 z-50 flex flex-col justify-end bg-black/75 backdrop-blur-sm transition-all duration-300"
    >
      {/* Backdrop click to dismiss area */}
      <div id="checkout-backdrop" className="flex-1 w-full" onClick={onClose} />

      {/* Bottom Sheet Container */}
      <div className="relative w-full max-w-chat-max-width mx-auto bg-surface-container border-t border-white/10 rounded-t-[1.5rem] shadow-2xl p-4 sm:p-6 flex flex-col space-y-4 max-h-[90vh] overflow-y-auto no-scrollbar">
        {/* Drag Handle and Header */}
        <div className="flex flex-col items-center">
          <div className="w-12 h-1.5 rounded-full bg-surface-variant mb-3 cursor-grab" />
          <div className="w-full flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-primary text-[22px]">
                shopping_cart_checkout
              </span>
              <h2 className="font-headline-sm text-headline-sm font-bold text-on-surface">
                Оформление заказа
              </h2>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="w-8 h-8 rounded-full bg-surface-container-high hover:bg-surface-variant flex items-center justify-center text-on-surface-variant transition-colors active:scale-95"
              aria-label="Закрыть"
            >
              <span className="material-symbols-outlined text-[18px]">close</span>
            </button>
          </div>
        </div>

        {/* Product Summary Card */}
        <div className="bg-surface-container-low rounded-xl p-3.5 border border-white/5 flex gap-3 items-center">
          <div className="w-16 h-16 rounded-lg bg-surface-container-lowest border border-white/5 flex items-center justify-center p-1 shrink-0 overflow-hidden">
            <Image
              src={image}
              alt={item.name}
              width={64}
              height={64}
              className="h-full w-auto object-contain filter drop-shadow"
            />
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5 mb-0.5">
              {oem && (
                <span className="px-1.5 py-0.2 rounded bg-tertiary/10 text-tertiary font-label-sm text-[9px] font-semibold border border-tertiary/20">
                  {oem} OEM
                </span>
              )}
              <span className="text-[10px] font-mono-metric text-on-surface-variant">
                SKU: {item.article}
              </span>
            </div>
            <h4 className="font-headline-sm text-[15px] font-bold text-on-surface truncate">
              {item.name}
            </h4>
            <div className="flex items-center justify-between mt-1">
              <span className="font-mono-metric text-primary font-bold text-[14px]">
                {formatPrice(item.price)}{" "}
                <span className="text-on-surface-variant font-normal text-[11px]">
                  / {item.unit}
                </span>
              </span>
              <span className="font-label-sm text-[10px] text-tertiary">
                В наличии • Склад МСК
              </span>
            </div>
          </div>
        </div>


        {/* Quantity Selector & Calculation */}
        <div className="bg-surface-container-low rounded-xl p-3 border border-white/5 flex items-center justify-between">
          <div>
            <div className="text-body-md font-semibold text-on-surface text-[13px]">
              Количество
            </div>
            <div className="text-[11px] text-on-surface-variant">
              Канистра 4 л (хватает на ТО)
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              type="button"
              id="qty-minus"
              onClick={handleDecrement}
              className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface flex items-center justify-center font-bold text-lg active:scale-95 transition-all border border-white/5"
            >
              −
            </button>
            <span
              id="item-qty"
              className="font-mono-metric text-on-surface font-bold text-[16px] min-w-[1.5rem] text-center"
            >
              {quantity}
            </span>
            <button
              type="button"
              id="qty-plus"
              onClick={handleIncrement}
              className="w-8 h-8 rounded-lg bg-surface-container-high hover:bg-surface-variant text-on-surface flex items-center justify-center font-bold text-lg active:scale-95 transition-all border border-white/5"
            >
              +
            </button>
          </div>
        </div>

        {/* Delivery Address with Active Error State */}
        <div className="space-y-1.5">
          <label className="flex items-center justify-between text-body-md text-[13px] font-semibold text-on-surface">
            <span className="">
              Адрес доставки <span className="text-error">*</span>
            </span>
            <span className="text-on-surface-variant text-[11px] font-normal">
              Курьер СДЭК / Boxberry
            </span>
          </label>
          {/* Input field with active error styling */}
          <div className="relative">
            <div
              className={`flex items-center bg-surface-container-low border-2 rounded-xl px-3 py-2.5 focus-within:ring-1 transition-all shadow-inner ${
                addressError
                  ? "border-error focus-within:ring-error"
                  : "border-white/10 focus-within:ring-primary"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[18px] mr-2 ${
                  addressError ? "text-error" : "text-on-surface-variant"
                }`}
              >
                location_on
              </span>
              <input
                id="delivery-address-input"
                type="text"
                value={address}
                onChange={(e) => setAddress(e.target.value)}
                placeholder="Город, улица, дом, квартира/офис"
                className="flex-1 bg-transparent border-0 text-on-surface placeholder:text-on-surface-variant/60 text-body-md text-[13px] focus:ring-0 focus:outline-none p-0"
              />
              {addressError && (
                <span className="material-symbols-outlined text-error text-[18px]">
                  error
                </span>
              )}
            </div>
          </div>
          {/* Error Message Validation Banner */}
          {addressError && (
            <div className="flex items-center gap-1.5 text-error text-[12px] font-label-md pt-0.5">
              <span className="material-symbols-outlined text-[15px]">warning</span>
              <span className="">Пожалуйста, укажите адрес доставки</span>
            </div>
          )}
          <p className="text-on-surface-variant text-[11px] pl-1">
            Доставка возможна сегодня при заказе до 16:00.
          </p>
        </div>


        {/* Price Summary Row */}
        <div className="pt-2 border-t border-white/5 flex items-center justify-between">
          <div>
            <div className="text-on-surface-variant text-[11px]">Итого к оплате</div>
            <div
              id="total-price"
              className="font-mono-metric text-[22px] font-bold text-primary"
            >
              {formatPrice(total)}
            </div>
          </div>
          <div className="text-right text-[11px] text-tertiary flex items-center gap-1 font-label-sm">
            <span className="material-symbols-outlined text-[14px]">
              local_shipping
            </span>
            <span className="">Бесплатная доставка</span>
          </div>
        </div>

        {/* Payment Action Buttons (Pay by Card & Pay by SBP) */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5 pt-1">
          {/* SBP Fast Payment Action */}
          <button
            type="button"
            onClick={() => handlePay("sbp")}
            disabled={addressError}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-[#142850] hover:bg-[#1a3468] border border-[#2b59a8]/50 text-white font-label-md font-bold shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="inline-flex items-center justify-center w-5 h-5 rounded bg-[#e84e1b] text-white text-[10px] font-mono-metric font-extrabold">
              СБП
            </span>
            <span className="">Оплатить через СБП</span>
          </button>
          {/* Bank Card Payment Action */}
          <button
            type="button"
            onClick={() => handlePay("card")}
            disabled={addressError}
            className="w-full flex items-center justify-center gap-2 py-3 px-4 rounded-xl bg-primary-container hover:bg-primary text-on-primary-container font-label-md font-bold shadow-md active:scale-95 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
          >
            <span className="material-symbols-outlined text-[20px]">credit_card</span>
            <span className="">Оплатить картой</span>
          </button>
        </div>

        {/* Security Note */}
        <div className="flex items-center justify-center gap-1 text-[11px] text-on-surface-variant pt-1">
          <span className="material-symbols-outlined text-[13px] text-tertiary">
            shield
          </span>
          <span className="">
            Безопасная оплата 256-bit SSL • Официальная гарантия OEM
          </span>
        </div>
      </div>
    </div>
  );
};

export default CheckoutSheet;

