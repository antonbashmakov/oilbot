import { createContext, useContext, useEffect, useReducer } from 'react';

import { getUser } from '../services/api'


const UserContext = createContext();

const userReducer = (state, action) => {

  switch (action.type) {
    case 'SET_USER':
      return { ...state, ...action.payload };
    case 'CLEAR_USER':
      return {};
    case 'UPDATE_USER':
      return { ...state, ...action.payload };
    default:
      return state;
  }
};

export function UserProvider({ children }) {
  const [state, dispatch] = useReducer(userReducer, {});

  const loadUserFromBackend = async (telegramId) => {
    try {
      const backendData = await getUser(telegramId);

      // Merge with existing state
      dispatch({ type: 'UPDATE_USER', payload: backendData });
      // Update localStorage
      const saved = JSON.parse(localStorage.getItem('app_user') || '{}');
      localStorage.setItem('app_user', JSON.stringify({ ...saved, ...backendData }));
    } catch (err) {
      console.warn('Failed to fetch user from backend', err);
      // Still proceed with Telegram data
    }
  };

  useEffect(() => {
    const initUser = async () => {
      // 1. Try to load from localStorage first (for fast startup)
      const savedUser = localStorage.getItem('app_user');
      if (savedUser) {
        try {
          const parsed = JSON.parse(savedUser);
          dispatch({ type: 'SET_USER', payload: parsed });
        } catch (e) {
          console.warn('Failed to parse saved user');
        }
      }

      // 2. Get Telegram user
      let telegramUser = window.Telegram?.WebApp?.initDataUnsafe?.user;
      if (!telegramUser) {
        console.warn('No Telegram user found. Use mocked user');
        telegramUser = {
          id: 'mocked-id',
          firstName: 'Mock',
          lastName: 'Mocksson',
          username: 'mock',
          photoUrl: null,
          languageCode: 'en',
          isLoaded: true
        };
      }

      const userId = String(telegramUser.id);

      // 3. Create basic Telegram-only user
      const minimalUser = {
        id: userId,
        firstName: telegramUser.first_name,
        lastName: telegramUser.last_name || '',
        username: telegramUser.username || '',
        photoUrl: telegramUser.photo_url || null,
        languageCode: telegramUser.language_code || 'en',
        isLoaded: true
      };

      // 4. Update context with Telegram data
      dispatch({ type: 'UPDATE_USER', payload: minimalUser });

      // 5. Save to localStorage (merge)
      const existing = JSON.parse(localStorage.getItem('app_user') || '{}');
      const merged = { ...minimalUser, ...existing };
      localStorage.setItem('app_user', JSON.stringify(merged));

      // 6. Fetch full user data from backend
      await loadUserFromBackend(userId);
    };

    initUser();

    // Optional: Expand Telegram WebApp
    if (window.Telegram?.WebApp) {
      window.Telegram.WebApp.expand();
    }
  }, []);

  const updateUser = (userData) => {
    dispatch({ type: 'UPDATE_USER', payload: userData });
    const saved = JSON.parse(localStorage.getItem('app_user') || '{}');
    localStorage.setItem('app_user', JSON.stringify({ ...saved, ...userData }));
  };

  const clearUser = () => {
    dispatch({ type: 'CLEAR_USER' });
    localStorage.removeItem('app_user');
  };

  return (
    <UserContext.Provider value={{
      user: state,
      userId: state.id || null,
      isUserLoaded: !!state.id,
      isMember: !!state.isMember,
      updateUser,
      clearUser
    }}>
      {children}
    </UserContext.Provider>
  );
}

export const useUser = () => {
  const context = useContext(UserContext);
  if (!context) {
    throw new Error('useUser must be used within UserProvider');
  }
  return context;
};