import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CartItem from '../components/CartItem';
import { removeFromCart, checkout } from '../services/api';
import ButtonContainer from '../components/ButtonContainer';

export default function CartPage() {
  const navigate = useNavigate();
  const [cartItems, setCartItems] = useState([]);
  const [userId, setUserId] = useState(null);
  const [userData, setUserData] = useState({});

  useEffect(() => {
    const user = window.Telegram?.WebApp?.initDataUnsafe?.user;
    if (!user) return;
    setUserId(user.id);
    setUserData({
      telegramUserId: user.id,
      firstName: user.first_name,
      lastName: user.last_name || '',
      email: user.id + '@telegram.shop' // fallback
    });

    // Load cart
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

  const total = cartItems.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleRemove = async (itemId) => {
    await removeFromCart(userId, itemId);
    setCartItems(prev => prev.filter(i => i.id !== itemId));
  };

  const handleCheckout = async () => {
    try {
      const response = await checkout(userData, cartItems);
      const paymentUrl = response.data.paymentUrl;

      // Open Tinkoff payment
      window.Telegram.WebApp.openLink(paymentUrl);

      // After payment, go to thank you page
      // Note: You'll need a webhook to detect success, or redirect back
      setTimeout(() => {
        navigate('/thank-you');
      }, 2000);
    } catch (err) {
      alert('Checkout failed');
    }
  };

  return (

    <ButtonContainer text="Buy">
      <main style={{ padding: '16px', flex: 1, overflowY: 'auto' }}>
        <h3>Your Cart</h3>
        {cartItems.length === 0 ? (
          <p>Your cart is empty</p>
        ) : (
          cartItems.map(item => (
            <CartItem
              key={item.id}
              item={item}
              onRemove={handleRemove}
            />
          ))
        )}
        <div style={{
          marginTop: '24px',
          padding: '16px',
          borderTop: '2px solid #eee',
          fontSize: '18px',
          fontWeight: 'bold'
        }}>
          Total: {total} ₽
        </div>
      </main>
    </ButtonContainer>

  );
}