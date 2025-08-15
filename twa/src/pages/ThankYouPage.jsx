import { useNavigate } from 'react-router-dom';

export default function ThankYouPage() {
  const navigate = useNavigate();
  const total = new URLSearchParams(window.location.search).get('total') || '0';

  return (
    <div className="container">
      <header style={{
        padding: '16px',
        borderBottom: '1px solid #eee',
        textAlign: 'center'
      }}>
        <h2>🛍️ My Shop</h2>
      </header>
      <main style={{
        padding: '32px',
        textAlign: 'center',
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center'
      }}>
        <h1>✅ Thank You!</h1>
        <p>Your order has been placed successfully.</p>
        <p><strong>Total: {total} ₽</strong></p>
        <button
          onClick={() => navigate('/')}
          style={{
            marginTop: '24px',
            padding: '12px 24px',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            cursor: 'pointer'
          }}
        >
          Back to Store
        </button>
      </main>
    </div>
  );
}