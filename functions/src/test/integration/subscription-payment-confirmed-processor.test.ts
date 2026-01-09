import db from "../setup";
import { Subscription, Payment, OrderPaymentConfirmedEvent } from "../../models";
import SubscriptionPaymentConfirmedProcessor from "../../services/events/SubscriptionPaymentConfirmedProcessor";
import SubscriptionService from "../../services/SubscriptionService";
import PaymentService from "../../services/PaymentService";
import CustomerService from "../../services/CustomerService";
import TelegramService from "../../services/TelegramService";

// Mock TelegramService
jest.mock("../../services/TelegramService");

const mockTelegramService = {
  sendMessage: jest.fn().mockResolvedValue(undefined),
};

(TelegramService as jest.MockedClass<typeof TelegramService>).mockImplementation(() => mockTelegramService as any);

describe("SubscriptionPaymentConfirmedProcessor Integration Test", () => {
  let subscriptionPaymentConfirmedProcessor: SubscriptionPaymentConfirmedProcessor;
  let subscriptionService: SubscriptionService;
  let paymentService: PaymentService;
  let customerService: CustomerService;

  let createdSubscription: Subscription;
  let createdPayment: Payment;

  beforeEach(async () => {
    subscriptionPaymentConfirmedProcessor = new SubscriptionPaymentConfirmedProcessor(db as any);
    subscriptionService = new SubscriptionService(db as any);
    paymentService = new PaymentService(db as any);
    customerService = new CustomerService(db as any);

    // Create test subscription
    createdSubscription = {
      id: "test-subscription-id",
      created_at: new Date(),
      next_payment_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days from now
      status: "PENDING",
      fee: 300,
    } as any;

    // Create test payment
    createdPayment = {
      id: "test-payment-id",
      external_id: "123456",
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com",
      order_id: "test-subscription-id",
      amount: 30000, // 300 rubles in kopecks
      total: 30000,
      success: false,
      status: "SENT",
      created_at: new Date(),
      updated_at: new Date(),
    } as any;

    // Create test data in Firestore
    await subscriptionService.set(createdSubscription);
    await paymentService.set(createdPayment);

    // Reset mocks
    mockTelegramService.sendMessage.mockClear();
  });

  it("should update subscription status to ACTIVE and payment status to CONFIRMED", async () => {
    // Create test event
    const testEvent: OrderPaymentConfirmedEvent = {
      id: "test-event-id",
      idempotent_key: "idempotent-key-test",
      type: "ORDER_PAYMENT_CONFIRMED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        subscription_id: createdSubscription.id,
        external_id: "123456",
      },
    };

    // Verify initial states
    const originalSubscription = await subscriptionService.find(createdSubscription.id);
    const originalPayment = await paymentService.find(createdPayment.id);
    expect(originalSubscription?.status).toBe("PENDING");
    expect(originalPayment?.success).toBe(false);
    expect(originalPayment?.status).toBe("SENT");

    // Process the event
    await subscriptionPaymentConfirmedProcessor.process(testEvent);

    // Verify subscription and payment were updated
    const updatedSubscription = await subscriptionService.find(createdSubscription.id);
    const updatedPayment = await paymentService.find(createdPayment.id);
    expect(updatedSubscription?.status).toBe("ACTIVE");
    expect(updatedPayment?.success).toBe(true);
    expect(updatedPayment?.status).toBe("CONFIRMED");

    // Verify Telegram message was sent to admin
    expect(mockTelegramService.sendMessage).toHaveBeenCalledTimes(1);
    expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
      "270053857",
      "✅ Подписка оплачена!: test-subscription-id",
      "test-subscription-id"
    );
  });

  it("should update customer accounting with rebill_id when present in event payload", async () => {
    // Create customer accounting document first (it should exist before update)
    const accountingRef = customerService.getAccountingRef(createdSubscription.id);
    await accountingRef.set({
      id: createdSubscription.id,
      rebill_id: "",
    });

    // Create test event with rebill_id
    const testEvent: OrderPaymentConfirmedEvent = {
      id: "test-event-id",
      idempotent_key: "idempotent-key-rebill",
      type: "ORDER_PAYMENT_CONFIRMED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        subscription_id: createdSubscription.id,
        external_id: "123456",
        rebill_id: "rebill-12345",
      },
    };

    // Process the event
    await subscriptionPaymentConfirmedProcessor.process(testEvent);

    // Verify subscription and payment were updated
    const updatedSubscription = await subscriptionService.find(createdSubscription.id);
    const updatedPayment = await paymentService.find(createdPayment.id);
    expect(updatedSubscription?.status).toBe("ACTIVE");
    expect(updatedPayment?.success).toBe(true);

    // Verify customer accounting was updated with rebill_id
    const accountingDoc = await accountingRef.get();
    expect(accountingDoc.exists).toBe(true);
    expect(accountingDoc.data()?.rebill_id).toBe("rebill-12345");

    // Verify Telegram message was sent
    expect(mockTelegramService.sendMessage).toHaveBeenCalledTimes(1);
  });

  it("should throw error when payment is not found for subscription", async () => {
    // Create a test subscription first
    const testSubscription = {
      id: "test-subscription-for-payment-not-found",
      created_at: new Date(),
      next_payment_at: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000),
      status: "PENDING",
      fee: 300,
    } as any;
    await subscriptionService.set(testSubscription);

    // Create test event for non-existent payment
    const testEvent: OrderPaymentConfirmedEvent = {
      id: "test-event-id",
      idempotent_key: "idempotent-key-no-payment",
      type: "ORDER_PAYMENT_CONFIRMED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        subscription_id: testSubscription.id,
        external_id: "999999", // Non-existent external payment ID
      },
    };

    // Verify that processing throws an error
    await expect(subscriptionPaymentConfirmedProcessor.process(testEvent))
      .rejects
      .toThrow("Payment not found  999999");
  });

  it("should throw error when subscription is not found", async () => {
    // Create a test payment for non-existent subscription
    const testPayment = {
      id: "test-payment-for-subscription-not-found",
      external_id: "777777",
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com",
      order_id: "non-existent-subscription-id",
      amount: 30000,
      total: 30000,
      success: false,
      status: "SENT",
      created_at: new Date(),
      updated_at: new Date(),
    } as any;
    await paymentService.set(testPayment);

    // Create test event for non-existent subscription
    const testEvent: OrderPaymentConfirmedEvent = {
      id: "test-event-id",
      idempotent_key: "idempotent-key-no-subscription",
      type: "ORDER_PAYMENT_CONFIRMED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        subscription_id: "non-existent-subscription-id",
        external_id: "777777",
      },
    };

    // Verify that processing throws an error
    await expect(subscriptionPaymentConfirmedProcessor.process(testEvent))
      .rejects
      .toThrow("Object SUBSCRIPTIONS/non-existent-subscription-id is not found");
  });

  it("should handle payment with string external_id that matches numeric external_id in database", async () => {
    // Create a payment with numeric external_id (legacy format)
    const legacyPayment = {
      id: "legacy-payment-id",
      external_id: 123456, // numeric external_id
      terminal_key: "TEST_TERMINAL",
      payment_url: "https://test-payment-url.com",
      order_id: createdSubscription.id,
      amount: 30000,
      total: 30000,
      success: false,
      status: "SENT",
      created_at: new Date(),
      updated_at: new Date(),
    } as any;
    
    // Delete the existing payment and create legacy one
    await paymentService.getCollection().doc(createdPayment.id).delete();
    await paymentService.set(legacyPayment);

    // Create test event with string external_id
    const testEvent: OrderPaymentConfirmedEvent = {
      id: "test-event-id",
      idempotent_key: "idempotent-key-legacy",
      type: "ORDER_PAYMENT_CONFIRMED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        subscription_id: createdSubscription.id,
        external_id: "123456", // string external_id
      },
    };

    // Process the event - should find the payment despite type mismatch
    await subscriptionPaymentConfirmedProcessor.process(testEvent);

    // Verify subscription and payment were updated
    const updatedSubscription = await subscriptionService.find(createdSubscription.id);
    const updatedPayment = await paymentService.find(legacyPayment.id);
    expect(updatedSubscription?.status).toBe("ACTIVE");
    expect(updatedPayment?.success).toBe(true);
    expect(updatedPayment?.status).toBe("CONFIRMED");

    // Verify Telegram message was sent
    expect(mockTelegramService.sendMessage).toHaveBeenCalledTimes(1);
  });
});
