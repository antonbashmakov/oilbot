import db from "../setup";
import {Order, Payment, OrderPaymentFailedEvent} from "../../models";
import OrderPaymentFailedProcessor from "../../services/events/OrderPaymentFailedProcessor";
import OrderService from "../../services/OrderService";
import PaymentService from "../../services/PaymentService";

describe("OrderPaymentFailedProcessor Integration Test", () => {
  let orderPaymentFailedProcessor: OrderPaymentFailedProcessor;
  let orderService: OrderService;
  let paymentService: PaymentService;

  let createdOrder: Order;
  let createdPayment: Payment;

  beforeEach(async () => {
    orderPaymentFailedProcessor = new OrderPaymentFailedProcessor(db as any);
    orderService = new OrderService(db as any);
    paymentService = new PaymentService(db as any);

    // Create test order
    createdOrder = {
      id: "test-order-id-failed",
      name: "Test Order Failed",
      created_at: new Date(),
      items: [
        {
          id: "test-item-1",
          name: "Test Item 1",
          price: 150,
          quantity: 1,
          item_id: "item-1",
          fraction: 1,
          price_for_unit: 150,
          group: "TEST_GROUP",
          owner: {id: "test-customer-id"},
        },
      ],
      status: "PAYMENT_IN_PROGRESS",
      type: "ORIGINAL",
      numberOfItems: 1,
      total: 150,
      owner: {
        id: "test-customer-id",
      },
    } as any;

    // Create test payment
    createdPayment = {
      id: "test-payment-id-failed",
      external_id: 123456,
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com",
      order_id: "test-order-id-failed",
      amount: 15000,
      success: true,
      status: "SENT",
      created_at: new Date(),
    } as Payment;

    // Create test data in Firestore
    await orderService.set(createdOrder);
    await paymentService.set(createdPayment);
  });

  it("should update order status to PAYMENT_FAILED and payment status to failed status", async () => {
    // Create test event for REVERSED payment
    const testEvent: OrderPaymentFailedEvent = {
      id: "test-event-id-failed",
      idempotent_key: "idempotent-key-failed",
      type: "ORDER_PAYMENT_FAILED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: createdOrder.id,
        external_id: 123456,
        status: "REVERSED",
      },
    };

    // Verify initial states
    const originalOrder = await orderService.find(createdOrder.id);
    const originalPayment = await paymentService.find(createdPayment.id);
    expect(originalOrder?.status).toBe("PAYMENT_IN_PROGRESS");
    expect(originalPayment?.success).toBe(true);
    expect(originalPayment?.status).toBe("SENT");

    // Process the event
    await orderPaymentFailedProcessor.process(testEvent);

    // Verify order and payment were updated
    const updatedOrder = await orderService.find(createdOrder.id);
    const updatedPayment = await paymentService.find(createdPayment.id);
    expect(updatedOrder?.status).toBe("PAYMENT_FAILED");
    expect(updatedPayment?.success).toBe(false);
    expect(updatedPayment?.status).toBe("REVERSED");
  });

  it("should handle different failed statuses correctly", async () => {
    const failedStatuses = ["CANCELED", "REJECTED", "DEADLINE_EXPIRED"];

    for (const status of failedStatuses) {
      // Create test event for each failed status
      const testEvent: OrderPaymentFailedEvent = {
        id: `test-event-id-${status}`,
        idempotent_key: `idempotent-key-${status}`,
        type: "ORDER_PAYMENT_FAILED",
        created_at: new Date(),
        processed: false,
        retries: 0,
        payload: {
          order_id: createdOrder.id,
          external_id: 123456,
          status: status,
        },
      };

      // Reset order status before each test by recreating the order
      await orderService.set({
        ...createdOrder,
        status: "PAYMENT_IN_PROGRESS",
      } as any);

      // Reset payment status before each test by recreating the payment
      await paymentService.set({
        ...createdPayment,
        success: true,
        status: "SENT",
      } as any);

      // Process the event
      await orderPaymentFailedProcessor.process(testEvent);

      // Verify order and payment were updated
      const updatedOrder = await orderService.find(createdOrder.id);
      const updatedPayment = await paymentService.find(createdPayment.id);
      expect(updatedOrder?.status).toBe("PAYMENT_FAILED");
      expect(updatedPayment?.success).toBe(false);
      expect(updatedPayment?.status).toBe(status);
    }
  });

  it("should throw error when payment is not found", async () => {
    // Create test event for non-existent payment
    const testEvent: OrderPaymentFailedEvent = {
      id: "test-event-id-no-payment",
      idempotent_key: "idempotent-key-no-payment",
      type: "ORDER_PAYMENT_FAILED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: createdOrder.id,
        external_id: 999999, // Non-existent external payment ID
        status: "REVERSED",
      },
    };

    // Verify that processing throws an error
    await expect(orderPaymentFailedProcessor.process(testEvent))
      .rejects
      .toThrow("Payment not found 999999");
  });

  it("should throw error when order is not found", async () => {
    // Create test event for non-existent order
    const testEvent: OrderPaymentFailedEvent = {
      id: "test-event-id-no-order",
      idempotent_key: "idempotent-key-no-order",
      type: "ORDER_PAYMENT_FAILED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: "non-existent-order-id",
        external_id: 123456,
        status: "REVERSED",
      },
    };

    // Verify that processing throws an error
    await expect(orderPaymentFailedProcessor.process(testEvent))
      .rejects
      .toThrow("Object ORDERS/non-existent-order-id is not found");
  });
});
