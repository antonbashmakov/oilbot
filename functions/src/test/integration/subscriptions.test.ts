import db from "../setup";
import * as request from "supertest";
import * as jwt from "jsonwebtoken";
import { Customer, Subscription } from "../../models";
import CustomerService from "../../services/CustomerService";
import SubscriptionService from "../../services/SubscriptionService";
import moment = require("moment");

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

describe("Subscriptions Endpoint Integration Test", () => {
  let customerService: CustomerService;
  let subscriptionService: SubscriptionService;
  let testCustomer: Customer;

  beforeEach(async () => {
    customerService = new CustomerService(db as any);
    subscriptionService = new SubscriptionService(db as any);

    // Create test customer
    testCustomer = {
      id: "test-customer-id",
      first_name: "Test",
      last_name: "Customer",
      language_code: "ru",
      username: "testuser",
    } as any;

    // Create test data in Firestore
    await customerService.set(testCustomer);
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await customerService.getCollection().doc(testCustomer.id).delete();
    } catch (e) {}
    try {
      await subscriptionService.getCollection().doc(testCustomer.id).delete();
    } catch (e) {}
  });

  it("should create subscription when customer has no active subscription", async () => {
    const response = await request(URL)
      .post(`/customers/${testCustomer.id}/subscriptions`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', 'test-subscription-key-1')
      .expect(200);

    // Verify response contains paymentUrl
    expect(response.body).toHaveProperty('paymentUrl');
    expect(response.body.paymentUrl).toBe("https://securepay.tinkoff.ru/p/MOCK_PAYMENT");

    // Verify subscription was created
    const subscription = await subscriptionService.find(testCustomer.id);
    expect(subscription).toBeDefined();
    expect(subscription?.status).toBe("PENDING");
    expect(subscription?.fee).toBe(300);
  });

  it("should return idempotent result for duplicate subscription requests", async () => {
    const idempotencyKey = 'test-subscription-key-2';

    // First call
    const response1 = await request(URL)
      .post(`/customers/${testCustomer.id}/subscriptions`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', idempotencyKey)
      .expect(200);

    // Second call with same idempotency key
    const response2 = await request(URL)
      .post(`/customers/${testCustomer.id}/subscriptions`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', idempotencyKey)
      .expect(200);

    // Should return same result
    expect(response1.body.paymentUrl).toBe(response2.body.paymentUrl);
  });

  it("should return error when customer already has active subscription", async () => {
    // Create an active subscription for the customer
    const activeSubscription: Subscription = {
      id: testCustomer.id,
      created_at: new Date(),
      next_payment_at: moment(new Date()).add(1, "month").toDate(),
      status: "ACTIVE",
      fee: 300,
    };
    await subscriptionService.set(activeSubscription);

    const response = await request(URL)
      .post(`/customers/${testCustomer.id}/subscriptions`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', 'test-subscription-key-3')
      .expect(400); // Bad Request

    expect(response.body.error.message).toBe("Customer already has an active subscription");
  });

  it("should allow subscription creation when customer has canceled subscription", async () => {
    // Create a canceled subscription for the customer
    const canceledSubscription: Subscription = {
      id: testCustomer.id,
      created_at: moment(new Date()).subtract(2, "months").toDate(),
      canceled_at: moment(new Date()).subtract(1, "month").toDate(),
      next_payment_at: moment(new Date()).subtract(1, "month").toDate(), // Payment date 1 month ago
      status: "CANCELED",
      fee: 300,
    };
    await subscriptionService.set(canceledSubscription);

    const response = await request(URL)
      .post(`/customers/${testCustomer.id}/subscriptions`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', 'test-subscription-key-4')
      .expect(200);

    expect(response.body).toHaveProperty('paymentUrl');
  });

  it("should return error when customer not found", async () => {
    // Delete customer to simulate not found
    await customerService.getCollection().doc(testCustomer.id).delete();

    const response = await request(URL)
      .post(`/customers/${testCustomer.id}/subscriptions`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .set('idempotency_key', 'test-subscription-key-5')
      .expect(404); // Not Found

    expect(response.body.error.message).toBe("Customer not found");
  });
});
