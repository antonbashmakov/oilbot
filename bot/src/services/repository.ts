import { Customer, Item } from '../models/models';

const mockCustomer: Customer = {
  id: 12345,
  first_name: 'John',
  username: 'johndoe',
  language_code: 'en',
};

const mockItems: { [key: string]: Item[] } = {
  MEAT: [
      {
        category: "MEAT",
        description: "мясо",
        fraction: 1.2,
        fraction_price_out: 1439,
        group: "BALASHOV",
        id: "06088197-f7ef-4bf2-8b3f-2f4a05c6c104",
        link: "https://t.me/posebestoimosti_saratov/214",
        name: "Телятина Филе (Тендер Лоин)",
        price_in: 1000,
        price_out: 1199,
        row_number: 11,
        status: "ACTIVE",
        unit: "Кг",
        unti_description: "Отруб"
      },
      {
        category: "MEAT",
        description: "мясной картофель",
        fraction: 2.5,
        fraction_price_out: 250,
        group: "LOCAL",
        id: "a2c5b1d3-5f1a-4b9a-9f23-7d1c2e5f9f1b",
        link: "https://t.me/posebestoimosti_saratov/215",
        name: "Картофель молодой",
        price_in: 100,
        price_out: 120,
        row_number: 12,
        status: "ACTIVE",
        unit: "Кг",
        unti_description: "Корнеплод"
      },
      {
        category: "MEAT",
        description: "мясное молоко",
        fraction: 1,
        fraction_price_out: 80,
        group: "FARM",
        id: "b7d2c1e5-6f8d-4c1a-b3f9-9a7c1d2b5e8f",
        link: "https://t.me/posebestoimosti_saratov/216",
        name: "Молоко 3.2%",
        price_in: 70,
        price_out: 80,
        row_number: 13,
        status: "ACTIVE",
        unit: "Л",
        unti_description: "Жидкость"
      }
    ],
  SEA: [
      {
        category: "MEAT",
        description: "мясо",
        fraction: 1.2,
        fraction_price_out: 1439,
        group: "BALASHOV",
        id: "06088197-f7ef-4bf2-8b3f-2f4a05c6c104",
        link: "https://t.me/posebestoimosti_saratov/214",
        name: "Телятина Филе (Тендер Лоин)",
        price_in: 1000,
        price_out: 1199,
        row_number: 11,
        status: "ACTIVE",
        unit: "Кг",
        unti_description: "Отруб"
      },
      {
        category: "MEAT",
        description: "мясной картофель",
        fraction: 2.5,
        fraction_price_out: 250,
        group: "LOCAL",
        id: "a2c5b1d3-5f1a-4b9a-9f23-7d1c2e5f9f1b",
        link: "https://t.me/posebestoimosti_saratov/215",
        name: "Картофель молодой",
        price_in: 100,
        price_out: 120,
        row_number: 12,
        status: "ACTIVE",
        unit: "Кг",
        unti_description: "Корнеплод"
      }
    ],

};

export const getCustomer = async (id: number): Promise<Customer | null> => {
  if (id === mockCustomer.id) {
    return mockCustomer;
  }
  return null;
};

export const getItems = async (type: string): Promise<Item[]> => {
  return mockItems[type] || [];
};
