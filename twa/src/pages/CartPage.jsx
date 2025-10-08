import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import CartItem from '../components/CartItem';
import { removeFromCart, checkout } from '../services/api';
import ButtonContainer from '../components/ButtonContainer';

import { useUser } from '../context/UserContext';
import { useCart } from '../context/CartContext';

export default function CartPage() {
  const navigate = useNavigate();


  const { user } = useUser();
  const { cart, setItems } = useCart();

  const [cartItems, setCartItems] = useState(cart);

  useEffect(() => setCartItems(cart), [cart]);

  const total = cart.reduce((sum, item) => sum + item.price * item.quantity, 0);

  const handleRemove = async (itemId) => {
    const res = await removeFromCart(user.id, itemId);

    setItems(res);
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
        {cartItems.length === 0 && <p>Your cart is empty</p> }
        {
          cartItems.map(item => (
            <CartItem
              key={item.id}
              item={item}
              onRemove={handleRemove}
            />
          ))
        }
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