import { useState } from 'react';

// Mock variations (in real app, this comes from API)
const mockVariations = [
  { id: 'v1', name: 'Small', price: 900 },
  { id: 'v2', name: 'Medium', price: 1200 },
  { id: 'v3', name: 'Large', price: 1400 },
  { id: 'v4', name: 'X-Large', price: 1600 }
];

export default function VariationOverlay({ product, onClose }) {
  const [quantities, setQuantities] = useState(() => {
    const state = {};
    mockVariations.forEach(v => state[v.id] = 0);
    return state;
  });

  const totalItems = Object.values(quantities).reduce((sum, q) => sum + q, 0);

  const updateQuantity = async (variationId, delta) => {
    setQuantities(prev => {
      const newQty = Math.max(0, (prev[variationId] || 0) + delta);
      const updated = { ...prev, [variationId]: newQty };

      // Get variation
      const variation = mockVariations.find(v => v.id === variationId);
      if (!variation) return prev;

      // Prepare item for API
      const cartItem = {
        id: `${product.id}-${variationId}`,
        productId: product.id,
        variationId,
        name: `${product.name} (${variation.name})`,
        price: variation.price,
        quantity: newQty
      };

      // Update server cart (add or remove)
      if (newQty === 0) {
        window.api.removeFromCart(window.userId, cartItem.id);
      } else {
        window.api.addToCart(window.userId, cartItem);
      }

      return updated;
    });
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
      zIndex: 1000,
      transform: 'translateY(0)',
      transition: 'transform 0.3s ease-out'
    }}>
      {/* Header */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '16px'
      }}>
        <h3>Select Variation</h3>
        <button
          onClick={onClose}
          style={{
            background: '#f0f0f0',
            border: 'none',
            width: '36px',
            height: '36px',
            borderRadius: '50%',
            cursor: 'pointer'
          }}
        >
          ✕
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

      {/* Footer */}
      <div style={{
        marginTop: '24px',
        textAlign: 'center',
        fontSize: '18px'
      }}>
        {totalItems > 0 ? (
          <strong>Total items: {totalItems}</strong>
        ) : (
          <span>No items selected</span>
        )}
      </div>

      <button
        onClick={onClose}
        style={{
          marginTop: '16px',
          width: '100%',
          padding: '12px',
          backgroundColor: '#007AFF',
          color: 'white',
          border: 'none',
          borderRadius: '8px',
          fontSize: '16px',
          cursor: 'pointer'
        }}
      >
        Close
      </button>
    </div>
  );
}