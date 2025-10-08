import { createContext, useContext, useEffect, useReducer } from 'react';
import { getCart as apiGetCart, addToCart as apiAddToCart, removeFromCart as apiRemoveFromCart } from '../services/api';

const CartContext = createContext();

const cartReducer = (state, action) => {
  switch (action.type) {
    case 'SET_CART':
      return { ...state, items: action.payload };
    case 'ADD_ITEMS':
      const newItems = action.payload;
      const nextItems = [...state.items];
      newItems.forEach(newItem => {
        const idx = nextItems.findIndex(i => i.id === newItem.id);
        if (idx > -1) {
          nextItems[idx] = { ...newItem };
        } else {
          nextItems.push(newItem);
        }
      });
      return { ...state, items: nextItems };
    case 'REMOVE_ITEMS':
      const idsToRemove = action.payload;
      return {
        ...state,
        items: state.items.filter(i => !idsToRemove.includes(i.id))
      };
    case 'CLEAR_CART':
      return { ...state, items: [] };
    default:
      return state;
  }
};

export function CartProvider({ children, userId }) {
  const [state, dispatch] = useReducer(cartReducer, { items: [] });
  // Load cart on mount
  useEffect(() => {
    if (!userId) return;

    const loadCart = async () => {
      try {
        // 1. Try localStorage
        const saved = localStorage.getItem(`cart_${userId}`);
        if (saved) {
          const parsed = JSON.parse(saved);
          dispatch({ type: 'SET_CART', payload: parsed });
        }

        // 2. Sync with server
        const serverCart = await apiGetCart(userId);
        const items = serverCart.items || [];
        console.log('saving to storage ', items)
        // 3. Save to localStorage and update state
        localStorage.setItem(`cart_${userId}`, JSON.stringify(items));
        dispatch({ type: 'SET_CART', payload: items });

      } catch (err) {
        console.warn('Failed to load cart:', err);
      }
    };

    loadCart();
  }, [userId]);

  // Save to server and localStorage
  const addItems = async (items) => {

    if (!userId || !items.length) return;
    // Optimistic update (UI first)
    dispatch({ type: 'ADD_ITEMS', payload: items });

    try {
      // Sync with server
      
      // Update localStorage
      const updated = [...state.items];
      items.forEach(item => {
        const idx = updated.findIndex(i => i.id === item.id);
        if (idx > -1) {
          updated[idx] = { ...item };
        } else {
          updated.push(item);
        }
      });
      await apiAddToCart(userId, updated);
      localStorage.setItem(`cart_${userId}`, JSON.stringify(updated));
    } catch (err) {
      console.error('Sync cart failed:', err);
      // Optionally rollback
    }
  };

  const removeItems = async (itemIds) => {
    if (!userId || !itemIds.length) return;

    // Optimistic update
    dispatch({ type: 'REMOVE_ITEMS', payload: itemIds });

    try {
      await apiRemoveFromCart(userId, itemIds);
      // Update localStorage
      const updated = state.items.filter(i => !itemIds.includes(i.id));
      localStorage.setItem(`cart_${userId}`, JSON.stringify(updated));
    } catch (err) {
      console.error('Remove failed:', err);
    }
  };

  const setItems = (items) => {
    dispatch({ type: 'SET_CART', payload: items });
  };

  const clearCart = () => {
    if (!userId) return;
    dispatch({ type: 'CLEAR_CART' });
    localStorage.removeItem(`cart_${userId}`);
    // Optionally clear on server too
  };

  return (
    <CartContext.Provider value={{
      cart: state.items,
      addItems: addItems,
      setItems: setItems,
      removeItem: (id) => removeItems([id]),
      removeItems,
      clearCart,
      getTotalCount: () => {
        return state.items.reduce((sum, i) => sum + i.quantity, 0)
      },
      getTotalPrice: () => state.items.reduce((sum, i) => sum + i.price * i.quantity, 0)
    }}>
      {children}
    </CartContext.Provider>
  );
}

export const useCart = () => {
  const context = useContext(CartContext);
  if (!context) throw new Error('useCart must be used within CartProvider');
  return context;
};