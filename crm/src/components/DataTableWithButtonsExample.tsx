import React, { useState } from 'react';
import { DataTable, Column } from './DataTable';
import { IconButton } from '@chakra-ui/react';
import { AddIcon, MinusIcon } from '@chakra-ui/icons';

interface Product {
  id: number;
  name: string;
  price: number;
  quantity: number;
  status: 'CANCELLED' | 'PENDING' | 'COLLECTED';
}

const DataTableWithButtonsExample: React.FC = () => {
  const [products, setProducts] = useState<Product[]>([
    { id: 1, name: 'Product A', price: 19.99, quantity: 10, status: 'PENDING' },
    { id: 2, name: 'Product B', price: 29.99, quantity: 5, status: 'PENDING' },
    { id: 3, name: 'Product C', price: 9.99, quantity: 0, status: 'PENDING' },
    { id: 4, name: 'Product D', price: 49.99, quantity: 15, status: 'PENDING' },
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

  const handleAddQuantity = (product: Product) => {
    const updatedProducts = products.map(p =>
      p.id === product.id
        ? { ...p, quantity: p.quantity + 1 }
        : p
    );
    setProducts(updatedProducts);
    console.log('Added quantity to:', product.name);
  };

  const handleRemoveQuantity = (product: Product) => {
    const updatedProducts = products.map(p =>
      p.id === product.id && p.quantity > 0
        ? { ...p, quantity: p.quantity - 1 }
        : p
    );
    setProducts(updatedProducts);
    console.log('Removed quantity from:', product.name);
  };

  const isRowDisabled = (item: Product) => {
    return item.status === 'CANCELLED';
  };

  const rowButtons = (item: Product) => {


    if (item.status === 'PENDING') {
      return [
        <IconButton
          key="add"
          aria-label="Add quantity"
          size="xs"
          colorScheme="green"
          onClick={() => handleAddQuantity(item)}
        >
          <AddIcon />
        </IconButton>

      ];
    }
    if (item.status === 'COLLECTED') {
      return [
        <IconButton
          key="remove"
          aria-label="Remove quantity"
          size="xs"
          colorScheme="red"
          onClick={() => handleRemoveQuantity(item)}
          disabled={item.quantity <= 0}
        >
          <MinusIcon />
        </IconButton>
      ];
    }

    return [];

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
      accessor: (item) => `$${item.price.toFixed(2)}`,
    },
    {
      key: 'quantity',
      header: 'Quantity',
      accessor: (item) => item.quantity,
    },
    {
      key: 'status',
      header: 'Status',
      accessor: (item) => item.status,
    },
  ];

  return (
    <div style={{ padding: '20px' }}>
      <h1>DataTable with Row Buttons Example</h1>
      <p>Hover over rows to see add/remove buttons. Inactive rows (grayed out) don't show buttons.</p>

      <DataTable
        columns={columns}
        data={products}
        title="Products with Quantity Controls"
        onSave={handleSave}
        isSaving={isSaving}
        isRowDisabled={isRowDisabled}
        rowButtons={rowButtons}
      />
    </div>
  );
};

export default DataTableWithButtonsExample;
