// Category mapping from UUID to category type
export type Category = 'STEAKS' | 'OTHER' | 'FISH';

export const categoryMap: Record<string, Category> = {
  // STEAKS
  'f28d8076-46df-4615-addd-582eb90b1861': 'STEAKS',
  '8d03238a-fbba-4123-8cf6-d970ad0362d2': 'STEAKS',
  '05acfd27-a056-42cf-bf63-1bac65a1d6bb': 'STEAKS',
  '0721dec3-d402-4820-a9b8-495e1498e538': 'STEAKS',
  '27a62fea-b7d7-4c4f-b118-a44e68422f8b': 'STEAKS',
  'bfd4cc27-9fb8-429c-a809-d160916db7b0': 'STEAKS',
  '5e63c425-d7df-4f93-b39c-2f0527a55af9': 'STEAKS',
  'd7f5dcda-ac02-428c-9a00-85f89e3cff57': 'STEAKS',

  // OTHER
  '6eda1e41-1d6b-4068-81fb-7adadc99ebc8': 'OTHER',
  'a1301f1c-3210-431a-8b6d-6fa38259ca80': 'OTHER',
  'a2e50484-34f3-411c-a0a3-b53ff7da8de1': 'OTHER',
  '660f0dcd-0cfe-496f-a861-87be6630bf1a': 'OTHER',
  '06088197-f7ef-4bf2-8b3f-2f4a05c6c104': 'OTHER',
  'c202c5a8-7f99-4a7b-b0f5-c1b0a8af6b0d': 'OTHER',
  '9f045e7c-f8eb-4f87-9c7c-9f98f37c303c': 'OTHER',
  'd2a15a89-6a02-45db-8249-58f97de0b8b6': 'OTHER',
  '1017710d-49a6-4607-9a53-cabd63040977': 'OTHER',
  '2847c8d9-5832-4d0d-9293-ff5425d9be65': 'OTHER',
  '4964ba3f-af18-4c61-82d1-5c306d5359c3': 'OTHER',
  '497c1768-0469-41cb-9ed9-d3b52852f731': 'OTHER',
  '250e1e80-a06c-465b-b73f-5691500e40aa': 'OTHER',
  'dc94b227-d3ab-4da4-93e5-9f665f1a4546': 'OTHER',
  'db13bdf1-cd12-4650-82be-f55af1e79bf7': 'OTHER',
  '97b31706-dca5-4b6b-9890-bd60953c0515': 'OTHER',
  'd9cb09e0-2afd-4012-953e-86f332f9264c': 'OTHER',
  '268e022e-8436-4562-a544-10218882b6e3': 'OTHER',
  '6e4c1270-e9fe-4754-ac3c-9338aaef82d5': 'OTHER',
  '1814c157-0561-4a82-a9bc-0d7ed83f065d': 'OTHER',
  'a57ee318-241d-430e-93ee-77804ef08bee': 'OTHER',
  '85917af1-cc44-4a51-a135-cfdb1531bf1e': 'OTHER',
  'bd806e95-27e7-4e58-88f3-d362e185c48a': 'OTHER',
  'efe10193-7bf8-4578-9f27-427dc34272a2': 'OTHER',
  '89ffd253-5ebd-4ce2-8b41-b7ee1f1f30de': 'OTHER',
  '238618e3-dea3-41bb-8d66-21d34f85e6e1': 'OTHER',
  'd7c48721-1dba-406e-860c-484ea841065a': 'OTHER',
  'f9ae0325-a9f7-4668-be60-0aac9408e518': 'OTHER',
  'f953ec55-f126-4d39-a4fd-8b4c85190989': 'OTHER',
  '06c30192-6161-43d6-baef-6ef6a831905a': 'OTHER',
  '4bf701d8-773a-4a1c-b7a0-eb9f43603bbd': 'OTHER',

  // FISH
  'baefb406-b31e-4d31-b28e-c7b82d12f8ef': 'FISH',
  '3f5e4b37-ec2f-4a48-ba71-3ff64077788f': 'FISH',
  '8b374d06-b408-4231-a6ab-c1834001ee42': 'FISH',
  '8e04d2c3-2818-4d23-9d8f-68d4f640e12e': 'FISH',
  '30ea2ac7-34a5-4c44-8245-f62f69823987': 'FISH',
};

// Helper function to get category by UUID
export function getCategoryById(id: string): Category {
  if(!categoryMap[id]) {
    console.warn(`Category for id ${id} not found. Defaulting to OTHER.`);
  }
  return categoryMap[id] || 'OTHER';
}

// Helper function to get icon component by category
export function getIconByCategory(category: Category) {
  switch (category) {
    case 'STEAKS':
      return 'skillet'; // Material symbol for skillet
    case 'FISH':
      return 'fish'; // Material symbol for fish
    case 'OTHER':
    default:
      return 'inventory_2'; // Material symbol for inventory
  }
}

// Helper function to get Chakra UI Icon component by category
import { LuSnowflake, LuStar, LuFish } from 'react-icons/lu';

export function getChakraIconByCategory(category: Category) {
  switch (category) {
    case 'STEAKS':
      return LuSnowflake;
    case 'FISH':
      return LuFish;
    case 'OTHER':
    default:
      return LuStar;
  }
}