import axios from 'axios';

// Use different base in dev vs prod
const isDev = import.meta.env.MODE === 'development';
const API_BASE = isDev
  ? 'http://localhost:4000'
  : 'https://europe-west1-your-project.cloudfunctions.net/api';

const api = axios.create({
  baseURL: API_BASE,
  headers: { 'Content-Type': 'application/json' }
});

// === Cart Endpoints ===

// GET /cart
export const getCart = async (userId) => {
  try {
    const res = await api.get('/cart');
    return res.data;
  } catch (err) {
    return { items: [] };
  }
};

// POST /cart/add
export const addToCart = async (userId, item) => {
  const cart = await getCart(userId);
  const items = [...(cart.items || [])];
  const existing = items.find(i => i.id === item.id);

  if (existing) {
    existing.quantity += 1;
  } else {
    items.push({ ...item, quantity: 1 });
  }

  await api.patch('/cart', { items });
  return { items };
};

// POST /cart/remove
export const removeFromCart = async (userId, itemId) => {
  const cart = await getCart(userId);
  const items = (cart.items || []).filter(i => i.id !== itemId);
  await api.patch('/cart', { items });
  return { items };
};

// POST /start-checkout
export const checkout = async (userData, cartItems) => {
  // Simulate payment link
  const finalAmount = cartItems.reduce((sum, i) => sum + i.price * i.quantity, 0) + 500; // + membership

  // Simulate API delay
  await new Promise(r => setTimeout(r, 800));

  return {
    data: {
      paymentUrl: "https://tinkoff.ru/mock-payment-page",
      orderId: `mock_order_${Date.now()}`
    }
  };
};