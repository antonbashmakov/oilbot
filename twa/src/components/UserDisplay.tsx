"use client";

import { useUser } from '@/api/user/provider';

export const UserDisplay: React.FC = () => {
  const { user, isLoading, isError } = useUser();

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

  if (!user) {
    return null;
  }

  const displayName = user.first_name || user.username || `User ${user.id}`;
  const isMockUser = user.is_mock;

  return (
    <div className="flex items-center gap-2">
      <div className="relative">
        <div className="h-8 w-8 rounded-full bg-primary/20 flex items-center justify-center">
          <span className="material-symbols-outlined text-primary text-sm">
            person
          </span>
        </div>
        {isMockUser && (
          <div className="absolute -top-1 -right-1 h-3 w-3 rounded-full bg-yellow-500 border border-white dark:border-gray-800"></div>
        )}
      </div>
      <div className="hidden md:flex flex-col">
        <span className="text-sm font-medium text-text-main-light dark:text-text-main-dark">
          {displayName}
        </span>
        <span className="text-xs text-text-sub-light dark:text-text-sub-dark">
          {isMockUser ? 'Demo mode' : 'Telegram'}
        </span>
      </div>
    </div>
  );
};
