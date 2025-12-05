import db from "../setup";
import { Order, Payment, OrderCancelledEvent } from "../../models";
import OrderCancelledProcessor from "../../services/events/OrderCancelledProcessor";
import OrderService from "../../services/OrderService";
import PaymentService from "../../services/PaymentService";
import TBankService from "../../services/payments/TBankService";

// Mock TBankService
jest.mock("../../services/payments/TBankService");

const mockTBankService = {
  orderToPaymentRequest: jest.fn(),
  cancelPayment: jest.fn(),
};

(TBankService as jest.MockedClass<typeof TBankService>).mockImplementation(() => mockTBankService as any);

describe("OrderCancelledProcessor Integration Test", () => {
  let orderCancelledProcessor: OrderCancelledProcessor;
  let orderService: OrderService;
  let paymentService: PaymentService;

  let createdOrder: Order;
  let createdPaymentSent: Payment;
  let createdPaymentConfirmed: Payment;
  let createdPaymentFailed: Payment;

  beforeEach(async () => {
    orderCancelledProcessor = new OrderCancelledProcessor(db as any);
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
          owner: { id: "test-customer-id" },
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

    // Create test payments with different statuses
    createdPaymentSent = {
      id: "test-payment-sent-id",
      external_id: "123456",
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com",
      order_id: "test-order-id",
      amount: 15000,
      total: 15000,
      status: "SENT",
      success: false,
      created_at: new Date(),
      updated_at: new Date(),
    } as any;

    createdPaymentConfirmed = {
      id: "test-payment-confirmed-id",
      external_id: "789012",
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com",
      order_id: "test-order-id",
      amount: 15000,
      total: 15000,
      status: "CONFIRMED",
      success: true,
      created_at: new Date(),
      updated_at: new Date(),
    } as any;

    createdPaymentFailed = {
      id: "test-payment-failed-id",
      external_id: "345678",
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com",
      order_id: "test-order-id",
      amount: 15000,
      total: 15000,
      status: "FAILED",
      success: false,
      created_at: new Date(),
      updated_at: new Date(),
    } as any;

    // Create test data in Firestore
    await orderService.set(createdOrder);
    await paymentService.set(createdPaymentSent);
    await paymentService.set(createdPaymentConfirmed);
    await paymentService.set(createdPaymentFailed);

    // Reset mocks
    mockTBankService.orderToPaymentRequest.mockClear();
    mockTBankService.cancelPayment.mockClear();
  });

  it("should return empty object when no active payments exist", async () => {
    // Create a new order without any active payments
    const orderWithoutActivePayments = {
      id: "test-order-no-active-payments",
      name: "Test Order No Active",
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
          owner: { id: "test-customer-id" },
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
    
    await orderService.set(orderWithoutActivePayments);

    // Create test event for the new order
    const testEvent: OrderCancelledEvent = {
      id: "test-event-id",
      idempotent_key: "idempotent-key-test",
      type: "ORDER_CANCELED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: orderWithoutActivePayments.id,
      },
    };

    // Process the event
    const result = await orderCancelledProcessor.process(testEvent);

    // Verify result is empty object
    expect(result).toEqual({ cancelations: []});

    // Verify no cancellation calls were made
    expect(mockTBankService.cancelPayment).not.toHaveBeenCalled();
  });

  it("should cancel active payments (SENT and CONFIRMED) and return empty object", async () => {
    // Create test event
    const testEvent: OrderCancelledEvent = {
      id: "test-event-id",
      idempotent_key: "idempotent-key-test",
      type: "ORDER_CANCELED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: createdOrder.id,
      },
    };

    // Mock orderToPaymentRequest to return a payment request
    const mockPaymentRequest = {
      Token: "mock-token",
      TerminalKey: "TEST_TERMINAL",
      Amount: 15000,
      OrderId: "test-order-id",
      Description: "Оплата заказа в магазине По Себестоимости",
      DATA: {
        Phone: process.env.SUPPORT_PHONE,
        Email: process.env.SUPPORT_EMAIL,
      },
      Receipt: {
        Email: "info@posebestoimosti.ru",
        Phone: "+79022394130",
        Taxation: "osn",
        Items: [],
      },
      RedirectDueDate: "2025-12-06T11:37:51+00:00",
    };

    mockTBankService.orderToPaymentRequest.mockReturnValue(mockPaymentRequest);

    // Mock successful cancellation responses
    const r1 = { Success: true, PaymentId: "123456", OrderId: "123456" };
    const r2 = { Success: true, PaymentId: "789012", OrderId: "789012" };
    mockTBankService.cancelPayment
      .mockResolvedValueOnce(r1)
      .mockResolvedValueOnce(r2);

    // Process the event
    const result = await orderCancelledProcessor.process(testEvent);

    // Verify result is empty object
    expect(result).toEqual({ cancelations: [r1, r2]});

    // Verify orderToPaymentRequest was called with the order
    expect(mockTBankService.orderToPaymentRequest).toHaveBeenCalledWith(createdOrder);

    // Verify cancelPayment was called twice (for SENT and CONFIRMED payments)
    expect(mockTBankService.cancelPayment).toHaveBeenCalledTimes(2);
  });

  it("should handle failed cancellations and log errors", async () => {
    // Create test event
    const testEvent: OrderCancelledEvent = {
      id: "test-event-id",
      idempotent_key: "idempotent-key-test",
      type: "ORDER_CANCELED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: createdOrder.id,
      },
    };

    // Mock orderToPaymentRequest
    const mockPaymentRequest = {
      Token: "mock-token",
      TerminalKey: "TEST_TERMINAL",
      Amount: 15000,
      OrderId: "test-order-id",
      Description: "Оплата заказа в магазине По Себестоимости",
      DATA: {
        Phone: process.env.SUPPORT_PHONE,
        Email: process.env.SUPPORT_EMAIL,
      },
      Receipt: {
        Email: "info@posebestoimosti.ru",
        Phone: "+79022394130",
        Taxation: "osn",
        Items: [],
      },
      RedirectDueDate: "2025-12-06T11:37:51+00:00",
    };

    mockTBankService.orderToPaymentRequest.mockReturnValue(mockPaymentRequest);

    // Mock one successful and one failed cancellation

    const res1 = { Success: true, PaymentId: "123456", OrderId: "123456" };
    const res2 = { 
        Success: false, 
        PaymentId: "789012", 
        OrderId: "789012",
        ErrorCode: "7",
        Message: "Payment already cancelled"
      };

    mockTBankService.cancelPayment
      .mockResolvedValueOnce(res1)
      .mockResolvedValueOnce(res2);

    // Mock the error logger
    const errorSpy = jest.spyOn(require("firebase-functions/logger"), "error");

    // Process the event
    const result = await orderCancelledProcessor.process(testEvent);

    // Verify result is empty object (processor doesn't throw on failed cancellations)
    expect(result).toEqual({ cancelations: [res1, res2]});

    // Verify error was logged for failed cancellation
    expect(errorSpy).toHaveBeenCalledWith(
      "Cancellation of Payment 789012 for order 789012 failed. Error : 7. Message: Payment already cancelled "
    );

    // Clean up spy
    errorSpy.mockRestore();
  });

  it("should only process SENT and CONFIRMED payments, ignoring other statuses", async () => {
    // Create test event
    const testEvent: OrderCancelledEvent = {
      id: "test-event-id",
      idempotent_key: "idempotent-key-test",
      type: "ORDER_CANCELED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: createdOrder.id,
      },
    };

    // Mock orderToPaymentRequest
    const mockPaymentRequest = {
      Token: "mock-token",
      TerminalKey: "TEST_TERMINAL",
      Amount: 15000,
      OrderId: "test-order-id",
      Description: "Оплата заказа в магазине По Себестоимости",
      DATA: {
        Phone: process.env.SUPPORT_PHONE,
        Email: process.env.SUPPORT_EMAIL,
      },
      Receipt: {
        Email: "info@posebestoimosti.ru",
        Phone: "+79022394130",
        Taxation: "osn",
        Items: [],
      },
      RedirectDueDate: "2025-12-06T11:37:51+00:00",
    };

    mockTBankService.orderToPaymentRequest.mockReturnValue(mockPaymentRequest);

    // Mock successful cancellations for both SENT and CONFIRMED payments

    const successOne = { Success: true, PaymentId: "123456", OrderId: "test-order-id" };
    const successTwo = { Success: true, PaymentId: "789012", OrderId: "test-order-id" };

    mockTBankService.cancelPayment
      .mockResolvedValueOnce(successOne)
      .mockResolvedValueOnce(successTwo);

    // Process the event
    const result = await orderCancelledProcessor.process(testEvent);

    // Verify result is empty object
    expect(result).toEqual({ cancelations : [successOne, successTwo]});

    // Verify cancelPayment was called twice (for SENT and CONFIRMED payments)
    expect(mockTBankService.cancelPayment).toHaveBeenCalledTimes(2);


  });
});
