"use client";

import { usePathname } from 'next/navigation';
import { useTranslations } from 'next-intl';

interface ShareButtonProps {
  className?: string;
  text?: string;
  payload?: Record<string, any>;
}

export const ShareButton: React.FC<ShareButtonProps> = ({
  className = '',
  text,
  payload,
}) => {
  const pathname = usePathname();
  const t = useTranslations('share');
  
  // Use provided text or default translation
  const shareText = text || t('defaultText');

  const handleShare = () => {

    const sharePayload = payload || {
      type: "path",
      value: pathname,
    };

    // Encode payload to base64
    const payloadString = JSON.stringify(sharePayload);
    const base64Payload = btoa(encodeURIComponent(payloadString));

    // Check if Telegram WebApp is available
    const tg = (window as any)?.Telegram?.WebApp;
    if (tg && tg.shareData) {
      // Construct share URL
      const shareUrl = `https://t.me/PoSebstoimostiBot?start=${base64Payload}`;

      // Share data via Telegram
      tg.shareData({
        text: shareText,
        url: shareUrl,
      });
    } else {
      const shareUrl = `https://t.me/PoSebstoimostiBot?start=${base64Payload}`;

      // Use Web Share API if available
      if (navigator.share) {
        navigator.share({
          title: t('shareTitle'),
          text: shareText,
          url: shareUrl,
        }).catch((error) => {
          console.log('Error sharing:', error);
          // Fallback to clipboard
          navigator.clipboard.writeText(shareUrl).then(() => {
            alert(t('linkCopied'));
          }).catch(e => alert(t('linkCopyError', { error })));
        });
      } else {
        // Fallback to clipboard
        navigator.clipboard.writeText(shareUrl).then(() => {
          alert(t('linkCopied'));
        });
      }
    }
  };

  return (
    <button
      onClick={handleShare}
      className={`flex items-center justify-center size-10 rounded-full bg-gray-100 dark:bg-white/10 text-gray-900 dark:text-text-main-dark active:scale-95 transition-transform ${className}`}
      aria-label="Share product"
    >
      <span className="material-symbols-outlined">share</span>
    </button>
  );
};

export default ShareButton;
