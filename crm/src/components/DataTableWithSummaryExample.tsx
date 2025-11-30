import React, { useState } from 'react';
import { DataTable, Column } from './DataTable';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  revenue: number;
}

const DataTableWithSummaryExample: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'Product A', price: 19.99, quantity: 10, revenue: 199.90 },
    { id: 2, name: 'Product B', price: 29.99, quantity: 5, revenue: 149.95 },
    { id: 3, name: 'Product C', price: 9.99, quantity: 20, revenue: 199.80 },
    { id: 4, name: 'Product D', price: 49.99, quantity: 15, revenue: 749.85 },
  ]);

  const [isSaving, setIsSaving] = useState(false);

  const handleSave = async (changedData: Product[]) => {
    setIsSaving(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    // Update the data
    setProducts(changedData);
    setIsSaving(false);
    
  };

  const columns: Column<Product>[] = [
    {
      key: 'id',
      header: 'ID',
      accessor: (item) => item.id,
      width: '60px',
    },
    {
      key: 'name',
      header: 'Name',
      accessor: (item) => item.name,
    },
    {
      key: 'price',
      header: 'Price',
      accessor: (item) => item.price.toFixed(2),
      summaryFormatter: (sum) => `$${sum.toFixed(2)}`,
    },
    {
      key: 'quantity',
      field: 'quantity',
      header: 'Quantity',
      accessor: (item) => item.quantity,
      summarizable: true,
    },
    {
      key: 'revenue',
      header: 'Revenue',
      accessor: (item) => `$${item.revenue.toFixed(2)}`,
      summaryFormatter: (sum) => `$${sum.toFixed(2)}`,
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>DataTable with Summary Row Example</h1>
      <p>This table shows a summary row at the bottom with totals for price, quantity, and revenue columns.</p>
      
      <DataTable
        getKey={p => `${p.id}`}
        columns={columns}
        data={products}
        title="Products with Summary"
        onSave={handleSave}
        isSaving={isSaving}
      />
    </div>
  );
};

export default DataTableWithSummaryExample;
