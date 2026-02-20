"use client";

import { useCustomer } from '@/api/user/provider';

export const UserDisplay: React.FC = () => {
  const { customer, isLoading, isError } = useCustomer();

  if (isLoading) {
    return (
      <div className="flex items-center gap-2">
        <div className="h-8 w-8 rounded-full bg-gray-200 dark:bg-gray-700 animate-pulse"></div>
        <div className="hidden md:flex flex-col">
          <div className="h-3 w-20 bg-gray-200 dark:bg-gray-700 rounded animate-pulse"></div>
          <div className="h-2 w-16 bg-gray-200 dark:bg-gray-700 rounded animate-pulse mt-1"></div>
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <div className="flex items-center gap-2 text-red-500">
        <span className="material-symbols-outlined text-lg">error</span>
        <span className="text-sm hidden md:inline">Error loading user</span>
      </div>
    );
  }

  if (!customer) {
    return null;
  }

  const displayName = customer.first_name || customer.username || `User ${customer.id}`;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-sm">
            person
          </span>
        </div>
      </div>
      <div className="hidden md:flex flex-col">
        <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark">
          {displayName}
        </span>
      </div>
    </div>
  );
};
