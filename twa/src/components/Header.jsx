import { useEffect, useState } from 'react';

export default function Header({ cartItemCount = 0 }) {
  const [count, setCount] = useState(cartItemCount);

  useEffect(() => {
    setCount(cartItemCount);
  }, [cartItemCount]);

  return (
    <header style={{
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
      <h2>🛍️ My Shop</h2>
      <div style={{ position: 'relative' }}>
        <img
          src="/cart-icon.png"
          alt="Cart"
          width="28"
          onClick={() => window.location.hash = '/cart'}
          style={{ cursor: 'pointer' }}
        />
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
  );
}