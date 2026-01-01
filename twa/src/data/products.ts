export interface Product {
  id: number;
  name: string;
  price: number;
  unit: string;
  imageUrl: string;
  imageAlt: string;
  delivery: {
    time: string;
    icon: 'local_shipping' | 'bolt';
  };
  badge?: {
    text: string;
    type: 'best-seller' | 'new-arrival';
  };
}

export const categories = [
  { id: 'ALL', name: 'All', icon: 'restaurant' },
  { id: 'MEAT', name: 'Meat', icon: 'cooking' },
  { id: 'SEA', name: 'Seafood', icon: 'set_meal' },
  { id: 'CHEESE', name: 'Cheese', icon: 'local_pizza' },
  // { id: 'CAVIAR', name: 'Caviar', icon: 'egg' },
];

export const navItems = [
  { id: 1, label: 'Home', icon: 'home', active: true },
  { id: 2, label: 'Search', icon: 'search', active: false },
  { id: 3, label: 'Orders', icon: 'receipt_long', active: false },
  { id: 4, label: 'Profile', icon: 'account_circle', active: false },
];
