import db from "../setup";
import * as request from "supertest";
import { Item, CartItem } from "../../models";
import ItemService from "../../services/ItemService";
import CartItemService from "../../services/CartItemService";

// Import the publicApi directly
import { publicApi } from "../../controllers/public";

describe("Public API /fix-cartitems Endpoint Integration Test", () => {
  let itemService: ItemService;
  let cartItemService: CartItemService;
  let testItems: Item[];
  let testCartItems: CartItem[];

  beforeEach(async () => {
    // Initialize services with test db
    itemService = new ItemService(db as any);
    cartItemService = new CartItemService(db as any);

    // Create test items
    testItems = [
      {
        id: "test-item-1",
        name: "Test Item 1",
        fraction_price_out: 150.75,
        price_out: 200.50,
        fraction: 1,
        category: "TEST",
        group: "TEST_GROUP",
        description: "Test item 1 description",
        link: "https://test.com/item1",
        price_in: 120.25,
        row_number: 1,
        status: "ACTIVE",
        unit: "кг",
        unit_description: "килограмм",
      } as any,
      {
        id: "test-item-2",
        name: "Test Item 2",
        fraction_price_out: 99.99,
        price_out: 150.00,
        fraction: 1,
        category: "TEST",
        group: "TEST_GROUP",
        description: "Test item 2 description",
        link: "https://test.com/item2",
        price_in: 80.00,
        row_number: 2,
        status: "ACTIVE",
        unit: "кг",
        unit_description: "килограмм",
      } as any,
      {
        id: "test-item-3",
        name: "Test Item 3",
        fraction_price_out: 200.00,
        price_out: 250.00,
        fraction: 1,
        category: "TEST",
        group: "TEST_GROUP",
        description: "Test item 3 description",
        link: "https://test.com/item3",
        price_in: 150.00,
        row_number: 3,
        status: "ACTIVE",
        unit: "кг",
        unit_description: "килограмм",
      } as any,
    ];

    // Create test cart items with some having incorrect prices
    testCartItems = [
      {
        id: "test-cart-item-1",
        item_id: "test-item-1",
        name: "Test Item 1",
        price: 100.00, // Incorrect, should be 150.75
        quantity: 2,
        fraction: 1,
        price_for_unit: 200.50,
        category: "TEST",
        group: "TEST_GROUP",
        owner: { id: "test-customer-1" },
        created_at: new Date(),
      } as any,
      {
        id: "test-cart-item-2",
        item_id: "test-item-2",
        name: "Test Item 2",
        price: 99.99, // Correct, should not be updated
        quantity: 1,
        fraction: 1,
        price_for_unit: 150.00,
        category: "TEST",
        group: "TEST_GROUP",
        owner: { id: "test-customer-2" },
        created_at: new Date(),
      } as any,
      {
        id: "test-cart-item-3",
        item_id: "test-item-3",
        name: "Test Item 3",
        price: 180.00, // Incorrect, should be 200.00
        quantity: 3,
        fraction: 1,
        price_for_unit: 250.00,
        category: "TEST",
        group: "TEST_GROUP",
        owner: { id: "test-customer-3" },
        created_at: new Date(),
      } as any,
      {
        id: "test-cart-item-4",
        item_id: "non-existent-item", // Item doesn't exist
        name: "Non-existent Item",
        price: 50.00,
        quantity: 1,
        fraction: 1,
        price_for_unit: 50.00,
        category: "TEST",
        group: "TEST_GROUP",
        owner: { id: "test-customer-4" },
        created_at: new Date(),
      } as any,
    ];

    // Create test data in Firestore
    for (const item of testItems) {
      await itemService.set(item);
    }
    
    for (const cartItem of testCartItems) {
      await cartItemService.set(cartItem);
    }
  });

  it("should update cart items with correct fraction_price_out", async () => {
    // Call the /fix-cartitems endpoint
    const response = await request(publicApi)
      .post("/fix-cartitems")
      .send({})
      .expect(200);

    // Verify response
    expect(response.body).toEqual({
      success: true,
      message: "Updated 2 cart items", // test-cart-item-1 and test-cart-item-3 should be updated
      updatedCount: 2,
      notFoundCount: 1,
      notFoundItemIds: ["non-existent-item"],
    });

    // Verify cart items were updated in the database
    const updatedCartItem1 = await cartItemService.find("test-cart-item-1");
    expect(updatedCartItem1).toBeDefined();
    expect(updatedCartItem1!.price).toBe(150.75); // Updated from 100.00 to 150.75

    const updatedCartItem2 = await cartItemService.find("test-cart-item-2");
    expect(updatedCartItem2).toBeDefined();
    expect(updatedCartItem2!.price).toBe(99.99); // Should remain unchanged

    const updatedCartItem3 = await cartItemService.find("test-cart-item-3");
    expect(updatedCartItem3).toBeDefined();
    expect(updatedCartItem3!.price).toBe(200.00); // Updated from 180.00 to 200.00

    const updatedCartItem4 = await cartItemService.find("test-cart-item-4");
    expect(updatedCartItem4).toBeDefined();
    expect(updatedCartItem4!.price).toBe(50.00); // Should remain unchanged (item not found)
  });

  it("should handle empty items and cart items", async () => {
    // Clear all data
    await db.recursiveDelete(db.collection("ITEMS"));
    await db.recursiveDelete(db.collection("CART_ITEMS"));

    const response = await request(publicApi)
      .post("/fix-cartitems")
      .send({})
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: "Updated 0 cart items",
      updatedCount: 0,
      notFoundCount: 0,
      notFoundItemIds: [],
    });
  });

  it("should handle case where all cart items have correct prices", async () => {
    // Update all cart items to have correct prices
    await cartItemService.update(testCartItems[0], { price: 150.75 }); // test-cart-item-1
    await cartItemService.update(testCartItems[2], { price: 200.00 }); // test-cart-item-3
    // Remove the cart item with non-existent item
    await cartItemService.delete(testCartItems[3]);

    const response = await request(publicApi)
      .post("/fix-cartitems")
      .send({})
      .expect(200);

    expect(response.body).toEqual({
      success: true,
      message: "Updated 0 cart items",
      updatedCount: 0,
      notFoundCount: 0,
      notFoundItemIds: [],
    });
  });
});
