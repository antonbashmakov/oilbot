import db from "../setup";
import {Order, Payment, OrderPaymentConfirmedEvent} from "../../models";
import OrderPaymentConfirmedProcessor from "../../services/events/OrderPaymentConfirmedProcessor";
import OrderService from "../../services/OrderService";
import PaymentService from "../../services/PaymentService";
import TelegramService from "../../services/TelegramService";

// Mock TelegramService
jest.mock("../../services/TelegramService");

const mockTelegramService = {
  sendMessage: jest.fn().mockResolvedValue(undefined),
};

(TelegramService as jest.MockedClass<typeof TelegramService>).mockImplementation(() => mockTelegramService as any);

describe("OrderPaymentConfirmedProcessor Integration Test", () => {
  let orderPaymentConfirmedProcessor: OrderPaymentConfirmedProcessor;
  let orderService: OrderService;
  let paymentService: PaymentService;

  let createdOrder: Order;
  let createdPayment: Payment;
  let createdConciliationOrder: Order;

  beforeEach(async () => {
    orderPaymentConfirmedProcessor = new OrderPaymentConfirmedProcessor(db as any);
    orderService = new OrderService(db as any);
    paymentService = new PaymentService(db as any);

    // Create test order
    createdOrder = {
      id: "test-order-id",
      name: "Test Order",
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
      status: "PENDING",
      type: "ORIGINAL",
      numberOfItems: 1,
      total: 150,
      owner: {
        id: "test-customer-id",
      },
    } as any;

    // Create test conciliation order
    createdConciliationOrder = {
      id: "test-conciliation-order-id",
      name: "Test Conciliation Order",
      created_at: new Date(),
      items: [
        {
          id: "test-conciliation-item-1",
          name: "Финальный расчёт заказа",
          price: 50,
          quantity: 1,
          item_id: "conciliation-item-1",
          fraction: 1,
          price_for_unit: 50,
          group: "TEST_GROUP",
          owner: {id: "test-customer-id"},
        },
      ],
      status: "PAYMENT_IN_PROGRESS",
      type: "CONCILIATION",
      reconciliated_order_id: "test-order-id",
      numberOfItems: 1,
      total: 50,
      owner: {
        id: "test-customer-id",
      },
    } as any;

    // Create test payment
    createdPayment = {
      id: "test-payment-id",
      external_id: "123456",
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com",
      order_id: "test-order-id",
      amount: 15000,
      success: false,
      created_at: new Date(),
    } as any;

    // Create test data in Firestore
    await orderService.set(createdOrder);
    await orderService.set(createdConciliationOrder);
    await paymentService.set(createdPayment);

    // Reset mocks
    mockTelegramService.sendMessage.mockClear();
  });

  it("should update order status to PAID and payment status to SUCCESS for ORIGINAL order", async () => {
    // Create test event
    const testEvent: OrderPaymentConfirmedEvent = {
      id: "test-event-id",
      idempotent_key: "idempotent-key-test",
      type: "ORDER_PAYMENT_CONFIRMED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: createdOrder.id,
        external_id: 123456,
      },
    };

    // Verify initial states
    const originalOrder = await orderService.find(createdOrder.id);
    const originalPayment = await paymentService.find(createdPayment.id);
    expect(originalOrder?.status).toBe("PENDING");
    expect(originalPayment?.success).toBe(false);

    // Process the event
    await orderPaymentConfirmedProcessor.process(testEvent);

    // Verify order and payment were updated
    const updatedOrder = await orderService.find(createdOrder.id);
    const updatedPayment = await paymentService.find(createdPayment.id);
    expect(updatedOrder?.status).toBe("PAID");
    expect(updatedPayment?.success).toBe(true);

    // Verify Telegram messages were sent
    expect(mockTelegramService.sendMessage).toHaveBeenCalledTimes(2);
    expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
      "test-customer-id",
      expect.stringContaining("✅ Мы приняли оплату за ваш заказ")
    );
    expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
      "270053857",
      "✅ Ордер оплачен!: test-order-id"
    );
  });

  it("should update CONCILIATION order and original order status for CONCILIATION order", async () => {
    // Create test event for conciliation order
    const testEvent: OrderPaymentConfirmedEvent = {
      id: "test-event-id",
      idempotent_key: "idempotent-key-conciliation",
      type: "ORDER_PAYMENT_CONFIRMED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: createdConciliationOrder.id,
        external_id: 123456,
      },
    };

    // Verify initial states
    const originalConciliationOrder = await orderService.find(createdConciliationOrder.id);
    const originalOrder = await orderService.find(createdOrder.id);
    expect(originalConciliationOrder?.status).toBe("PAYMENT_IN_PROGRESS");
    expect(originalOrder?.status).toBe("PENDING");

    // Process the event
    await orderPaymentConfirmedProcessor.process(testEvent);

    // Verify conciliation order and original order were updated
    const updatedConciliationOrder = await orderService.find(createdConciliationOrder.id);
    const updatedOrder = await orderService.find(createdOrder.id);
    expect(updatedConciliationOrder?.status).toBe("PAID");
    expect(updatedOrder?.status).toBe("CONCILIATED");

    // Verify Telegram messages were sent
    expect(mockTelegramService.sendMessage).toHaveBeenCalledTimes(2);
    expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
      "test-customer-id",
      expect.stringContaining("✅ Разница по заказу успешно оплачена")
    );
    expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
      "270053857",
      "✅ Ордер оплачен!: test-conciliation-order-id"
    );
  });

  it("should throw error when payment is not found for order", async () => {
    // Create a test order first
    const testOrder = {
      id: "test-order-for-payment-not-found",
      name: "Test Order",
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
      status: "PENDING",
      type: "ORIGINAL",
      numberOfItems: 1,
      total: 150,
      owner: {
        id: "test-customer-id",
      },
    } as any;
    await orderService.set(testOrder);

    // Create test event for non-existent payment
    const testEvent: OrderPaymentConfirmedEvent = {
      id: "test-event-id",
      idempotent_key: "idempotent-key-no-payment",
      type: "ORDER_PAYMENT_CONFIRMED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: testOrder.id,
        external_id: 999999, // Non-existent external payment ID
      },
    };

    // Verify that processing throws an error
    await expect(orderPaymentConfirmedProcessor.process(testEvent))
      .rejects
      .toThrow("Payment not found  999999");
  });

  it("should handle ORIGINAL order with detailed telegram message", async () => {
    // Create test event
    const testEvent: OrderPaymentConfirmedEvent = {
      id: "test-event-id",
      idempotent_key: "idempotent-key-detailed-message",
      type: "ORDER_PAYMENT_CONFIRMED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: createdOrder.id,
        external_id: 123456,
      },
    };

    // Process the event
    await orderPaymentConfirmedProcessor.process(testEvent);

    // Verify detailed telegram message was sent using template
    const telegramCalls = mockTelegramService.sendMessage.mock.calls;
    const customerMessageCall = telegramCalls.find((call) => call[0] === "test-customer-id");
    expect(customerMessageCall).toBeDefined();

    const message = customerMessageCall![1];
    expect(message).toContain("✅ Мы приняли оплату за ваш заказ");
    expect(message).toContain("*Test Item 1* : 150₽");
    expect(message).toContain("Общая стоимость заказа: 150₽");
    expect(message).toContain("Благодарим за покупку");
    expect(message).toContain("@antonoldenberg");
  });

  it("should handle CONCILIATION order with conciliation telegram message", async () => {
    // Create test event for conciliation order
    const testEvent: OrderPaymentConfirmedEvent = {
      id: "test-event-id",
      idempotent_key: "idempotent-key-conciliation-message",
      type: "ORDER_PAYMENT_CONFIRMED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: createdConciliationOrder.id,
        external_id: 123456,
      },
    };

    // Process the event
    await orderPaymentConfirmedProcessor.process(testEvent);

    // Verify conciliation telegram message was sent
    const telegramCalls = mockTelegramService.sendMessage.mock.calls;
    const customerMessageCall = telegramCalls.find((call) => call[0] === "test-customer-id");
    expect(customerMessageCall).toBeDefined();

    const message = customerMessageCall![1];
    expect(message).toContain("✅ Разница по заказу успешно оплачена");
    expect(message).toContain("Исходный заказ: *test-order-id*");
  });
});
