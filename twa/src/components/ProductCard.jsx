import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import  lodash from 'lodash';


import VariationOverlay from './VariationOverlay';

import './ProductCard.css'

export default function ProductCard({ product }) {
  const navigate = useNavigate();
  const deliveryDate = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toLocaleDateString();

  const [isOverlayOpen, setIsOverlayOpen] = useState(false);

  const variations = lodash.sortBy(product.variations, 'price');

  let price = `${variations[0].price}`;

  if(variations.length > 1) {
    price = `${variations[0].price} - ${variations[variations.length - 1].price}`
  }


  return (
    <div style={{
      border: '1px solid #eee',
      borderRadius: '12px',
      overflow: 'hidden',
      marginBottom: '16px',
      background: 'white'
    }}>
      <div className='imageContainer'>
        <img
          src={product.image}
          alt={product.name}
          style={{ width: '100%', height: '180px', objectFit: 'cover' }}
        />
        <div className='addButtonContainer'>
          <button
            onClick={() => setIsOverlayOpen(true)}
          >+</button>
        </div>
      </div>
      <div style={{ padding: '12px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '4px' }}>
          <strong>{product.name}</strong>
          <span>{price} ₽</span>
        </div>
        <p style={{ color: '#666', fontSize: '14px' }}>
          🚚 Delivery: {deliveryDate}
        </p>
      </div>

      {isOverlayOpen && (
        <VariationOverlay
          product={product}
          onClose={() => setIsOverlayOpen(false)}
        />
      )}
    </div>
  );
}