"use client";

import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useUser } from '@/api/user/provider';
import { useGetOrdersQuery } from '@/api';
import { useState, useMemo, useEffect } from 'react';
import { Order } from '@/api/models';
import { useTranslations } from 'next-intl';
import _ from 'lodash';

export default function OrdersPage() {
  const router = useRouter();
  const { user } = useUser();
  const { data: orders = [], isLoading, error } = useGetOrdersQuery(user?.id);
  const [activeFilter, setActiveFilter] = useState<'all' | 'processing' | 'delivered' | 'cancelled'>('all');
  const t = useTranslations('orders');

  const [orderedOrders, setOrderedOrders] = useState<Order[]>([]);

  useEffect(() => {
    const sorted = _.orderBy(orders, "created_at", 'desc');
    setOrderedOrders(sorted);
  }, [orders]);

  // Filter orders based on active filter
  const filteredOrders = useMemo(() => {
    if (!orderedOrders || orderedOrders.length === 0) return [];

    switch (activeFilter) {
      case 'processing':
        return orderedOrders.filter(order => 
          order.status === 'PENDING' || 
          order.status === 'PAYMENT_IN_PROGRESS' || 
          order.status === 'PAID' ||
          order.status === 'RESOLVING' ||
          order.status === 'CONCILIATION_PAYMENT_IN_PROGRESS'
        );
      case 'delivered':
        return orderedOrders.filter(order => order.status === 'DELIVERED');
      case 'cancelled':
        return orderedOrders.filter(order => order.status === 'CANCELED');
      default:
        return orderedOrders;
    }
  }, [orderedOrders, activeFilter]);
  // Format date from order (assuming order has a created_at field)
  const formatDate = (dateString?: string) => {
    if (!dateString) return t('dateNotAvailable');
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-US', { 
        month: 'short', 
        day: 'numeric', 
        year: 'numeric' 
      });
    } catch {
      return t('invalidDate');
    }
  };

  // Get status badge styling
  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PAYMENT_IN_PROGRESS':
      case 'PAID':
      case 'RESOLVING':
      case 'CONCILIATION_PAYMENT_IN_PROGRESS':
        return {
          bg: 'bg-orange-50 dark:bg-orange-900/20',
          border: 'border-orange-100 dark:border-orange-900/30',
          icon: 'package_2',
          iconColor: 'text-orange-600 dark:text-orange-400',
          text: 'text-orange-700 dark:text-orange-400',
          label: t('status.processing')
        };
      case 'DELIVERED':
        return {
          bg: 'bg-green-50 dark:bg-green-900/20',
          border: 'border-green-100 dark:border-green-900/30',
          icon: 'check_circle',
          iconColor: 'text-green-600 dark:text-green-400',
          text: 'text-green-700 dark:text-green-400',
          label: t('status.delivered')
        };
      case 'CANCELED':
        return {
          bg: 'bg-slate-100 dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-700',
          icon: 'cancel',
          iconColor: 'text-slate-500 dark:text-slate-400',
          text: 'text-slate-600 dark:text-slate-400',
          label: t('status.cancelled')
        };
      case 'CONCILIATED':
        return {
          bg: 'bg-blue-50 dark:bg-blue-900/20',
          border: 'border-blue-100 dark:border-blue-900/30',
          icon: 'check_circle',
          iconColor: 'text-blue-600 dark:text-blue-400',
          text: 'text-blue-700 dark:text-blue-400',
          label: t('status.conciliated')
        };
      case 'PAYMENT_FAILED':
        return {
          bg: 'bg-red-50 dark:bg-red-900/20',
          border: 'border-red-100 dark:border-red-900/30',
          icon: 'error',
          iconColor: 'text-red-600 dark:text-red-400',
          text: 'text-red-700 dark:text-red-400',
          label: t('status.paymentFailed')
        };
      default:
        return {
          bg: 'bg-slate-100 dark:bg-slate-800',
          border: 'border-slate-200 dark:border-slate-700',
          icon: 'help',
          iconColor: 'text-slate-500 dark:text-slate-400',
          text: 'text-slate-600 dark:text-slate-400',
          label: status
        };
    }
  };

  // Get appropriate button based on status
  const getActionButton = (status: string) => {
    switch (status) {
      case 'PENDING':
      case 'PAYMENT_IN_PROGRESS':
      case 'PAID':
      case 'RESOLVING':
      case 'CONCILIATION_PAYMENT_IN_PROGRESS':
        return {
          text: t('actions.trackOrder'),
          className: 'bg-white dark:bg-[#2a171a] border border-primary text-primary hover:bg-primary/5 active:bg-primary/10'
        };
      case 'DELIVERED':
      case 'CONCILIATED':
        return {
          text: t('actions.reorder'),
          className: 'bg-primary text-white hover:bg-red-600 active:scale-95 shadow-md shadow-red-200 dark:shadow-none'
        };
      default:
        return {
          text: t('actions.details'),
          className: 'bg-slate-100 dark:bg-slate-800 text-slate-900 dark:text-slate-200 hover:bg-slate-200 dark:hover:bg-slate-700'
        };
    }
  };

  // Get items summary text
  const getItemsSummary = (order: any) => {
    if (!order.items || order.items.length === 0) {
      return t('noItems');
    }
    
    const itemCount = order.items.length;
    const itemNames = order.items.slice(0, 3).map((item: any) => item.name).join(', ');
    const moreText = itemCount > 3 ? ` ${t('and')} ${itemCount - 3} ${t('more')}` : '';
    
    return `${itemCount} ${itemCount !== 1 ? t('items') : t('item')}: ${itemNames}${moreText}`;
  };

  if (isLoading) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
        <p className="mt-4 text-text-sub-light dark:text-text-sub-dark">{t('loading')}</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen p-4">
        <span className="material-symbols-outlined text-6xl text-red-500 mb-4">error</span>
        <h3 className="text-text-main-light dark:text-text-main-dark text-lg font-bold mb-2">{t('errorLoading')}</h3>
        <p className="text-text-sub-light dark:text-text-sub-dark text-sm text-center mb-6">
          {error instanceof Error ? error.message : t('failedToLoad')}
        </p>
        <button
          onClick={() => window.location.reload()}
          className="bg-primary hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/30 transition-all"
        >
          {t('tryAgain')}
        </button>
      </div>
    );
  }

  return (
    <>
      {/* Filter Tabs */}
      <div className="sticky top-[60px] z-10 bg-background-light dark:bg-background-dark pb-2">
        <div className="flex gap-3 px-4 py-2 overflow-x-auto no-scrollbar scroll-smooth">
          <button 
            onClick={() => setActiveFilter('all')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm transition-transform active:scale-95 ${
              activeFilter === 'all' 
                ? 'bg-primary text-white' 
                : 'bg-white dark:bg-[#352023] border border-slate-100 dark:border-[#4a2e32] text-slate-700 dark:text-slate-300'
            }`}
          >
            <p className="text-sm font-medium leading-normal">{t('filters.all')}</p>
          </button>
          <button 
            onClick={() => setActiveFilter('processing')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm transition-transform active:scale-95 ${
              activeFilter === 'processing' 
                ? 'bg-primary text-white' 
                : 'bg-white dark:bg-[#352023] border border-slate-100 dark:border-[#4a2e32] text-slate-700 dark:text-slate-300'
            }`}
          >
            <p className="text-sm font-medium leading-normal">{t('filters.processing')}</p>
          </button>
          <button 
            onClick={() => setActiveFilter('delivered')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm transition-transform active:scale-95 ${
              activeFilter === 'delivered' 
                ? 'bg-primary text-white' 
                : 'bg-white dark:bg-[#352023] border border-slate-100 dark:border-[#4a2e32] text-slate-700 dark:text-slate-300'
            }`}
          >
            <p className="text-sm font-medium leading-normal">{t('filters.delivered')}</p>
          </button>
          <button 
            onClick={() => setActiveFilter('cancelled')}
            className={`flex h-9 shrink-0 items-center justify-center gap-x-2 rounded-full px-5 shadow-sm transition-transform active:scale-95 ${
              activeFilter === 'cancelled' 
                ? 'bg-primary text-white' 
                : 'bg-white dark:bg-[#352023] border border-slate-100 dark:border-[#4a2e32] text-slate-700 dark:text-slate-300'
            }`}
          >
            <p className="text-sm font-medium leading-normal">{t('filters.cancelled')}</p>
          </button>
        </div>
      </div>

      {/* Orders List */}
      <div className="flex flex-col gap-4 p-4 pb-24">
        {filteredOrders.length === 0 ? (
          <div className="flex flex-col items-center justify-center py-12">
            <span className="material-symbols-outlined text-6xl text-text-sub-light dark:text-text-sub-dark mb-4">
              receipt_long
            </span>
            <h3 className="text-text-main-light dark:text-text-main-dark text-lg font-bold mb-2">{t('noOrders')}</h3>
            <p className="text-text-sub-light dark:text-text-sub-dark text-sm text-center mb-6">
              {activeFilter === 'all' 
                ? t('noOrdersYet') 
                : t('noFilteredOrders', { filter: t(`filters.${activeFilter}`) })}
            </p>
            <Link
              href="/"
              className="bg-primary hover:bg-red-600 text-white font-bold py-3 px-6 rounded-xl shadow-lg shadow-primary/30 transition-all"
            >
              {t('browseProducts')}
            </Link>
          </div>
        ) : (
          filteredOrders.map((order) => {
            const statusBadge = getStatusBadge(order.status);
            const actionButton = getActionButton(order.status);
            const orderDate = formatDate(order.created_at);
            const orderNumber = order.id ? `${t('order')} #${order.id.slice(-6)}` : t('order');
            const itemsSummary = getItemsSummary(order);
            const opacityClass = order.status === 'CANCELED' ? 'opacity-80' : '';

            return (
              <div 
                key={order.id} 
                className={`flex flex-col bg-white dark:bg-[#2a171a] rounded-xl p-5 shadow-sm border border-slate-100 dark:border-transparent ${opacityClass}`}
              >
                <div className="flex justify-between items-start mb-3">
                  <div className="flex flex-col">
                    <span className="text-xs font-semibold text-slate-500 dark:text-slate-400 uppercase tracking-wider mb-0.5">
                      {orderDate}
                    </span>
                    <h3 className="text-lg font-bold text-slate-900 dark:text-white leading-tight">
                      {orderNumber}
                    </h3>
                  </div>
                  <div className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full ${statusBadge.bg} ${statusBadge.border}`}>
                    <span className={`material-symbols-outlined ${statusBadge.iconColor} text-[16px]`}>
                      {statusBadge.icon}
                    </span>
                    <span className={`${statusBadge.text} text-xs font-bold`}>
                      {statusBadge.label}
                    </span>
                  </div>
                </div>
                <div className="mb-4">
                  <p className="text-sm text-slate-600 dark:text-slate-300 leading-relaxed">
                    <span className="font-bold text-slate-900 dark:text-white">{itemsSummary}</span>
                  </p>
                </div>
                <div className="flex items-center justify-between pt-3 border-t border-slate-50 dark:border-slate-800/50">
                  <div className="flex flex-col">
                    <span className="text-xs text-slate-400 dark:text-slate-500 font-medium">{t('totalAmount')}</span>
                    <span className="text-lg font-bold text-slate-900 dark:text-white">
                      ${order.total?.toFixed(2) || '0.00'}
                    </span>
                  </div>
                  <button className={`flex cursor-pointer items-center justify-center rounded-lg h-9 px-5 transition-colors text-sm font-bold leading-normal tracking-wide ${actionButton.className}`}>
                    {actionButton.text}
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </>
  );
}
