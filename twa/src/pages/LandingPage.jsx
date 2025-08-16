import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Header from '../components/Header';
import ProductCard from '../components/ProductCard';
import ButtonContainer from '../components/ButtonContainer';
import { getCart, addToCart, getProducts } from '../services/api';



export default function LandingPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [products, setProducts] = useState([]);
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
  
  useEffect( () => {getProducts().then(data => setProducts(data))}, []);

  const loadCart = async (id) => getCart(id).then(items => setCartItems(items));

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
    <ButtonContainer text="Buy">
      <Header cartItemCount={itemCount} />
      <main style={{ padding: '16px', overflowY: 'auto', flex: 1 }}>
        {products.map(product => (
          <ProductCard
            key={product.id}
            product={product}
            onAddToCart={handleAddToCart}
          />
        ))}
      </main>
    </ButtonContainer>
  );
}