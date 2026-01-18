import db from "../setup";
import * as request from "supertest";
import * as jwt from "jsonwebtoken";
import { Customer, Item, CartItem, Subscription, CustomerBalance, Delivery } from "../../models";
import CustomerService from "../../services/CustomerService";
import ItemService from "../../services/ItemService";
import CartItemService from "../../services/CartItemService";
import SubscriptionService from "../../services/SubscriptionService";
import CustomerBalanceService from "../../services/CustomerBalanceService";
import moment = require("moment");
import DeliveryService from "../../services/DeliveryService";
import OrderService from "../../services/OrderService";
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
  let deliveryService: DeliveryService;
  let orderService: OrderService;


  beforeEach(async () => {
    customerService = new CustomerService(db as any);
    itemService = new ItemService(db as any);
    cartItemService = new CartItemService(db as any);

    subscriptionService = new SubscriptionService(db as any);
    customerBalanceService = new CustomerBalanceService(db as any);
    deliveryService = new DeliveryService(db as any);
    orderService = new OrderService(db as any);

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

    const initialBalance: CustomerBalance = {
      id: testCustomer.id,
      owner: { id: testCustomer.id },
      value: 500,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await customerBalanceService.set(initialBalance);

  });

  it("should create order and payment when cart has items", async () => {

    const response = await request(URL)
      .post(`/customers/${testCustomer.id}/cart/order`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', 'test-idempotency-key-1')
      .expect(200);

    // Verify response contains orders array
    expect(response.body).toHaveProperty('orders');
    expect(Array.isArray(response.body.orders)).toBe(true);
    expect(response.body.orders.length).toBe(1);

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

    // Should return same result (same orders array)
    expect(response1.body.orders.length).toBe(response2.body.orders.length);
    expect(response1.body.orders[0].id).toBe(response2.body.orders[0].id);

  });

  it("should require subscription when customer has no free orders", async () => {
    const initialBalance: CustomerBalance = {
      id: testCustomer.id,
      owner: { id: testCustomer.id },
      value: 0,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await customerBalanceService.set(initialBalance);
    await customerService.incrementStatistics(testCustomer.id, { number_of_free_orders: -100 });

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

    // Ensure customer has no free orders left
    await customerService.incrementStatistics(testCustomer.id, { number_of_free_orders: -1 });

    // Ensure no active subscription exists
    const existingSubscription = await subscriptionService.find(testCustomer.id);
    if (existingSubscription) {
      await subscriptionService.delete(existingSubscription);
    }

    // Call cart/order endpoint
    const response = await request(URL)
      .post(`/customers/${testCustomer.id}/cart/order`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', 'test-idempotency-key-balance-300')
      .expect(200);

    // Verify orders are returned (order created successfully)
    expect(response.body).toHaveProperty('orders');
    expect(Array.isArray(response.body.orders)).toBe(true);
    expect(response.body.orders.length).toBe(1);

    // Verify subscription was created
    const subscription = await subscriptionService.find(testCustomer.id);
    expect(subscription).toBeDefined();
    expect(subscription!.status).toBe("ACTIVE");
    expect(subscription!.fee).toBe(300);

    // Verify balance was reduced by 300 (check via balance service)
    const updatedBalance = await customerBalanceService.obtainForCustomer(testCustomer.id);
    expect(updatedBalance.value).toBe(200); // 500 - 300 = 200

    // Verify cart is empty after order
    const cartItems = await cartItemService.fetchForOwner({ id: testCustomer.id });
    expect(cartItems.length).toBe(0);

    // Verify order statistics updated
    const finalStats = await customerService.obtainStatistics(testCustomer.id);
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

  it("should split cart items into different orders by group and assign corresponding deliveries", async () => {
    // Create test deliveries for different groups
    const delivery1: Delivery = {
      id: "delivery-1",
      number: 1,
      status: "PENDING" as Delivery["status"],
      description: "Test delivery for GROUP_A",
      order_deadline: new Date(Date.now() + 86400000), // tomorrow
      delivery_start: new Date(Date.now() + 86400000 * 2), // day after tomorrow
      delivery_end: new Date(Date.now() + 86400000 * 2.5),
      group: "GROUP_A",
      orders: [],
    };

    const delivery2 = {
      id: "delivery-2",
      number: 2,
      status: "PENDING" as Delivery["status"],
      description: "Test delivery for GROUP_B",
      order_deadline: new Date(Date.now() + 86400000),
      delivery_start: new Date(Date.now() + 86400000 * 3), // later than delivery1
      delivery_end: new Date(Date.now() + 86400000 * 3.5),
      group: "GROUP_B",
      orders: [],
    };

    // Create an earlier delivery for GROUP_B to test earliest delivery selection
    const delivery2Early = {
      id: "delivery-2-early",
      number: 3,
      status: "PENDING" as Delivery["status"],
      description: "Earlier test delivery for GROUP_B",
      order_deadline: new Date(Date.now() + 86400000),
      delivery_start: new Date(Date.now() + 86400000 * 1.5), // earlier than delivery2
      delivery_end: new Date(Date.now() + 86400000 * 2),
      group: "GROUP_B",
      orders: [],
    };

    await cartItemService.delete(testCartItem); // Clear existing cart item

    await deliveryService.set(delivery1);
    await deliveryService.set(delivery2);
    await deliveryService.set(delivery2Early);

    // Create test items with different groups
    const item1 = {
      id: "test-item-1",
      name: "Test Item 1",
      price_out: 100,
      fraction: 1,
      category: "TEST",
      group: "GROUP_A",
      description: "Test item 1 description",
      fraction_price_out: 100,
      link: "https://test.com/item1",
      price_in: 80,
      row_number: 1,
      status: "ACTIVE",
      unit: "кг",
      unit_description: "килограмм",
      is_weighted: true,
    };

    const item2 = {
      id: "test-item-2",
      name: "Test Item 2",
      price_out: 200,
      fraction: 2,
      category: "TEST",
      group: "GROUP_B",
      description: "Test item 2 description",
      fraction_price_out: 200,
      link: "https://test.com/item2",
      price_in: 160,
      row_number: 2,
      status: "ACTIVE",
      unit: "кг",
      unit_description: "килограмм",
      is_weighted: true,
    };

    await itemService.set(item1);
    await itemService.set(item2);

    // Create cart items for different groups
    const cartItem1 = {
      id: "test-cart-item-1",
      item_id: item1.id,
      name: item1.name,
      price: item1.price_out,
      quantity: 1,
      fraction: item1.fraction,
      price_for_unit: item1.price_out,
      category: item1.category,
      group: item1.group,
      owner: { id: testCustomer.id },
      created_at: new Date(),
    };

    const cartItem2 = {
      id: "test-cart-item-2",
      item_id: item2.id,
      name: item2.name,
      price: item2.price_out,
      quantity: 2,
      fraction: item2.fraction,
      price_for_unit: item2.price_out,
      category: item2.category,
      group: item2.group,
      owner: { id: testCustomer.id },
      created_at: new Date(),
    };

    await cartItemService.set(cartItem1);
    await cartItemService.set(cartItem2);

    // Set customer balance
    const initialBalance: CustomerBalance = {
      id: testCustomer.id,
      owner: { id: testCustomer.id },
      value: 500,
      created_at: new Date(),
      updated_at: new Date(),
    };
    await customerBalanceService.set(initialBalance);

    // Call cart/order endpoint
    const response = await request(URL)
      .post(`/customers/${testCustomer.id}/cart/order`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', 'test-idempotency-key-split-groups')
      .expect(200);

    // Verify response contains orders array
    expect(response.body).toHaveProperty('orders');
    expect(Array.isArray(response.body.orders)).toBe(true);
    expect(response.body.orders.length).toBe(2);

    const orders = await orderService.fetchForOwner(testCustomer);

    expect(orders.length).toBe(2);

    const order1 = orders.find((order: any) =>
      order.items.some((item: any) => item.group === "GROUP_A")
    );
    const order2 = orders.find((order: any) =>
      order.items.some((item: any) => item.group === "GROUP_B")
    );

    expect(order1).toBeDefined();
    expect(order2).toBeDefined();

    expect(order1!.items.length).toBe(1);
    expect(order1!.items[0].group).toBe("GROUP_A");

    expect(order2!.items.length).toBe(1);
    expect(order2!.items[0].group).toBe("GROUP_B");

    expect(order1!.delivery).toBeDefined();
    expect(order1!.delivery!.id).toBe(delivery1.id);

    expect(order2!.delivery).toBeDefined();
    expect(order2!.delivery!.id).toBe(delivery2Early.id);

    const cartItems = await cartItemService.fetchForOwner({ id: testCustomer.id });
    expect(cartItems.length).toBe(0);

    const stats = await customerService.obtainStatistics(testCustomer.id);
    expect(stats.number_of_orders).toBe(2);
    expect(stats.number_of_active_orders).toBe(2);
  });
});
