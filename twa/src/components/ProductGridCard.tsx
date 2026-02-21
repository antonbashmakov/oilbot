"use client";

import Link from 'next/link';
import { CartButton } from '@/components/CartButton';
import { IMAGE_TO_UUIDS } from '@/data/products';
import { format } from 'date-fns';
import { useTranslations } from 'next-intl';
import { ItemOverview } from '@/api/models';

interface ProductGridCardProps {
  item: ItemOverview;
  isMember: boolean;
}

export const ProductGridCard: React.FC<ProductGridCardProps> = ({ item, isMember }) => {
  const t = useTranslations('common');
  const delivery = item.deliveries[0];

  return (
    <Link
      key={item.id}
      href={`/items/${item.id}`}
      className="flex flex-col group/card"
    >
      <div className="relative mb-3 overflow-hidden rounded-xl bg-gray-100 dark:bg-white/5">
        {/* Image - using CDN with progressive loading (thumbnail first, then high-res) */}
        <div
          className="w-full aspect-square bg-center bg-cover transition-transform duration-500 group-hover/card:scale-105 relative"
          style={{
            backgroundImage: item.id && IMAGE_TO_UUIDS[item.id] ? `url(https://5rnru2cecx.ucarecd.net/${IMAGE_TO_UUIDS[item.id]}/-/preview/100x100/)` : 'none',
            backgroundColor: 'transparent',
          }}
          aria-label={item.name || 'Product image'}
        >
          {item.id && (
            <img
              src={IMAGE_TO_UUIDS[item.id] ? `https://5rnru2cecx.ucarecd.net/${IMAGE_TO_UUIDS[item.id]}/-/preview/400x400/` : undefined}
              alt={item.name || 'Product image'}
              className="absolute inset-0 w-full h-full object-cover opacity-0 transition-opacity duration-300"
              loading="lazy"
              onLoad={(e) => {
                e.currentTarget.classList.remove('opacity-0');
                e.currentTarget.classList.add('opacity-100');
              }}
              onError={(e) => {
                // If high-res fails, keep showing thumbnail
                e.currentTarget.style.display = 'none';
              }}
            />
          )}
        </div>

        {/* Quick Add FAB */}
        <div className="absolute bottom-2 right-2" onClick={(e) => e.preventDefault()}>
          <CartButton
            itemId={item.id}
            disabled={!delivery}
          />
        </div>
      </div>

      <div className="flex flex-col gap-1">
        <h3 className="text-text-main-light dark:text-text-main-dark text-base font-bold leading-tight min-h-[2.5em] leading-[1.25]">
          {item.name}
        </h3>
        {!isMember && <div className="flex flex-col gap-1 mt-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-primary text-base font-bold leading-none">{item.non_member_fraction_price_out}₽</span>
              <span className="text-[12px] font-bold text-primary uppercase bg-primary/5 px-1 rounded">
                {t('yourPrice')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 opacity-70">
              <span className="text-text-sub-light dark:text-text-sub-dark text-[13px] leading-none">
                {item.fraction_price_out}₽
              </span>
              <span className="text-[9px] font-medium text-text-sub-light dark:text-text-sub-dark uppercase">
                {t('forMembers')}
              </span>
            </div>
          </div>

        </div>
        }
        {isMember && <div className="flex flex-col gap-1 mt-1">
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="text-primary text-base font-bold leading-none">{item.fraction_price_out}₽</span>
              <span className="text-[12px] font-bold text-primary uppercase bg-primary/5 px-1 rounded">
                {t('yourPrice')}
              </span>
            </div>
            <div className="flex items-center gap-1.5 mt-0.5 opacity-70">
              <span className="text-text-sub-light dark:text-text-sub-dark text-[13px] line-through leading-none">
                {item.non_member_fraction_price_out}₽
              </span>
              <span className="text-[9px] font-medium text-text-sub-light dark:text-text-sub-dark uppercase">
                {t('nonMembers')}
              </span>
            </div>
          </div>

        </div>
        }
        {/*<div className="flex items-baseline gap-1">
          <span className="text-primary text-lg font-bold">{(item.fraction_price_out || 0).toFixed(0)} ₽</span>
          <span className="text-text-sub-light dark:text-text-sub-dark text-xs font-medium">/ {item.unit_description}</span>                    
        </div>*/}

        {item.is_weighted && (
          <span className="text-text-sub-light dark:text-text-sub-dark text-xs font-medium">
            {t('weight', { fraction: item.fraction, unit: item.unit })}
          </span>
        )}
        {delivery?.delivery_end && (
          <div className="flex items-center gap-1.5 mt-1">
            <span className={`material-symbols-outlined text-[14px] text-green-600 dark:text-green-400`}>
              local_shipping
            </span>
            <p className="text-text-sub-light dark:text-text-sub-dark text-xs font-medium">
              {format(new Date(delivery.delivery_end), "dd MMM yyyy")}
            </p>
          </div>
        )}
        {!delivery && <div className="flex items-center gap-1.5 mt-1">
          <p className="text-primary text-lg text-xs font-medium">
            {t('noDelivery')}
          </p>
        </div>}
      </div>
    </Link>
  );
};
