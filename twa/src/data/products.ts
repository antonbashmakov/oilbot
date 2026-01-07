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
    "7bd8fe1e-5dcc-4183-a994-bee6e8e10fd8": "9750a927-d79a-4183-a118-ff89038cda93",
    "9f045e7c-f8eb-4f87-9c7c-9f98f37c303c": "3413ddc2-0270-4c44-b69b-db9e23c3a214",
    "1814c157-0561-4a82-a9bc-0d7ed83f065d": "eaafa0cc-8787-4030-8805-1df736a4488c",
    "268e022e-8436-4562-a544-10218882b6e3": "88c5cef9-cca8-4969-a2e2-f01d3e73ac65",
    "85917af1-cc44-4a51-a135-cfdb1531bf1e": "0b43195b-1e63-4908-bb4a-e949fdc4550b",
    "238618e3-dea3-41bb-8d66-21d34f85e6e1": "ba1ebb60-3a2b-4b44-8846-9ae5ed2124de",
    "38038718-cd0f-4a30-94e6-0613c5fc5077": "e4eb8639-6031-4476-8020-97c89ef3b10d",
    "bd806e95-27e7-4e58-88f3-d362e185c48a": "7ad1597a-e45c-4a1f-afc8-d2ccb3a5fffd",
    "d2a15a89-6a02-45db-8249-58f97de0b8b6": "733e6b74-7182-4c6a-85c0-eaf4d7333c89",
    "d7c48721-1dba-406e-860c-484ea841065a": "f90fe1a5-3087-4a47-be09-08fa882136f9",
    "db13bdf1-cd12-4650-82be-f55af1e79bf7": "ded88d5d-37bf-42e4-8ec7-565acb6492fd",
    "d9cb09e0-2afd-4012-953e-86f332f9264c": "60c3ebf9-f841-4192-994b-3d10febfa2ff",
    "efe10193-7bf8-4578-9f27-427dc34272a2": "ee1be822-1a0f-490d-ac43-2b2bcab8ce1e",
    "dc94b227-d3ab-4da4-93e5-9f665f1a4546": "4351eec1-7157-4fd7-9a39-b17a8b5f8195",
    "f9ae0325-a9f7-4668-be60-0aac9408e518": "ce29ae89-d6c8-491d-bcc8-b729faf1aa07",
    "0721dec3-d402-4820-a9b8-495e1498e538": "11d604b9-08ca-4fef-9c9a-53d365ff70d0",
    "4bf701d8-773a-4a1c-b7a0-eb9f43603bbd": "6cc12487-e36c-42e3-81cf-e21a26fbb7f3",
    "5e63c425-d7df-4f93-b39c-2f0527a55af9": "fe460a9e-4a52-4de2-8ffc-05225613fb45",
    "3f5e4b37-ec2f-4a48-ba71-3ff64077788f": "9207526f-beb3-4610-a9be-78aa63f26dd8",
    "30ea2ac7-34a5-4c44-8245-f62f69823987": "9207526f-beb3-4610-a9be-78aa63f26dd8",
    "d7f5dcda-ac02-428c-9a00-85f89e3cff57": "fd93f979-4032-4231-930c-ab414a66b9ef",
    "c202c5a8-7f99-4a7b-b0f5-c1b0a8af6b0d": "ed27413e-1ae3-45d5-9cc8-a166ee6423da",
    "06088197-f7ef-4bf2-8b3f-2f4a05c6c104": "c9aea306-624a-4177-9751-87867dd689ec",
    "660f0dcd-0cfe-496f-a861-87be6630bf1a": "16f86019-1b71-4a3e-a42a-5d12aba4160d",
    "8d03238a-fbba-4123-8cf6-d970ad0362d2": "b8b02750-4b47-4f72-9c4c-f479b10730f2",
    "bfd4cc27-9fb8-429c-a809-d160916db7b0": "9511daff-16a4-4bd5-b4df-77af76128133",
    "06c30192-6161-43d6-baef-6ef6a831905a": "74d4d41a-91c4-4f27-9df2-821705a9798a",
    "baefb406-b31e-4d31-b28e-c7b82d12f8ef": "5a26b621-2406-4568-a6b6-9b4bf7184d23",
    "8e04d2c3-2818-4d23-9d8f-68d4f640e12e": "5a26b621-2406-4568-a6b6-9b4bf7184d23",
    "6eda1e41-1d6b-4068-81fb-7adadc99ebc8": "c99a3c02-cd21-43b1-9824-7acbddb0ff43",
    "27a62fea-b7d7-4c4f-b118-a44e68422f8b": "3d5bc4d1-2c12-4e13-8d23-5d315e01de6d",
    "a2e50484-34f3-411c-a0a3-b53ff7da8de1": "4088848b-7850-408a-910e-d550c3b77a7a",
    "05acfd27-a056-42cf-bf63-1bac65a1d6bb": "11d604b9-08ca-4fef-9c9a-53d365ff70d0",
    "f28d8076-46df-4615-addd-582eb90b1861": "b8b02750-4b47-4f72-9c4c-f479b10730f2",
    "8b374d06-b408-4231-a6ab-c1834001ee42": "f4167835-f375-498e-9bfc-6ef290164ae7",
    "2847c8d9-5832-4d0d-9293-ff5425d9be65": "a298b736-efb5-4dff-b71e-b591e3835880",
    "1017710d-49a6-4607-9a53-cabd63040977": "9121da7b-3549-454b-902f-a0d17442ba1c",
    "497c1768-0469-41cb-9ed9-d3b52852f731": "51d626d9-116e-4b18-b191-262a94ec1e7f",
    "89ffd253-5ebd-4ce2-8b41-b7ee1f1f30de": "587078f2-c484-466c-8537-0b18642fe890",
    "a57ee318-241d-430e-93ee-77804ef08bee": "9750a927-d79a-4183-a118-ff89038cda93",
    "a1301f1c-3210-431a-8b6d-6fa38259ca80": "568c90d1-b419-490d-9db4-64595b8941b2"
}
;

