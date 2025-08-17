import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { CartProvider, useCart } from '../context/CartContext';

// Mock variations
const mockVariations = [
  { id: 'v1', name: 'Small', price: 900 },
  { id: 'v2', name: 'Medium', price: 1200 },
  { id: 'v3', name: 'Large', price: 1400 },
  { id: 'v4', name: 'X-Large', price: 1600 }
];

const VariationOverlayContent = ({ product, onClose }) => {

  const navigate = useNavigate();
  const { addItem } = useCart();

  const [quantities, setQuantities] = useState(() => {
    const state = {};
    mockVariations.forEach(v => state[v.id] = 0);
    return state;
  });

  // Calculate totals in memory
  const totalItems = Object.entries(quantities).reduce((sum, [id, qty]) => {
    return sum + qty;
  }, 0);

  const totalPrice = Object.entries(quantities).reduce((sum, [id, qty]) => {
    const variation = mockVariations.find(v => v.id === id);
    return sum + (variation ? variation.price * qty : 0);
  }, 0);

  const handleAddToCart = () => {
    const itemsToAdd = Object.entries(quantities)
      .filter(([id, qty]) => qty > 0)
      .map(([id, qty]) => {
        const variation = mockVariations.find(v => v.id === id);
        return {
          id: `${product.id}-${id}`, // unique key
          productId: product.id,
          variationId: id,
          name: `${product.name} (${variation.name})`,
          price: variation.price,
          quantity: qty
        };
      });

    if (itemsToAdd.length > 0) {
      // Call parent handler (will sync with server)
      addItem(itemsToAdd);
    }

    // Close overlay
    navigate('/cart');
  };

  const updateQuantity = (variationId, delta) => {
    setQuantities(prev => ({
      ...prev,
      [variationId]: Math.max(0, (prev[variationId] || 0) + delta)
    }));
  };

  return (
    <div style={{
      position: 'fixed',
      bottom: 0,
      left: 0,
      right: 0,
      backgroundColor: 'white',
      borderTopLeftRadius: '16px',
      borderTopRightRadius: '16px',
      boxShadow: '0 -4px 20px rgba(0,0,0,0.15)',
      padding: '16px',
      maxHeight: '80vh',
      overflowY: 'auto',
      zIndex: 1000
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3>Select Variations</h3>
        <button
          onClick={onClose}
          style={{
            background: 'none',
            border: 'none',
            font: 'inherit',
            color: '#007AFF',
            cursor: 'pointer'
          }}
        >
          Cancel
        </button>
      </div>

      {/* Variations List */}
      <div>
        {mockVariations.map(variation => (
          <div key={variation.id} style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 0',
            borderBottom: '1px solid #eee'
          }}>
            <div>
              <strong>{variation.name}</strong>
              <div style={{ color: '#007AFF' }}>{variation.price} ₽</div>
            </div>
            <div style={{
              display: 'flex',
              alignItems: 'center',
              gap: '8px'
            }}>
              <button
                onClick={() => updateQuantity(variation.id, -1)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid #ddd',
                  background: 'white',
                  cursor: 'pointer'
                }}
              >
                −
              </button>
              <span style={{
                minWidth: '20px',
                textAlign: 'center',
                fontWeight: 'bold'
              }}>
                {quantities[variation.id] || 0}
              </span>
              <button
                onClick={() => updateQuantity(variation.id, 1)}
                style={{
                  width: '30px',
                  height: '30px',
                  borderRadius: '50%',
                  border: '1px solid #ddd',
                  background: '#007AFF',
                  color: 'white',
                  cursor: 'pointer'
                }}
              >
                +
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* Summary */}
      <div style={{
        marginTop: '24px',
        padding: '16px',
        background: '#f8f8f8',
        borderRadius: '12px',
        textAlign: 'center'
      }}>
        <div>Total: <strong>{totalItems} item(s)</strong></div>
        <div style={{ fontSize: '18px', fontWeight: 'bold', marginTop: '4px' }}>
          {totalPrice} ₽
        </div>
      </div>

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={totalItems === 0}
        style={{
          marginTop: '16px',
          width: '100%',
          padding: '14px',
          backgroundColor: totalItems === 0 ? '#ccc' : '#30D158',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          fontWeight: 'bold',
          cursor: totalItems === 0 ? 'not-allowed' : 'pointer'
        }}
      >
        {totalItems === 0 ? 'No items' : `Add to Cart (${totalItems})`}
      </button>
    </div>
  );
};

export default function VariationOverlay({ product, onClose }) {
  return (
    <CartProvider >
      <VariationOverlayContent product={product} onClose={onClose}  />
    </CartProvider>
  );
};