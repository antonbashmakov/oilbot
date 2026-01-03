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

export const IMAGE_TO_UUIDS : Record<string, string> = {
  "250e1e80-a06c-465b-b73f-5691500e40aa": "788283eb-995c-40cb-8532-28650f7c922e",
  "f953ec55-f126-4d39-a4fd-8b4c85190989": "39df81b6-5a1b-405c-8fec-3095cf594781",
  "794c4120-f238-4222-bd79-fde35ef05b6b": "587078f2-c484-466c-8537-0b18642fe890",
  "4964ba3f-af18-4c61-82d1-5c306d5359c3": "e2a0f011-1cc2-444d-918d-0e2bd2991b6b",
  "97b31706-dca5-4b6b-9890-bd60953c0515": "54772bb6-578c-4329-b277-81a292b10db5",
  "6e4c1270-e9fe-4754-ac3c-9338aaef82d5": "344d3705-2c70-4e0d-b392-003e2ef9df53",
  "7bd8fe1e-5dcc-4185-a994-bee6e8e10fd8": "9750a927-d79a-4183-a118-ff89038cda93",
  "9f045e7c-f8eb-4f87-9c7c-9f98f37c303c": "3413ddc2-0270-4c44-b69b-db9e23c3a214",
  "1814c157-0561-4a82-a9bc-0d7ed83f065d": "eaafa0cc-8787-4030-8805-1df736a4488c",
  "268e022e-8436-4562-a544-10218882b6e3": "88c5cef9-cca8-4969-a2e2-f01d3e73ac65",
  "85917af1-cc44-4a51-a135-cfdb1531bf1e": "0b43195b-1e63-4908-bb4a-e949fdc4550b",
  "38038718-cd0f-4a30-94e6-0613c5fc5077": "e4eb8639-6031-4476-8020-97c89ef3b10d",
  "bd806e95-27e7-4e58-88f3-d362e185c48a": "7ad1597a-e45c-4a1f-afc8-d2ccb3a5fffd",
  "d2a15a89-6a02-45db-8249-58f97de0b8b6": "733e6b74-7182-4c6a-85c0-eaf4d7333c89",
  "d7c48721-1dba-406e-860c-484ea841065a": "f90fe1a5-3087-4a47-be09-08fa882136f9",
  "db13bdf1-cd12-4650-82be-f55af1e79bf7": "ded88d5d-37bf-42e4-8ec7-565acb6492fd",
  "d9cb09e0-2afd-4012-953e-86f332f9264c": "60c3ebf9-f841-4192-994b-3d10febfa2ff",
  "efe10193-7bf8-4578-9f27-427dc34272a2": "ee1be822-1a0f-490d-ac43-2b2bcab8ce1e",
  "dc94b227-d3ab-4da4-93e5-9f665f1a4546": "4351eec1-7157-4fd7-9a39-b17a8b5f8195"
};

