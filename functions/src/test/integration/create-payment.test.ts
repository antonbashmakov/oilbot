import db from "../setup";
import {Order, Payment} from "../../models";
import OrderService from "../../services/OrderService";
import PaymentService from "../../services/PaymentService";
import IdempotencyGuardService from "../../services/IdempotencyGuardService";

describe("Create Payment Endpoint Integration Test", () => {
  let orderService: OrderService;
  let paymentService: PaymentService;
  let idempotencyGuardService: IdempotencyGuardService;

  let testOrder: Order;

  beforeEach(async () => {
    orderService = new OrderService(db as any);
    paymentService = new PaymentService(db as any);
    idempotencyGuardService = new IdempotencyGuardService(db as any);

    // Create test order
    testOrder = {
      id: "test-order-for-payment",
      name: "Test Order for Payment",
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
          owner: {id: "test-customer-id"},
        },
      ],
      status: "PENDING",
      type: "ORIGINAL",
      numberOfItems: 1,
      total: 100,
      owner: {
        id: "test-customer-id",
      },
    } as any;

    // Create test data in Firestore
    await orderService.set(testOrder);
  });

  it("should create a new payment when no active payments exist", async () => {
    // Test the idempotency guard service
    const idempotencyKey = "test-idempotency-key-1";

    const result = await idempotencyGuardService.runIdempotentRequest(
      idempotencyKey,
      async () => {
        // Simulate payment creation
        const paymentRef = paymentService.getCollection().doc();
        const paymentData: Payment = {
          id: paymentRef.id,
          external_id: 123456,
          terminal_key: "TEST_TERMINAL",
          payment_url: "https://test-payment-url.com/1",
          order_id: testOrder.id,
          amount: testOrder.total * 100,
          total: testOrder.total * 100,
          status: "SENT",
          success: false,
          created_at: new Date(),
          updated_at: new Date(),
        };

        await paymentRef.set(paymentData);
        return paymentData;
      }
    );

    expect(result).toBeDefined();
    expect(result.order_id).toBe(testOrder.id);
    expect(result.status).toBe("SENT");
  });

  it("should return the same result for duplicate idempotency key", async () => {
    const idempotencyKey = "test-idempotency-key-2";
    let callCount = 0;

    const method = async () => {
      callCount++;
      const paymentRef = paymentService.getCollection().doc();
      const paymentData: Payment = {
        id: paymentRef.id,
        external_id: 789012,
        terminal_key: "TEST_TERMINAL",
        payment_url: "https://test-payment-url.com/2",
        order_id: testOrder.id,
        amount: testOrder.total * 100,
        total: testOrder.total * 100,
        status: "SENT",
        success: false,
        created_at: new Date(),
        updated_at: new Date(),
      };

      await paymentRef.set(paymentData);
      return paymentData;
    };

    // First call
    const result1 = await idempotencyGuardService.runIdempotentRequest(idempotencyKey, method);

    // Second call with same key
    const result2 = await idempotencyGuardService.runIdempotentRequest(idempotencyKey, method);

    expect(callCount).toBe(1); // Method should only be called once
    expect(result1.id).toBe(result2.id); // Should return same result
  });

  it("should detect existing payments in SENT or CONFIRMED status", async () => {
    // Create a payment in SENT status
    const sentPayment: Payment = {
      id: "test-sent-payment",
      external_id: 111111,
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com/sent",
      order_id: testOrder.id,
      amount: 10000,
      total: 10000,
      status: "SENT",
      success: false,
      created_at: new Date(),
      updated_at: new Date(),
    } as any;

    await paymentService.set(sentPayment);

    // Check if payment exists
    const existingPayments = await paymentService.findByOrderId(testOrder.id);
    const hasActivePayment = existingPayments.some((payment) =>
      payment.status === "SENT" || payment.status === "CONFIRMED"
    );

    expect(hasActivePayment).toBe(true);
    expect(existingPayments).toHaveLength(1);
    expect(existingPayments[0].status).toBe("SENT");
  });

  it("should not consider FAILED payments as active", async () => {
    // Create a payment in FAILED status
    const failedPayment: Payment = {
      id: "test-failed-payment",
      external_id: 222222,
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com/failed",
      order_id: testOrder.id,
      amount: 10000,
      total: 10000,
      status: "FAILED",
      success: false,
      created_at: new Date(),
      updated_at: new Date(),
    } as any;

    await paymentService.set(failedPayment);

    // Check if payment exists
    const existingPayments = await paymentService.findByOrderId(testOrder.id);
    const hasActivePayment = existingPayments.some((payment) =>
      payment.status === "SENT" || payment.status === "CONFIRMED"
    );

    expect(hasActivePayment).toBe(false);
    expect(existingPayments).toHaveLength(1);
    expect(existingPayments[0].status).toBe("FAILED");
  });
});
