import { useNavigate } from 'react-router-dom';

export default function ProductCard({ product, onAddToCart }) {
  const navigate = useNavigate();
  const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString();

  return (
    <div style={{
      border: '1px solid #eee',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '16px',
      background: 'white'
    }}>
      <img
        src={product.image}
        alt={product.name}
        style={{ width: '100%', height: '180px', objectFit: 'cover' }}
      />
      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <strong>{product.name}</strong>
          <span>{product.price} ₽</span>
        </div>
        <p style={{ color: '#666', fontSize: '14px' }}>
          🚚 Delivery: {deliveryDate}
        </p>
        <button
          onClick={() => onAddToCart(product)}
          style={{
            width: '100%',
            padding: '10px',
            backgroundColor: '#007AFF',
            color: 'white',
            border: 'none',
            borderRadius: '8px',
            marginTop: '8px',
            fontSize: '16px',
            cursor: 'pointer'
          }}
        >
          Buy
        </button>
      </div>
    </div>
  );
}