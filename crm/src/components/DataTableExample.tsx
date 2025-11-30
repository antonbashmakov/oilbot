import React, { useState } from 'react';
import { DataTable, Column, DecimalDataField } from './DataTable';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
}

const DataTableExample: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'Product A', price: 19.99, quantity: 10 },
    { id: 2, name: 'Product B', price: 29.99, quantity: 5 },
    { id: 3, name: 'Product C', price: 9.99, quantity: 20 },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (changedData: Product[]) => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update the data
    setProducts(changedData);
    setIsSaving(false);
    
    console.log('Saved data:', changedData);
  };

  const columns: Column<Product>[] = [
    {
      key: 'id',
      header: 'ID',
      accessor: (item) => item.id,
      width: '80px',
    },
    {
      key: 'name',
      header: 'Name',
      accessor: (item) => item.name,
    },
    {
      key: 'price',
      header: 'Price',
      accessor: (item) => `$${item.price.toFixed(2)}`,
      editable: true,
      field: 'price',
      renderer: DecimalDataField,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      accessor: (item) => item.quantity,
      editable: true,
      field: 'quantity',
      renderer: DecimalDataField,
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>Editable DataTable Example</h1>
      <p>Click on the Price or Quantity cells to edit them. Changes will be saved when you click "Save Changes".</p>
      
      <DataTable
        getKey={p => `${p.id}`}
        columns={columns}
        data={products}
        title="Products"
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
};

export default DataTableExample;
