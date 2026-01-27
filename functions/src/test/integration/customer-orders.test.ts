import db from "../setup";
import * as request from "supertest";
import * as jwt from "jsonwebtoken";
import { Customer } from "../../models";
import CustomerService from "../../services/CustomerService";
import OrderService from "../../services/OrderService";
import PaymentService from "../../services/PaymentService";

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

describe("Customer Orders Endpoint Integration Test", () => {
  let customerService: CustomerService;
  let orderService: OrderService;
  let paymentService: PaymentService;
  let testCustomer: Customer;

  beforeEach(async () => {
    customerService = new CustomerService(db as any);
    orderService = new OrderService(db as any);
    paymentService = new PaymentService(db as any);

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

  it("should return empty array when customer is new and has no orders nor payments", async () => {
    const response = await request(URL)
      .get(`/customers/${testCustomer.id}/orders`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .expect(200);

    // Verify response is an empty array
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(0);
  });

  it("should return orders with payments when customer has orders", async () => {
    // Create a test order for the customer
    const testOrder = {
      id: "test-order-id",
      name: "Test Order",
      created_at: new Date(),
      items: [
        {
          id: "test-item-1",
          name: "Test Item 1",
          price: 100,
          quantity: 1,
          item_id: "item-1",
          fraction: 1,
          price_for_unit: 100,
          group: "TEST_GROUP",
          owner: { id: testCustomer.id },
        },
      ],
      status: "PAID",
      type: "ORIGINAL",
      numberOfItems: 1,
      total: 100,
      owner: {
        id: testCustomer.id,
      },
    } as any;

    // Create a test payment for the order
    const testPayment = {
      id: "test-payment-id",
      external_id: 123456,
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com",
      order_id: "test-order-id",
      amount: 10000,
      total: 10000,
      success: true,
      status: "CONFIRMED",
      created_at: new Date(),
      updated_at: new Date(),
    } as any;

    await orderService.set(testOrder);
    await paymentService.set(testPayment);

    const response = await request(URL)
      .get(`/customers/${testCustomer.id}/orders`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .expect(200);

    // Verify response contains the order with payment
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    
    const orderOverview = response.body[0];
    expect(orderOverview.id).toBe("test-order-id");
    expect(orderOverview.payment).toBeDefined();
    expect(orderOverview.payment.id).toBe("test-payment-id");
    expect(orderOverview.payment.order_id).toBe("test-order-id");
  });

  it("should return orders without payments when customer has orders but no payments", async () => {
    // Create a test order for the customer without payment
    const testOrder = {
      id: "test-order-id-2",
      name: "Test Order 2",
      created_at: new Date(),
      items: [
        {
          id: "test-item-2",
          name: "Test Item 2",
          price: 200,
          quantity: 2,
          item_id: "item-2",
          fraction: 1,
          price_for_unit: 100,
          group: "TEST_GROUP",
          owner: { id: testCustomer.id },
        },
      ],
      status: "PENDING",
      type: "ORIGINAL",
      numberOfItems: 2,
      total: 200,
      owner: {
        id: testCustomer.id,
      },
    } as any;

    await orderService.set(testOrder);

    const response = await request(URL)
      .get(`/customers/${testCustomer.id}/orders`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .expect(200);

    // Verify response contains the order without payment
    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(1);
    
    const orderOverview = response.body[0];
    expect(orderOverview.id).toBe("test-order-id-2");
    expect(orderOverview.payment).toBeUndefined();
  });

  it("should return 404 when customer does not exist", async () => {
    const nonExistentCustomerId = "non-existent-customer-id";

    const response = await request(URL)
      .get(`/customers/${nonExistentCustomerId}/orders`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .expect(404);

    expect(response.body.error.message).toBe("Customer not found");
  });

  it("should handle multiple orders with mixed payment statuses", async () => {
    // Create multiple orders with different payment statuses
    const order1 = {
      id: "order-1",
      name: "Order 1",
      created_at: new Date(),
      items: [],
      status: "PAID",
      type: "ORIGINAL",
      numberOfItems: 0,
      total: 100,
      owner: { id: testCustomer.id },
    } as any;

    const order2 = {
      id: "order-2",
      name: "Order 2",
      created_at: new Date(),
      items: [],
      status: "PENDING",
      type: "ORIGINAL",
      numberOfItems: 0,
      total: 200,
      owner: { id: testCustomer.id },
    } as any;

    const payment1 = {
      id: "payment-1",
      external_id: 111111,
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com/1",
      order_id: "order-1",
      amount: 10000,
      total: 10000,
      success: true,
      status: "CONFIRMED",
      created_at: new Date(),
      updated_at: new Date(),
    } as any;

    await orderService.set(order1);
    await orderService.set(order2);
    await paymentService.set(payment1);

    const response = await request(URL)
      .get(`/customers/${testCustomer.id}/orders`)
      .set('Authorization', `Bearer ${createCustomerToken()}`)
      .expect(200);

    expect(Array.isArray(response.body)).toBe(true);
    expect(response.body.length).toBe(2);
    
    // Find order with payment
    const orderWithPayment = response.body.find((o: any) => o.id === "order-1");
    expect(orderWithPayment).toBeDefined();
    expect(orderWithPayment.payment).toBeDefined();
    expect(orderWithPayment.payment.id).toBe("payment-1");
    
    // Find order without payment
    const orderWithoutPayment = response.body.find((o: any) => o.id === "order-2");
    expect(orderWithoutPayment).toBeDefined();
    expect(orderWithoutPayment.payment).toBeUndefined();
  });
});