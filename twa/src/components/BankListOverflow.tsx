"use client";

import { useState, useEffect } from 'react';
import { useTranslations } from 'next-intl';
import { useGetCustomerBanksQuery } from '@/api';
import { useUser } from '@/api/user/provider';
import { Bank as ApiBank } from '@/api/models';

interface BankListOverflowProps {
  isOpen: boolean;
  onClose: () => void;
  onBankSelect: (bankId: string) => void;
}

export const BankListOverflow: React.FC<BankListOverflowProps> = ({
  isOpen,
  onClose,
  onBankSelect
}) => {
  const t = useTranslations('subscription');
  const { user } = useUser();
  const [selectedBank, setSelectedBank] = useState<string | null>(null);

  // Fetch banks from API - only fetch when component is open and user is available
  const { data: banksData, isLoading, error } = useGetCustomerBanksQuery(user?.id);

  const handleBankSelect = (bankId: string) => {
    setSelectedBank(bankId);
    onBankSelect(bankId);
    // Close after a short delay to show selection
    setTimeout(() => {
      onClose();
      setSelectedBank(null);
    }, 500);
  };

  const handleOverlayClick = (e: React.MouseEvent) => {
    if (e.target === e.currentTarget) {
      onClose();
    }
  };

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && isOpen) {
        onClose();
      }
    };

    if (isOpen) {
      document.addEventListener('keydown', handleEscape);
      document.body.style.overflow = 'hidden';
    }

    return () => {
      document.removeEventListener('keydown', handleEscape);
      document.body.style.overflow = 'unset';
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <>
      {/* Backdrop overlay - extracted from HTML */}
      <div
        className="fixed inset-0 z-50 bg-black/60 backdrop-blur-[2px] flex flex-col justify-end"
        onClick={handleOverlayClick}
        aria-hidden="true"
      >
        {/* Bank selection overflow container */}
        <div className="bg-white dark:bg-background-dark w-full rounded-t-3xl max-h-[85%] flex flex-col shadow-[0_-8px_30px_rgb(0,0,0,0.12)]">
          {/* Header */}
          <div className="relative p-6 border-b border-gray-100 dark:border-white/5 flex items-center justify-between">
            <div>
              <h3 className="text-gray-900 dark:text-white font-extrabold text-lg">
                {t('selectBank') || 'Supported Banks'}
              </h3>
              <p className="text-gray-500 dark:text-gray-400 text-xs">
                {t('selectBankDescription') || 'Choose your bank to pay via SBP'}
              </p>
            </div>
            <button
              onClick={onClose}
              className="flex items-center justify-center w-8 h-8 rounded-full bg-gray-100 dark:bg-white/5 text-gray-900 dark:text-white active:scale-95 transition-all"
              aria-label="Close"
            >
              <span className="material-symbols-outlined" style={{ fontSize: "20px" }}>
                close
              </span>
            </button>
          </div>

          {/* Bank list with loading/error states */}
          <div className="flex-1 overflow-y-auto no-scrollbar p-4">
            {isLoading ? (
              <div className="flex flex-col items-center justify-center py-12">
                <span className="material-symbols-outlined animate-spin text-primary mb-4" style={{ fontSize: "32px" }}>
                  refresh
                </span>
                <p className="text-gray-500 dark:text-gray-400 text-sm">
                  {t('loading') || 'Loading banks...'}
                </p>
              </div>
            ) : error ? (
              <div className="flex flex-col items-center justify-center py-12 px-4">
                <span className="material-symbols-outlined text-red-500 mb-4" style={{ fontSize: "32px" }}>
                  error
                </span>
                <p className="text-gray-900 dark:text-white font-medium text-sm mb-2 text-center">
                  {t('error') || 'Error loading banks'}
                </p>
                <p className="text-gray-500 dark:text-gray-400 text-xs text-center">
                  {t('tryAgain') || 'Please try again later'}
                </p>
                <button
                  onClick={() => window.location.reload()}
                  className="mt-4 px-4 py-2 bg-primary text-white rounded-lg text-sm font-medium hover:bg-red-600 transition-colors"
                >
                  {t('retry') || 'Retry'}
                </button>
              </div>
            ) : banksData?.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-12">
                <span className="material-symbols-outlined text-gray-400 mb-4" style={{ fontSize: "32px" }}>
                  account_balance
                </span>
                <p className="text-gray-500 dark:text-gray-400 text-sm text-center">
                  {t('noBanksAvailable') || 'No banks available at the moment'}
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {banksData?.map((bank) => (
                  <button
                    key={bank.BankId}
                    onClick={() => handleBankSelect(bank.BankId)}
                    className={`w-full flex items-center gap-4 p-3 rounded-2xl hover:bg-gray-50 dark:hover:bg-white/5 transition-colors border ${
                      selectedBank === bank.BankId
                        ? 'border-primary/20 bg-primary/5'
                        : 'border-transparent active:border-primary/20'
                    } group text-left`}
                    disabled={selectedBank !== null}
                  >
                    <div className={`
                      w-10 h-10 rounded-xl flex items-center justify-center overflow-hidden flex-shrink-0

                        'bg-gray-100 dark:bg-gray-800'
                      }
                    `}>
                      {bank.BankLogo ? (
                        <img 
                          src={bank.BankLogo} 
                          alt={bank.BankName}
                          className="w-6 h-6 object-contain"
                          onError={(e) => {
                            // Fallback to icon if logo fails to load
                            e.currentTarget.style.display = 'none';
                            const icon = document.createElement('span');
                            icon.className = `material-symbols-outlined`;
                            icon.style.fontSize = '24px';
                            icon.textContent = "";
                            e.currentTarget.parentElement?.appendChild(icon);
                          }}
                        />
                      ) : (
                        <span className={`material-symbols-outlined `} style={{ fontSize: "24px" }}>
                          {bank.BankLogo}
                        </span>
                      )}
                    </div>
                    <div className="flex-1">
                      <p className="text-sm font-bold text-gray-900 dark:text-white">{bank.BankName}</p>
                    </div>
                    <span
                      className={`material-symbols-outlined ${
                        selectedBank === bank.BankId
                          ? 'text-primary'
                          : 'text-gray-300 dark:text-gray-600 group-hover:text-primary transition-colors'
                      }`}
                      style={{ fontSize: "20px" }}
                    >
                      {selectedBank === bank.BankId ? 'check_circle' : 'chevron_right'}
                    </span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="p-6 bg-gray-50 dark:bg-white/5 flex items-center justify-center gap-2">
            <span className="text-[10px] text-gray-400 dark:text-gray-500 font-medium uppercase tracking-widest">
              {t('moreBanksMessage') || 'More banks being added monthly'}
            </span>
          </div>
        </div>
      </div>

      {/* Animation styles */}
      <style jsx global>{`
        @keyframes slide-up {
          from {
            opacity: 0;
            transform: translateY(100%);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        
        .no-scrollbar {
          -ms-overflow-style: none;
          scrollbar-width: none;
        }
        
        .no-scrollbar::-webkit-scrollbar {
          display: none;
        }
      `}</style>
    </>
  );
};

export default BankListOverflow;
