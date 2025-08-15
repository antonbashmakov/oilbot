import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import { getCart, addToCart } from '../services/api';

const mockProducts = [
  {
    id: 'p1',
    name: 'Cool T-Shirt',
    price: 1200,
    image: 'https://via.placeholder.com/300x200?text=T-Shirt'
  },
  {
    id: 'p2',
    name: 'Stylish Hat',
    price: 800,
    image: 'https://via.placeholder.com/300x200?text=Hat'
  },
  {
    id: 'p3',
    name: 'Leather Bag',
    price: 2500,
    image: 'https://via.placeholder.com/300x200?text=Bag'
  }
];

export default function LandingPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [userId, setUserId] = useState(null);

  useEffect(() => {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!user) {
      console.warn("User not found");
      return;
    }
    setUserId(user.id);
    loadCart(user.id);
  }, []);

  const loadCart = async (id) => {
    try {
      const data = await getCart(id);
      setCartItems(data.items || []);
    } catch (err) {
      setCartItems([]);
    }
  };

  const handleAddToCart = async (product) => {
    const item = { ...product, quantity: 1 };
    await addToCart(userId, item);
    setCartItems(prev => {
      const existing = prev.find(i => i.id === product.id);
      if (existing) {
        return prev.map(i => i.id === product.id ? { ...i, quantity: i.quantity + 1 } : i);
      } else {
        return [...prev, item];
      }
    });
    navigate('/cart');
  };

  const itemCount = cartItems.reduce((sum, i) => sum + i.quantity, 0);

  return (
    <div className="container">
      <Header cartItemCount={itemCount} />
      <main style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        <h3>Products</h3>
        {mockProducts.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </main>
    </div>
  );
}