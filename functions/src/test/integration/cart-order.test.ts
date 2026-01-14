import db from "../setup";
import * as request from "supertest";
import * as jwt from "jsonwebtoken";
import { Customer, Item, CartItem, Subscription, CustomerBalance } from "../../models";
import CustomerService from "../../services/CustomerService";
import ItemService from "../../services/ItemService";
import CartItemService from "../../services/CartItemService";
import SubscriptionService from "../../services/SubscriptionService";
import CustomerBalanceService from "../../services/CustomerBalanceService";
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
  let customerBalanceService: CustomerBalanceService;


  beforeEach(async () => {
    customerService = new CustomerService(db as any);
    itemService = new ItemService(db as any);
    cartItemService = new CartItemService(db as any);

    subscriptionService = new SubscriptionService(db as any);
    customerBalanceService = new CustomerBalanceService(db as any);

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
    const initialBalance: CustomerBalance = {
      id: testCustomer.id,
      owner: { id: testCustomer.id },
      value: 500,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await customerBalanceService.set(initialBalance);

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

    const initialBalance: CustomerBalance = {
      id: testCustomer.id,
      owner: { id: testCustomer.id },
      value: 500,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await customerBalanceService.set(initialBalance);

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

    await customerService.incrementStatistics(testCustomer.id, { number_of_free_orders: -1 });

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

  it("should create new subscription if customer has balance more than 300", async () => {
    // Set customer balance to 500
    const initialBalance: CustomerBalance = {
      id: testCustomer.id,
      owner: { id: testCustomer.id },
      value: 500,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await customerBalanceService.set(initialBalance);
    const balanceCheck = await customerBalanceService.obtainForCustomer(testCustomer.id);
    console.log('Balance set to:', balanceCheck, 'type of value:', typeof balanceCheck.value);

    // Ensure customer has no free orders left
    await customerService.incrementStatistics(testCustomer.id, { number_of_free_orders: -1 });
    const stats = await customerService.obtainStatistics(testCustomer.id);
    console.log('Stats after decrement free orders:', stats);
    console.log('number_of_free_orders <= 0?', stats.number_of_free_orders <= 0);

    // Ensure no active subscription exists
    const existingSubscription = await subscriptionService.find(testCustomer.id);
    if (existingSubscription) {
      console.log('Existing subscription found, deleting:', existingSubscription);
      await subscriptionService.delete(existingSubscription);
    }
    console.log('Existing subscription after delete:', await subscriptionService.find(testCustomer.id));

    // Debug: check hasActiveSubscription
    const hasActive = await subscriptionService.hasActiveSubscription(testCustomer.id, new Date());
    console.log('hasActiveSubscription result:', hasActive);

    // Call cart/order endpoint
    const response = await request(URL)
      .post(`/customers/${testCustomer.id}/cart/order`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', 'test-idempotency-key-balance-300')
      .expect(200);

    // Verify payment URL is returned (order created successfully)
    expect(response.body).toHaveProperty('paymentUrl');
    expect(response.body.paymentUrl).toBe("https://securepay.tinkoff.ru/p/MOCK_PAYMENT");

    // Verify subscription was created
    const subscription = await subscriptionService.find(testCustomer.id);
    if (!subscription) {
      // Debug: check balance after request
      const balanceAfter = await customerBalanceService.obtainForCustomer(testCustomer.id);
      console.log('Balance after request:', balanceAfter);
      // Check if subscription exists with different ID?
      const allSubscriptions = await subscriptionService.findAll();
      console.log('All subscriptions:', allSubscriptions);
    }
    expect(subscription).toBeDefined();
    expect(subscription!.status).toBe("ACTIVE");
    expect(subscription!.fee).toBe(300);

    // Verify balance was reduced by 300 (check via balance service)
    const updatedBalance = await customerBalanceService.obtainForCustomer(testCustomer.id);
    console.log('Updated balance:', updatedBalance);
    expect(updatedBalance.value).toBe(200); // 500 - 300 = 200

    // Verify cart is empty after order
    const cartItems = await cartItemService.fetchForOwner({ id: testCustomer.id });
    expect(cartItems.length).toBe(0);

    // Verify order statistics updated
    const finalStats = await customerService.obtainStatistics(testCustomer.id);
    console.log('Final stats:', finalStats);
    expect(finalStats.number_of_orders).toBe(1);
    expect(finalStats.number_of_active_orders).toBe(1);
  });


  it("should return error when cart is empty", async () => {
    const initialBalance: CustomerBalance = {
      id: testCustomer.id,
      owner: { id: testCustomer.id },
      value: 500,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await customerBalanceService.set(initialBalance);

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
