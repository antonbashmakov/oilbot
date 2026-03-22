"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useTranslations } from "next-intl";

interface PhoneVerificationProps {
  returnTo?: "profile" | "cart";
}

export default function PhoneVerification({ returnTo = "profile" }: PhoneVerificationProps) {
  const router = useRouter();
  const t = useTranslations("phoneVerification");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [isVerifying, setIsVerifying] = useState(false);
  const [otp, setOtp] = useState(["", "", "", ""]);

  const handleBack = () => {
    if (isVerifying) {
      setIsVerifying(false);
    } else {
      router.back();
    }
  };

  const handleSendCode = () => {
    if (phoneNumber.trim()) {
      setIsVerifying(true);
    }
  };

  const handleOtpChange = (index: number, value: string) => {
    if (value.length <= 1 && /^\d*$/.test(value)) {
      const newOtp = [...otp];
      newOtp[index] = value;
      setOtp(newOtp);

      // Auto-focus next input
      if (value && index < 3) {
        const nextInput = document.getElementById(`otp-${index + 1}`);
        if (nextInput) {
          (nextInput as HTMLInputElement).focus();
        }
      }
    }
  };

  const handleVerify = () => {
    // In a real app, you would verify the OTP here
    const otpCode = otp.join("");
    if (otpCode.length === 4) {
      // Simulate successful verification
      // Redirect based on returnTo prop
      if (returnTo === "profile") {
        router.push("/profile");
      } else {
        router.push("/cart");
      }
    }
  };

  const handleResendCode = () => {
    // In a real app, you would resend the code here
    console.log("Resending code to:", phoneNumber);
  };

  // Format phone number for display (mask middle digits)
  const formatPhoneForDisplay = (phone: string) => {
    if (phone.length < 10) return phone;
    const areaCode = phone.substring(0, 3);
    const lastFour = phone.substring(phone.length - 4);
    return `+1 (${areaCode}) ***-${lastFour}`;
  };

  if (isVerifying) {
    return (
      <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
        {/* TopAppBar */}
        <header className="bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md border-none fixed top-0 w-full z-50 shadow-sm dark:shadow-none">
          <div className="flex items-center justify-between px-6 h-16 w-full max-w-screen-xl mx-auto">
            <button
              onClick={handleBack}
              className="text-text-sub-light dark:text-text-sub-dark hover:opacity-80 transition-opacity active:scale-95 transition-transform"
            >
              <span className="material-symbols-outlined">arrow_back</span>
            </button>
            <h1 className="font-extrabold tracking-tight text-xl font-black tracking-tighter text-primary uppercase">
              Weshop
            </h1>
            <div className="w-6"></div> {/* Spacer for centering */}
          </div>
        </header>

        <main className="flex-grow flex flex-col items-center justify-center px-6 pt-24 pb-32">
          <div className="w-full max-w-md mx-auto space-y-12">
            {/* Context & Identity */}
            <div className="space-y-4 text-center">
              <div className="flex justify-center mb-8">
                <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center">
                  <span className="material-symbols-outlined text-primary text-4xl">cell_tower</span>
                </div>
              </div>
              <h2 className="text-3xl font-bold text-text-main-light dark:text-text-main-dark tracking-tight leading-tight">
                {t("verifyTitle")}
              </h2>
              <p className="text-text-sub-light dark:text-text-sub-dark text-base">
                {t("sentCode")} <span className="font-semibold text-text-main-light dark:text-text-main-dark">
                  {formatPhoneForDisplay(phoneNumber)}
                </span>
              </p>
            </div>

            {/* OTP Input Grid */}
            <div className="flex justify-center gap-4">
              {[0, 1, 2, 3].map((index) => (
                <input
                  key={index}
                  id={`otp-${index}`}
                  className="w-16 h-20 text-center text-2xl font-bold bg-surface-light dark:bg-surface-dark border-none shadow-sm rounded-xl focus:ring-2 focus:ring-primary focus:outline-none transition-all placeholder:text-gray-300 dark:placeholder:text-gray-600 text-text-main-light dark:text-text-main-dark"
                  maxLength={1}
                  placeholder="0"
                  type="text"
                  inputMode="numeric"
                  value={otp[index]}
                  onChange={(e) => handleOtpChange(index, e.target.value)}
                  onKeyDown={(e) => {
                    if (e.key === "Backspace" && !otp[index] && index > 0) {
                      const prevInput = document.getElementById(`otp-${index - 1}`);
                      if (prevInput) {
                        (prevInput as HTMLInputElement).focus();
                      }
                    }
                  }}
                />
              ))}
            </div>

            {/* Resend Logic */}
            <div className="text-center">
              <button 
                onClick={handleResendCode}
                className="group inline-flex items-center gap-2"
              >
                <span className="text-text-sub-light dark:text-text-sub-dark font-medium text-sm">
                  {t("didntReceive")}
                </span>
                <span className="text-primary font-bold text-xs tracking-widest uppercase group-hover:underline transition-all">
                  {t("resendCode")}
                </span>
              </button>
            </div>
          </div>
        </main>

        {/* Fixed Footer Action */}
        <div className="fixed bottom-0 left-0 w-full p-6 bg-gradient-to-t from-background-light via-background-light/90 to-transparent dark:from-background-dark dark:via-background-dark/90">
          <div className="max-w-md mx-auto">
            <button
              onClick={handleVerify}
              className="w-full bg-primary text-white py-5 rounded-full font-bold text-sm uppercase tracking-widest shadow-lg shadow-primary/30 hover:opacity-90 active:scale-95 transition-all flex items-center justify-center gap-2"
            >
              <span>{t("verifyContinue")}</span>
              <span className="material-symbols-outlined text-lg">arrow_forward</span>
            </button>
          </div>
        </div>

        {/* Background Decoration */}
        <div className="fixed -z-10 top-0 left-0 w-full h-full overflow-hidden opacity-10 pointer-events-none">
          <div className="absolute -top-24 -right-24 w-96 h-96 bg-primary/10 rounded-full blur-3xl"></div>
          <div className="absolute top-1/2 -left-24 w-64 h-64 bg-primary/5 rounded-full blur-3xl"></div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col bg-background-light dark:bg-background-dark">
      {/* TopAppBar (Transactional - Suppressed Navigation) */}
      <header className="fixed top-0 w-full z-50 bg-white/95 dark:bg-surface-dark/95 backdrop-blur-md shadow-sm flex items-center justify-between px-6 h-16">
        <div className="flex items-center gap-4">
          <button 
            onClick={handleBack}
            className="active:scale-95 transition-transform text-primary"
          >
            <span className="material-symbols-outlined">arrow_back</span>
          </button>
        </div>
        <div className="text-xl font-black tracking-tighter text-primary uppercase">
          Weshop
        </div>
        <div className="w-6"></div> {/* Spacer for centering */}
      </header>

      <main className="flex-grow flex flex-col pt-24 px-6 pb-12 max-w-lg mx-auto w-full">
        {/* Hero Section */}
        <div className="mb-12 relative">
          <div className="absolute -top-12 -left-8 w-48 h-48 bg-primary/5 rounded-full blur-3xl"></div>
          <h1 className="text-3xl font-extrabold tracking-tight text-text-main-light dark:text-text-main-dark mb-3 leading-tight">
            {t("title")}
          </h1>
          <p className="text-text-sub-light dark:text-text-sub-dark text-lg font-medium leading-relaxed">
            {t("subtitle")}
          </p>
        </div>

        {/* Input Section */}
        <div className="space-y-6 relative z-10">
          {/* Glassmorphism Container for Input */}
          <div className="bg-surface-light dark:bg-surface-dark p-1 rounded-2xl shadow-sm border border-gray-200 dark:border-white/10 flex items-center h-20">
            {/* Country Code Selector */}
            <div className="flex items-center px-6 border-r border-gray-200 dark:border-white/10 h-10 group cursor-pointer">
              <span className="text-lg font-bold text-text-main-light dark:text-text-main-dark mr-2">RU</span>
              <span className="text-text-sub-light dark:text-text-sub-dark font-medium">+7</span>
              <span className="material-symbols-outlined text-text-sub-light dark:text-text-sub-dark ml-1 scale-75">expand_more</span>
            </div>
            {/* Phone Input */}
            <div className="flex-grow px-6">
              <input
                className="w-full bg-transparent border-none focus:ring-0 focus:outline-none text-xl font-bold tracking-widest placeholder:text-gray-300 dark:placeholder:text-gray-600 text-text-main-light dark:text-text-main-dark"
                maxLength={12}
                placeholder="000 000 0000"
                type="tel"
                value={phoneNumber}
                onChange={(e) => setPhoneNumber(e.target.value.replace(/\D/g, ""))}
              />
            </div>
          </div>

          {/* Contextual Information */}
          <div className="flex items-start gap-3 px-2">
            <span className="material-symbols-outlined text-primary scale-90 mt-0.5">verified_user</span>
            <p className="text-xs text-text-sub-light dark:text-text-sub-dark font-medium leading-normal">
              {t("smsInfo")}
            </p>
          </div>
        </div>

        {/* Visual Anchor (Culinary Aesthetic) */}
        <div className="mt-16 flex-grow flex items-center justify-center opacity-40">
          <div className="relative w-full aspect-[16/9] rounded-2xl overflow-hidden grayscale contrast-125 mix-blend-multiply dark:mix-blend-lighten">
            <img
              alt="Gourmet food aesthetic background"
              className="w-full h-full object-cover"
              src="https://lh3.googleusercontent.com/aida-public/AB6AXuBfiR5DHFydsD2SOHNtRHAHRfVUZXUbE6WO34Yr8zJxBpYaXqmF2APMeDHBfIx8CiyBF9eea7gCepnvCJOTtum7l5Yhf112HdTbTdDqRpqPWoPQiTigB8AcAN4MZyIwnbYMykMdtL0XmZHXQlpIEotxAcFRTwjOHQK4GKb1lpNYotl-RM_qk9VsrxbMLL-iKKG4FUBwUHl7a1y_yp3ld_sy2idAP9ZWaPM2d91ilsIFTqqLveQiXdBTpPaBqNUEKL8JEPA_nG9MLrMI"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-background-light dark:from-background-dark to-transparent"></div>
          </div>
        </div>

        {/* Sticky Action Button */}
        <div className="mt-auto pt-8">
          <button
            onClick={handleSendCode}
            className="w-full h-16 bg-primary text-white rounded-full font-bold text-sm uppercase tracking-[0.2em] shadow-lg shadow-primary/30 active:scale-95 transition-all flex items-center justify-center gap-2 group"
          >
            {t("sendCode")}
            <span className="material-symbols-outlined transition-transform group-hover:translate-x-1">arrow_forward</span>
          </button>
          <p className="text-center mt-6 text-[10px] font-bold uppercase tracking-widest text-gray-400 dark:text-gray-500">
            {t("termsPrefix")}{" "}
            <span className="text-primary underline decoration-primary/30">{t("terms")}</span>{" "}
            {t("and")}{" "}
            <span className="text-primary underline decoration-primary/30">{t("privacy")}</span>
          </p>
        </div>
      </main>

      {/* BottomNavBar Suppressed (Transactional Flow) */}
    </div>
  );
}
