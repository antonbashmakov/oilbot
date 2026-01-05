import db from "../setup";
import {Order, PaymentCreatedEvent, Payment} from "../../models";
import OrderPaymentCreatedProcessor from "../../services/events/OrderPaymentCreatedProcessor";
import OrderService from "../../services/OrderService";
import PaymentService from "../../services/PaymentService";
import CustomerService from "../../services/CustomerService";
import ConversationMessageService from "../../services/ConversationMessageService";

import * as dotenv from "dotenv";
dotenv.config();

xdescribe("OrderPaymentCreatedProcessor Integration Test (Real Telegram)", () => {
  let processor: OrderPaymentCreatedProcessor;
  let orderService: OrderService;
  let paymentService: PaymentService;
  let customerService: CustomerService;
  let conversationMessageService: ConversationMessageService;

  let createdOrder: Order;
  let createdCustomer: any;
  let createdPayment: Payment;

  beforeEach(async () => {
    processor = new OrderPaymentCreatedProcessor(db as any);
    orderService = new OrderService(db as any);
    paymentService = new PaymentService(db as any);
    customerService = new CustomerService(db as any);
    conversationMessageService = new ConversationMessageService(db as any);

    // Create test customer
    createdCustomer = {
      created_at: new Date(),
      id: "test-customer-id",
      first_name: "Test",
      last_name: "Customer",
      email: "test@example.com",
      phone: "+1234567890",
    } as any;

    // Create test order
    createdOrder = {
      id: "test-order-id-payment-real",
      name: "Test Order Payment Real",
      created_at: new Date(),
      updated_at: new Date(),
      items: [
        {
          id: "test-item-1",
          name: "Test Item 1",
          price: 150,
          quantity: 1,
          item_id: "item-1",
          fraction: 1,
          category: "MEAT",
          price_for_unit: 150,
          group: "TEST_GROUP",
          owner: {id: "270053857"},
          created_at: new Date(),
        },
        {
          id: "test-item-2",
          name: "Test Item 2",
          price: 250,
          quantity: 1,
          category: "MEAT",
          item_id: "item-2",
          fraction: 1,
          price_for_unit: 150,
          group: "TEST_GROUP",
          owner: {id: "270053857"},
          created_at: new Date(),
        },
      ],
      status: "PENDING",
      type: "ORIGINAL",
      numberOfItems: 1,
      total: 350,
      owner: {
        id: "270053857", // This will be used as Telegram chat ID
      },
    } as Order;

    // Create test payment
    createdPayment = {
      id: "test-payment-id-real",
      external_id: "123456",
      terminal_key: "MOCK_TERMINAL",
      order_id: createdOrder.id,
      amount: 15000,
      success: true,
      status: "SENT",
      payment_url: `https://securepay.tinkoff.ru/${createdOrder.id}`,
      error_code: "0",
      total: 0,
      created_at: new Date(),
    } as Payment;

    // Create test data in Firestore
    await customerService.set(createdCustomer);
    await orderService.set(createdOrder);
    await paymentService.set(createdPayment);
  });

  it("should process ORDER_PAYMENT_CREATED event with real Telegram service", async () => {
    // Skip test if Telegram bot token is not configured
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.warn("TELEGRAM_BOT_TOKEN not configured, skipping real Telegram test");
      return;
    }

    // Create test event
    const testEvent: PaymentCreatedEvent = {
      id: "test-event-id-payment-real",
      type: "ORDER_PAYMENT_CREATED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        payment_id: createdPayment.id,
      },
    };

    // Process the event
    await processor.process(testEvent);

    // Verify that a conversation message was created
    const messages = await conversationMessageService.findAll();

    expect(messages).toHaveLength(1);
    expect(messages[0].provider).toBe("TELEGRAM");
    expect(messages[0].recipient_id).toBe("270053857");
    expect(messages[0].thread_id).toBe(createdPayment.order_id);
    expect(messages[0].text).toContain("Ваш заказ");
    expect(messages[0].text).toContain(createdPayment.payment_url);
  });

  it("should throw error when payment is not found", async () => {
    // Create test event with non-existent payment ID
    const testEvent: PaymentCreatedEvent = {
      id: "test-event-id-payment-real",
      type: "ORDER_PAYMENT_CREATED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        payment_id: "non-existent-payment-id-real",
      },
    };

    // Verify that processing throws an error
    await expect(processor.process(testEvent))
      .rejects
      .toThrow("Object PAYMENTS/non-existent-payment-id-real is not found");

    // Verify no conversation message was created
    const messages = await conversationMessageService.findAll();
    expect(messages).toHaveLength(0);
  });
});
