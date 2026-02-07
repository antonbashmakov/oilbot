"use client";

import { useRouter } from "next/navigation";

export default function OrderDetailPage() {
  const router = useRouter();

  const handleBack = () => {
    router.back();
  };

  const handleViewBalance = () => {
    // Navigate to store balance page
    router.push("/profile");
  };

  const handleHelp = () => {
    // Open help or contact support
    window.open("https://t.me/posebestoimosti_saratov", "_blank");
  };

  return (
    <div className="relative flex h-full min-h-screen w-full flex-col max-w-md mx-auto bg-background-light dark:bg-background-dark group/design-root overflow-hidden shadow-2xl">
      {/* Header */}
      <div className="flex items-center bg-background-light/80 dark:bg-background-dark/80 backdrop-blur-md p-4 pb-2 justify-between sticky top-0 z-10">
        <button
          onClick={handleBack}
          className="text-text-main dark:text-white flex size-10 shrink-0 items-center justify-center rounded-full hover:bg-black/5 dark:hover:bg-white/10 transition-colors cursor-pointer"
          aria-label="Go back"
        >
          <span className="material-symbols-outlined">arrow_back_ios_new</span>
        </button>
        <h2 className="text-text-main dark:text-white text-lg font-bold leading-tight tracking-[-0.015em] flex-1 text-center pr-10">
          Fulfillment Details
        </h2>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto pb-40 no-scrollbar">
        {/* Refund notification */}
        <div className="px-4 pt-4 mb-6">
          <div className="bg-green-50 dark:bg-green-900/20 border border-green-100 dark:border-green-800/30 p-4 rounded-xl">
            <div className="flex gap-3 items-start">
              <span className="material-symbols-outlined text-green-600 dark:text-green-400 mt-0.5">
                account_balance_wallet
              </span>
              <div>
                <p className="text-green-800 dark:text-green-300 font-bold text-sm leading-tight">
                  Refund Processed
                </p>
                <p className="text-green-700/80 dark:text-green-400/80 text-xs mt-1">
                  The difference of <span className="font-bold">$0.60</span> has been added to your store balance because the
                  actual weight was lower than ordered.
                </p>
              </div>
            </div>
          </div>
        </div>

        {/* Itemized comparison */}
        <div className="px-4 mb-6">
          <div className="flex justify-between items-end mb-3 px-1">
            <h3 className="text-text-main dark:text-white text-lg font-bold">Itemized Comparison</h3>
            <span className="text-text-sub dark:text-[#dcb8be] text-xs font-medium">Order #2394-FDA</span>
          </div>
          <div className="space-y-3">
            {/* Item 1: Premium Ribeye Steak */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
              <div className="flex gap-4">
                <div 
                  className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuCRQnrZqEdMJggfCSqNWIUakd43HcQv1sVHSvJ0uhLLGGWLIEO-DTfTQYjJ0rTpVMq3DjbwjPGOafYdFrJb8u5HCyqQfzL12_XwNBlF-Pq5DMpWuMllv1Z3ponocH91-wGhXiUTxcZEENNq6Rd4GovL2B4llfYlrjp3ZAuXKx8FMTNwJqoBCEpkj6uRw3v5016O7GpmcNoBOM32DUgYTjIyCZIjbcOEv6pZPy0xLZIGpNxZEaAMQs9A2wpqWdWgql7FVAz7lBXJh3O4')" }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-text-main dark:text-white text-sm mb-1 truncate">
                    Premium Ribeye Steak
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-[11px] leading-tight">
                      <p className="text-text-sub dark:text-[#dcb8be] mb-0.5">Ordered</p>
                      <p className="text-text-main dark:text-white font-medium">500g ($15.00)</p>
                    </div>
                    <div className="text-[11px] leading-tight border-l border-gray-100 dark:border-white/10 pl-2">
                      <p className="text-primary font-bold mb-0.5">Actual Fulfilled</p>
                      <p className="text-text-main dark:text-white font-bold">480g ($14.40)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Item 2: Atlantic Salmon Fillet */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
              <div className="flex gap-4">
                <div 
                  className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDmNoUvnbFnhJGMGhn64mTlA8bG9lKeHSwGa1ZXUTlo-0--cR6B4ilGVpoat-cKca2dIKS0LodtNtnOkYVBspVUh1bmmtiAdaOt1ivJccpHPZK4Tmbvo2LW3tWR_XRoGXANTJWFTkVg8q-PPIAPeZ7UGMHL255lF-aduxjkDsStc3WLXbSzyyWbqIuPYWpmSlL96J_YI7yjYtxC1kKR-E9APW2XFptE9H3lhtysyxyw7Srig_nPofB9js4E8bjJxBTTKyc2MfUz3IHt')" }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-text-main dark:text-white text-sm mb-1 truncate">
                    Atlantic Salmon Fillet
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-[11px] leading-tight">
                      <p className="text-text-sub dark:text-[#dcb8be] mb-0.5">Ordered</p>
                      <p className="text-text-main dark:text-white font-medium">1 unit ($22.00)</p>
                    </div>
                    <div className="text-[11px] leading-tight border-l border-gray-100 dark:border-white/10 pl-2">
                      <p className="text-primary font-bold mb-0.5">Actual Fulfilled</p>
                      <p className="text-text-main dark:text-white font-bold">1 unit ($22.00)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Item 3: Aged Gouda */}
            <div className="bg-white dark:bg-surface-dark p-4 rounded-xl shadow-sm border border-gray-100 dark:border-white/5">
              <div className="flex gap-4">
                <div 
                  className="w-14 h-14 rounded-lg bg-gray-100 dark:bg-gray-800 shrink-0 bg-cover bg-center"
                  style={{ backgroundImage: "url('https://lh3.googleusercontent.com/aida-public/AB6AXuDyOaocTfH__x4hEJgYhag5RoiNJ4GRbsSWMlaLcKmMNYBhajnvbW8fy9P0ZYtsx4tPMNUoFMX18l1i0hHhmaWU30iXyCgyMKrq37czY7_TCcVYyrV3RXpiGp93ojrGo3HXU3GZzfxop-VeTG0fvJ2YjS-gFlAfJtG4i10T-NQ1tntuJlEf5Q0tqaE0dwAV2O1zFUCHIdtl5qfaU4KRpY-7P9JGFjcSWdm_Qb5qdOUgl-llR9H8g6p6xQFAdExKrKEy1UR4a0b9-dII')" }}
                />
                <div className="flex-1 min-w-0">
                  <h4 className="font-bold text-text-main dark:text-white text-sm mb-1 truncate">
                    Aged Gouda
                  </h4>
                  <div className="grid grid-cols-2 gap-2">
                    <div className="text-[11px] leading-tight">
                      <p className="text-text-sub dark:text-[#dcb8be] mb-0.5">Ordered</p>
                      <p className="text-text-main dark:text-white font-medium">200g ($12.50)</p>
                    </div>
                    <div className="text-[11px] leading-tight border-l border-gray-100 dark:border-white/10 pl-2">
                      <p className="text-primary font-bold mb-0.5">Actual Fulfilled</p>
                      <p className="text-text-main dark:text-white font-bold">200g ($12.50)</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Order totals */}
        <div className="px-4 mb-8">
          <div className="bg-white dark:bg-surface-dark rounded-xl shadow-sm border border-gray-100 dark:border-white/5 overflow-hidden">
            <div className="p-5 space-y-3">
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-sub dark:text-[#dcb8be]">Original Order Total</span>
                <span className="font-semibold text-text-main dark:text-white">$49.50</span>
              </div>
              <div className="flex justify-between items-center text-sm">
                <span className="text-text-sub dark:text-[#dcb8be]">Actual Fulfilled Total</span>
                <span className="font-semibold text-text-main dark:text-white">$48.90</span>
              </div>
              <div className="pt-3 mt-1 border-t border-gray-100 dark:border-white/10 flex justify-between items-center">
                <span className="text-base font-bold text-primary">Difference (Credit)</span>
                <span className="text-lg font-extrabold text-primary">$0.60</span>
              </div>
            </div>
            <div className="bg-gray-50 dark:bg-white/5 px-5 py-3 border-t border-gray-100 dark:border-white/10">
              <p className="text-[11px] text-text-sub dark:text-[#dcb8be] text-center italic">
                Final price based on actual weight prepared at our facility.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Footer buttons */}
      <div className="absolute bottom-0 left-0 w-full bg-white/90 dark:bg-background-dark/90 backdrop-blur-lg border-t border-gray-100 dark:border-white/5 p-4 flex flex-col gap-3 z-20 pb-8 rounded-t-2xl shadow-[0_-4px_12px_rgba(0,0,0,0.05)]">
        <button
          onClick={handleViewBalance}
          className="w-full bg-primary hover:bg-primary/90 text-white font-bold h-14 rounded-xl flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">account_balance_wallet</span>
          View Store Balance
        </button>
        <button
          onClick={handleHelp}
          className="w-full bg-transparent hover:bg-gray-50 dark:hover:bg-white/5 text-text-main dark:text-white font-bold h-14 rounded-xl border border-gray-200 dark:border-white/20 flex items-center justify-center gap-2 transition-all active:scale-[0.98]"
        >
          <span className="material-symbols-outlined text-[20px]">help</span>
          Questions about this weight?
        </button>
      </div>

      {/* Global styles for scrollbar */}
      <style jsx global>{`
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </div>
  );
}