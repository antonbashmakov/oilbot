import db from "../setup";
import * as request from "supertest";
import * as jwt from "jsonwebtoken";
import { Customer, Item, CartItem, Subscription } from "../../models";
import CustomerService from "../../services/CustomerService";
import ItemService from "../../services/ItemService";
import CartItemService from "../../services/CartItemService";
import SubscriptionService from "../../services/SubscriptionService";
import moment = require("moment");
// import SubscriptionService from "../../services/SubscriptionService";

const JWT_SECRET = "secter";

const URL = "http://127.0.0.1:5001/test-project/us-central1/private";

const createCustomerToken = () => {
  const payload = {
    id: "test-customer-id",
    email: "admin@test.com",
    roles: ["ADMIN"],
  };
  return jwt.sign(payload, JWT_SECRET, {
    expiresIn: "1h",
  });
};



describe("Cart Order Endpoint Integration Test", () => {
  let customerService: CustomerService;
  let itemService: ItemService;
  let cartItemService: CartItemService;
  let testCustomer: Customer;
  let testItem: Item;
  let testCartItem: CartItem;
  let subscriptionService: SubscriptionService;


  beforeEach(async () => {
    customerService = new CustomerService(db as any);
    itemService = new ItemService(db as any);
    cartItemService = new CartItemService(db as any);

    subscriptionService = new SubscriptionService(db as any);

    // Create test customer
    testCustomer = {
      id: "test-customer-id",
      first_name: "Test",
      last_name: "Customer",
      language_code: "ru",
      username: "testuser",
    } as any;

    // Create test item
    testItem = {
      id: "test-item-id",
      name: "Test Item",
      price_out: 100,
      fraction: 1,
      category: "TEST",
      group: "TEST_GROUP",
      description: "Test item description",
      fraction_price_out: 100,
      link: "https://test.com/item",
      price_in: 80,
      row_number: 1,
      status: "ACTIVE",
      unit: "кг",
      unit_description: "килограмм",
    } as any;

    // Create test cart item
    testCartItem = {
      id: "test-cart-item-id",
      item_id: testItem.id,
      name: testItem.name,
      price: testItem.price_out,
      quantity: 1,
      fraction: testItem.fraction,
      price_for_unit: testItem.price_out,
      category: testItem.category,
      group: testItem.group,
      owner: { id: testCustomer.id },
      created_at: new Date(),
    } as any;

    // Create test data in Firestore
    await customerService.set(testCustomer);
    await itemService.set(testItem);
    await cartItemService.set(testCartItem);

  });

  it("should create order and payment when cart has items", async () => {
    const response = await request(URL)
      .post(`/customers/${testCustomer.id}/cart/order`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', 'test-idempotency-key-1')
      .expect(200);

    // Verify response contains paymentUrl
    expect(response.body).toHaveProperty('paymentUrl');
    expect(response.body.paymentUrl).toBe("https://securepay.tinkoff.ru/p/MOCK_PAYMENT");

    // Verify mocks were called

    const cartItems = await cartItemService.fetchForOwner({ id: testCustomer.id });
    expect(cartItems.length).toBe(0);

    const stats = await customerService.obtainStatistics(testCustomer.id);

    expect(stats.number_of_orders).toBe(1);
    expect(stats.number_of_active_orders).toBe(1);

  });

  it("should return idempotent result for duplicate requests", async () => {
    const idempotencyKey = 'test-idempotency-key-2';

    // First call
    const response1 = await request(URL)
      .post(`/customers/${testCustomer.id}/cart/order`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', idempotencyKey)
      .expect(200);

    // Second call with same idempotency key
    const response2 = await request(URL)
      .post(`/customers/${testCustomer.id}/cart/order`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', idempotencyKey)
      .expect(200);

    // Should return same result
    expect(response1.body.paymentUrl).toBe(response2.body.paymentUrl);

  });

  it("should require subscription when customer has more than 1 fulfilled order", async () => {

    await customerService.incrementStatistics(testCustomer.id, { number_of_fulfilled_orders: 1 });

    let response = await request(URL)
      .post(`/customers/${testCustomer.id}/cart/order`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', 'test-idempotency-key-3')
      .expect(402); // Payment Required

    expect(response.body.error.code).toBe("PAYMENT_REQUIRED");
    expect(response.body.error.message).toBe("Customer needs an active subscription to place orders");

    await customerService.incrementStatistics(testCustomer.id, { number_of_fulfilled_orders: -1, number_of_active_orders: 1 });

    response = await request(URL)
      .post(`/customers/${testCustomer.id}/cart/order`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', 'test-idempotency-key-3')
      .expect(402); // Payment Required

    expect(response.body.error.code).toBe("PAYMENT_REQUIRED");
    expect(response.body.error.message).toBe("Customer needs an active subscription to place orders");

    const s: Subscription = {
      id: testCustomer.id,
      created_at: new Date(),
      next_payment_at: moment(new Date()).add(1, "month").toDate(),
      status: "ACTIVE",
      fee: 300,
    };
    await subscriptionService.set(s);

    response = await request(URL)
      .post(`/customers/${testCustomer.id}/cart/order`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', 'test-idempotency-key-3')
      .expect(200); 


  });


  it("should return error when cart is empty", async () => {


    // Remove cart item to simulate empty cart
    await cartItemService.delete(testCartItem);

    const response = await request(URL)
      .post(`/customers/${testCustomer.id}/cart/order`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', 'test-idempotency-key-5')
      .expect(400); // Bad Request

    expect(response.body.error.message).toBe("Cart is empty");
  });

  it("should return error when customer not found", async () => {
    // Delete customer to simulate not found
    await customerService.getCollection().doc(testCustomer.id).delete();

    const response = await request(URL)
      .post(`/customers/${testCustomer.id}/cart/order`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', 'test-idempotency-key-6')
      .expect(404); // Not Found

    expect(response.body.error.message).toBe("Customer not found");
  });
});
