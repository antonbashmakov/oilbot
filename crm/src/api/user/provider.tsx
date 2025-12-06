"use client";

import React, { createContext, useContext, ReactNode } from 'react';
import { User } from '@/api/models';
import { useUserQuery } from '@/api';
import { UseQueryResult } from '@tanstack/react-query';

interface UserContextType {
  user: User | null;
  setUser: (user: User | null) => void;
  isLoading: boolean;
  isError: boolean;
  refetch: () => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

interface UserProviderProps {
  children: ReactNode;
}

export const UserProvider: React.FC<UserProviderProps> = ({ children }) => {
  const { data: user, isLoading, isError, refetch }: UseQueryResult<User> = useUserQuery();

  const handleSetUser = (newUser: User | null) => {
    // Note: Since we're using API query, we can't directly set user
    // This function is kept for compatibility but will trigger a refetch
    if (newUser === null) {
      // Clear local storage and cookies when logging out
      localStorage.removeItem('user');
      localStorage.removeItem('token');
      document.cookie = 'token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
      document.cookie = 'user_roles=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT; SameSite=Lax';
    }
    refetch();
  };

  const contextValue: UserContextType = {
    user: user || null,
    setUser: handleSetUser,
    isLoading,
    isError,
    refetch,
  };

  return (
    <UserContext.Provider value={contextValue}>
      {children}
    </UserContext.Provider>
  );
};

export const useUser = (): UserContextType => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within a UserProvider');
  }
  return context;
};
