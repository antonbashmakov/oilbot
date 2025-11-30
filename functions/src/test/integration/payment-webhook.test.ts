import db from "../setup";
import { OrderPaymentConfirmedEvent } from "../../models";
import OutboxEventService from "../../services/OutboxEventService";
import EventPublisher from "../../services/EventPublisher";
import { CONSTANTS } from "../../controllers/admin/imports";

// Mock the webhook controller logic directly
describe("Payment Webhook Logic Test", () => {
  let outboxEventService: OutboxEventService<OrderPaymentConfirmedEvent>;
  let eventPublisher: EventPublisher<OrderPaymentConfirmedEvent>;

  beforeEach(() => {
    outboxEventService = new OutboxEventService<OrderPaymentConfirmedEvent>(db as any);
    eventPublisher = new EventPublisher<OrderPaymentConfirmedEvent>(db as any);
  });

  it("should publish PAYMENT_CONFIRMED event for successful confirmed payments", async () => {
    const paymentWebhookBody = {
      TerminalKey: "1754681033618",
      OrderId: "9a99gND6Q5LPS0WFTNIj",
      Success: true,
      Status: "CONFIRMED",
      PaymentId: 7465191924,
      ErrorCode: "0",
      Amount: 287800,
      CardId: 627691463,
      Pan: "220070******2667",
      ExpDate: "0835",
      Token: "*****",
    };

    // Verify no ORDER_PAYMENT_CONFIRMED events exist initially
    const initialEvents = await outboxEventService.findAll();
    const initialOrderPaymentConfirmedEvents = initialEvents.filter(
      (event) => event.type === "ORDER_PAYMENT_CONFIRMED"
    );
    expect(initialOrderPaymentConfirmedEvents.length).toBe(0);

    // Simulate webhook processing logic
    const event: OrderPaymentConfirmedEvent = {
      id: "", // will be set by OutboxEventService
      idempotent_key: `payment-confirmed-${paymentWebhookBody.PaymentId}`,
      created_at: new Date(),
      processed_at: new Date(),
      processed: false,
      retries: 0,
      type: CONSTANTS.EVENTS.ORDER_PAYMENT_CONFIRMED,
      payload: {
        order_id: paymentWebhookBody.OrderId,
        external_payment_id: 123456

      },
    };

    await eventPublisher.publish(event);

    // Verify that ORDER_PAYMENT_CONFIRMED event was published
    const events = await outboxEventService.findAll();
    const OrderPaymentConfirmedEvents = events.filter(
      (event) => event.type === "ORDER_PAYMENT_CONFIRMED"
    );

    expect(OrderPaymentConfirmedEvents.length).toBe(1);

    const OrderPaymentConfirmedEvent = OrderPaymentConfirmedEvents[0];
    expect(OrderPaymentConfirmedEvent.payload).toEqual({
      order_id: "9a99gND6Q5LPS0WFTNIj",
      external_payment_id: 123456,
    });
    expect(OrderPaymentConfirmedEvent.idempotent_key).toBe("payment-confirmed-7465191924");
    expect(OrderPaymentConfirmedEvent.type).toBe("ORDER_PAYMENT_CONFIRMED");
    expect(OrderPaymentConfirmedEvent.processed).toBe(false);
    expect(OrderPaymentConfirmedEvent.retries).toBe(0);
  });

  it("should not publish ORDER_PAYMENT_CONFIRMED event for non-confirmed payments", async () => {
    const paymentWebhookBody = {
      TerminalKey: "1754681033618",
      OrderId: "9a99gND6Q5LPS0WFTNIj",
      Success: true,
      Status: "AUTHORIZED", // Not CONFIRMED
      PaymentId: 7465191924,
      ErrorCode: "0",
      Amount: 287800,
      CardId: 627691463,
      Pan: "220070******2667",
      ExpDate: "0835",
      Token: "****",
    };

    // Simulate webhook processing logic
    if (paymentWebhookBody.Success && paymentWebhookBody.Status === "CONFIRMED") {
      const event: OrderPaymentConfirmedEvent = {
        id: "", // will be set by OutboxEventService
        idempotent_key: `payment-confirmed-${paymentWebhookBody.PaymentId}`,
        created_at: new Date(),
        processed_at: new Date(),
        processed: false,
        retries: 0,
        type: CONSTANTS.EVENTS.ORDER_PAYMENT_CONFIRMED,
        payload: {
          order_id: paymentWebhookBody.OrderId,
          external_payment_id: 123456

        },
      };

      await eventPublisher.publish(event);
    }

    // Verify that no ORDER_PAYMENT_CONFIRMED event was published
    const events = await outboxEventService.findAll();
    const OrderPaymentConfirmedEvents = events.filter(
      (event) => event.type === "ORDER_PAYMENT_CONFIRMED"
    );

    expect(OrderPaymentConfirmedEvents.length).toBe(0);
  });

  it("should not publish ORDER_PAYMENT_CONFIRMED event for failed payments", async () => {
    const paymentWebhookBody = {
      TerminalKey: "1754681033618",
      OrderId: "9a99gND6Q5LPS0WFTNIj",
      Success: false, // Failed payment
      Status: "REJECTED",
      PaymentId: 7465191924,
      ErrorCode: "7",
      Amount: 287800,
      CardId: 627691463,
      Pan: "220070******2667",
      ExpDate: "0835",
      Token: "***",
    };

    // Simulate webhook processing logic
    if (paymentWebhookBody.Success && paymentWebhookBody.Status === "CONFIRMED") {
      const event: OrderPaymentConfirmedEvent = {
        id: "", // will be set by OutboxEventService
        idempotent_key: `payment-confirmed-${paymentWebhookBody.PaymentId}`,
        created_at: new Date(),
        processed_at: new Date(),
        processed: false,
        retries: 0,
        type: CONSTANTS.EVENTS.ORDER_PAYMENT_CONFIRMED,
        payload: {
          order_id: paymentWebhookBody.OrderId,
          external_payment_id: 123456

        },
      };

      await eventPublisher.publish(event);
    }

    // Verify that no ORDER_PAYMENT_CONFIRMED event was published
    const events = await outboxEventService.findAll();
    const OrderPaymentConfirmedEvents = events.filter(
      (event) => event.type === "ORDER_PAYMENT_CONFIRMED"
    );

    expect(OrderPaymentConfirmedEvents.length).toBe(0);
  });
});
