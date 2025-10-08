import { useEffect, useState } from 'react';

import { useNavigate } from 'react-router-dom';
import { CartProvider, useCart } from '../context/CartContext';
import { CartIcon } from './CartIcon';

const HeaderContent = () => {

  const navigate = useNavigate();
  const [count, setCount] = useState(0);

  const { getTotalCount, cart } = useCart();

  useEffect(() => {
    setCount(getTotalCount());
  }, [cart]);

  return <header style={{
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: '16px',
    borderBottom: '1px solid #eee',
    position: 'sticky',
    top: 0,
    background: 'white',
    zIndex: 10
  }}>
    <h2 onClick={() => navigate('/')}>🛍️ My Shop</h2>
    <div style={{ position: 'relative' }}>
      <div onClick={() => navigate('/cart')}><CartIcon /></div>
      {count > 0 && (
        <div style={{
          position: 'absolute',
          top: '-8px',
          right: '-8px',
          backgroundColor: 'red',
          color: 'white',
          borderRadius: '50%',
          width: '18px',
          height: '18px',
          fontSize: '12px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center'
        }}>
          {count}
        </div>
      )}
    </div>
  </header>
}

export default function Header() {
  return (
    <HeaderContent />
  );
};