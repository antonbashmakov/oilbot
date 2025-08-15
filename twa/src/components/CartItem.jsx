export default function CartItem({ item, onRemove }) {
  return (
    <div style={{
      display: 'flex',
      justifyContent: 'space-between',
      alignItems: 'center',
      padding: '12px 0',
      borderBottom: '1px solid #eee'
    }}>
      <div>
        <strong>{item.name}</strong>
        <div>{item.quantity} × {item.price} ₽</div>
      </div>
      <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
        <span>{item.quantity * item.price} ₽</span>
        <button
          onClick={() => onRemove(item.id)}
          style={{
            color: 'red',
            background: 'none',
            border: 'none',
            cursor: 'pointer'
          }}
        >
          ✕
        </button>
      </div>
    </div>
  );
}