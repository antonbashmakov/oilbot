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
  { id: 1, name: 'All', icon: 'restaurant', active: true },
  { id: 2, name: 'Steaks', icon: 'cooking', active: false },
  { id: 3, name: 'Seafood', icon: 'set_meal', active: false },
  { id: 4, name: 'Cheese', icon: 'local_pizza', active: false },
  { id: 5, name: 'Caviar', icon: 'egg', active: false },
];

export const products: Product[] = [
  {
    id: 1,
    name: 'USDA Prime Ribeye',
    price: 24.99,
    unit: 'lb',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuA-rmxQcaIb6zgpGwS_ReJDns6SuG808eEN2G-omH_DT01DEwH1C6YMvzio1fZzD6b7ysKuKj3pHPu7IWgvwwWsBZYS7PFzcA9mnQ47TOusDPCS6klDeR7yxUm4U0zHorSYVMMmoUJmxJZn_hvAWUJYmsA8eWwzsRKQXjxzKEUEn-0-TL4_N3JDd_2Q2LRtfkWVRYJ82aSxdScLkU2W9WFSTeQ1mQU32muiQULrB83G7Ik12Mb0NED6IBMMCvIR2UuKsltrlm60jTtx',
    imageAlt: 'Raw marbled ribeye steak on a dark cutting board',
    delivery: {
      time: 'Tomorrow, 10 AM',
      icon: 'local_shipping'
    },
    badge: {
      text: 'Best Seller',
      type: 'best-seller'
    }
  },
  {
    id: 2,
    name: 'Atlantic Salmon',
    price: 18.50,
    unit: 'lb',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBbIU2Dhas7RII61BMVrppZKik0qRIb-1emG0Xnd64Wez8VPXRpTmEX6L4XbXMqDcLXtT77AijzEIKPG7ZnDyyTL_a4_4_EZ7tz-cnUmNwkrfHmuW7h1deXGZ1YWJlHY4g00SmHi_8BFniMGZKXCQ8apQfGTrX0dt6Rls1UoJREyE-lBUQ75HnNN17ItGidOVeznxzhsPd9NEnnGjFCBKMYzD-Ck7XkNTgb1xnJ_U4HY-IonwFLYuTW4J8X_nVcCFQdzPLW-TNsUzCs',
    imageAlt: 'Fresh raw salmon fillet on ice',
    delivery: {
      time: 'Today, 6 PM',
      icon: 'bolt'
    }
  },
  {
    id: 3,
    name: 'Aged Cheddar',
    price: 12.00,
    unit: 'block',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuDIXVqMUnbBwFl2lqI2U-DH6euqEVXGBF9tpog7sinlQZ7qv1IOs68tzCaH9kgGyG3CAJruJy3VI-nYOU3x_X-GrhmerAn_NXDv0TM7aIgdnlskJCZEMuoiopSubgtvHB1gfn_q-diH3-Hrw0sryc6S5i7gC-9PVs_4sN3QAjCktbePUZQpZFS0NhweQhGiSH5-ybyUgNgHjqCtm0E3puhBlUGZC1j17H4Mknx2b9T-D7_-xQUJ-gDS3j5zQd1yBkdT8Ck_8H5aTD3n',
    imageAlt: 'Block of aged cheddar cheese on wooden board',
    delivery: {
      time: 'Tomorrow, 10 AM',
      icon: 'local_shipping'
    }
  },
  {
    id: 4,
    name: 'Beluga Caviar',
    price: 120.00,
    unit: 'oz',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuChy8Q8IHakseAZ2zRZ5ssqH58sW25t-y49gkVOAUxAoKURCRul3cWLRJ0AL2vpIlgnvQ5_Rsg5LOyMerMBcM-fkOCAzrBEUWE9-km8b915173pPoYcG6W5kxrcfjmj8QZGYugmDwIDUEn7vgYgdPIIcsKfzFuuuXvXwJQy7HdoArTYAPxejgh0vBasd6Xj1BpSHzyb_YUej-JV7Hz6zG9I6y5y_1ptAWtkG6fNow8tjafKZYItVbb_apwhLT7l755vWrstWPRtEOn5',
    imageAlt: 'High end beluga caviar in a tin',
    delivery: {
      time: 'Fri, 2 PM',
      icon: 'local_shipping'
    }
  },
  {
    id: 5,
    name: 'A5 Wagyu Beef',
    price: 99.00,
    unit: 'lb',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuBMihk16Rfqspcf2QECy2f0oNZ5b_9Ndu6rmT3uPwKIu8IVTm6bguitQ8mZODDUH8GN3FCdFSxe7T81xSWMxULpoTTMjlwwBK2ou4FDoGv28AwFPqWlDDpG30mhkgOjG2-Ts7WrT3H-KZLGkVV9WnMEYcc3Wp-z2GdRjSOC0gCjct019NodCdy1dov8lyzITZ8b1iFBIDEDdQIAbq2jpCykcAdzngtbVP_e-961FMfys3q5DcUo4HqmfcWmXOKxfmk1fRqNL-NtubcT',
    imageAlt: 'Wagyu beef slices beautifully arranged',
    delivery: {
      time: 'Sat, 9 AM',
      icon: 'local_shipping'
    },
    badge: {
      text: 'New Arrival',
      type: 'new-arrival'
    }
  },
  {
    id: 6,
    name: 'Maine Lobster',
    price: 45.00,
    unit: 'tail',
    imageUrl: 'https://lh3.googleusercontent.com/aida-public/AB6AXuB8lkHlzGZgWPBgojAaDMB4HzYxElN-2FJ_v9qe7dpigBruA6tJ0FpJBm1BjISQlnIHit4I46RNeRHrhH8nYML5pjgM0CkG5h2u3m1aGmW9FXKK243GYgaN6RQFfYwAeyYwOrUZQxsjCIxT86JP8RatY8BPknWuLTQibCcJ2IkYcqlAO_ScObtUPIFEXuneR3Bo65j91C-eSJdY-8kCm4rfpqVrnSbEkTHXMcPQxcvsrj-F6hX09ssKwgc9DceDY1igLuJd-w6cC5np',
    imageAlt: 'Fresh lobster tails on a plate',
    delivery: {
      time: 'Today, 5 PM',
      icon: 'bolt'
    }
  },
];

export const navItems = [
  { id: 1, label: 'Home', icon: 'home', active: true },
  { id: 2, label: 'Search', icon: 'search', active: false },
  { id: 3, label: 'Orders', icon: 'receipt_long', active: false },
  { id: 4, label: 'Profile', icon: 'account_circle', active: false },
];
