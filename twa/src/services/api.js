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

const dataExtractor = (p) => p.then(res => res.data);

export const getCart = async (userId) => {
    return dataExtractor(api.get(`/carts/${userId}`));
};
export const getProducts = async () => {
    return dataExtractor(api.get('/products'));
};
export const getUser = async (userId) => {
    return dataExtractor(api.get(`/users/${userId}`));
};

export const addToCart = async (userId, items) => {
  await api.patch(`/carts/${userId}`, { items });
};

// POST /cart/remove
export const removeFromCart = async (userId, itemIds) => {
  const current = await getCart(userId);
  const filtered = current.items.filter(i => !itemIds.includes(i.id));
  await api.patch(`/carts/${userId}`, { items: filtered });
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