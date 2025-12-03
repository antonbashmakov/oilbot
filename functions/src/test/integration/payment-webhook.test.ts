import * as request from "supertest";
import db from "../setup";
import { OrderPaymentConfirmedEvent, OrderPaymentFailedEvent } from "../../models";
import OutboxEventService from "../../services/OutboxEventService";
import { CONSTANTS } from "../../controllers/admin/imports";

const WEBHOOK_BASE_URL = "http://127.0.0.1:5001/test-project/us-central1/webhooks";

describe("Payment Webhook Endpoint Integration Test", () => {
  let outboxEventService: OutboxEventService<OrderPaymentConfirmedEvent | OrderPaymentFailedEvent>;

  beforeEach(() => {
    outboxEventService = new OutboxEventService(db as any);
  });

  it("should publish ORDER_PAYMENT_CONFIRMED event for successful confirmed payments", async () => {
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
      (event) => event.type === CONSTANTS.EVENTS.ORDER_PAYMENT_CONFIRMED
    );
    expect(initialOrderPaymentConfirmedEvents.length).toBe(0);

    // Call the webhook endpoint
    const response = await request(WEBHOOK_BASE_URL)
      .post("/payment")
      .send(paymentWebhookBody)
      .expect(200);

    expect(response.text).toBe("OK");

    // Verify that ORDER_PAYMENT_CONFIRMED event was published
    const events = await outboxEventService.findAll();
    const orderPaymentConfirmedEvents = events.filter(
      (event) => event.type === CONSTANTS.EVENTS.ORDER_PAYMENT_CONFIRMED
    );

    expect(orderPaymentConfirmedEvents.length).toBe(1);

    const orderPaymentConfirmedEvent = orderPaymentConfirmedEvents[0];
    expect(orderPaymentConfirmedEvent.payload).toEqual({
      order_id: "9a99gND6Q5LPS0WFTNIj",
      external_id: 7465191924,
    });
    expect(orderPaymentConfirmedEvent.type).toBe(CONSTANTS.EVENTS.ORDER_PAYMENT_CONFIRMED);
    expect(orderPaymentConfirmedEvent.processed).toBe(false);
    expect(orderPaymentConfirmedEvent.retries).toBe(0);
  });

  it("should publish ORDER_PAYMENT_FAILED event for failed payment statuses", async () => {
    const paymentWebhookBody = {
      TerminalKey: "1754681033618",
      OrderId: "9a99gND6Q5LPS0WFTNIj",
      Success: true,
      Status: "REJECTED",
      PaymentId: 7465191925,
      ErrorCode: "7",
      Amount: 287800,
      CardId: 627691463,
      Pan: "220070******2667",
      ExpDate: "0835",
      Token: "*****",
    };

    // Verify no ORDER_PAYMENT_FAILED events exist initially
    const initialEvents = await outboxEventService.findAll();
    expect(initialEvents.length).toBe(0);

    // Call the webhook endpoint
    const response = await request(WEBHOOK_BASE_URL)
      .post("/payment")
      .send(paymentWebhookBody)
      .expect(200);

    expect(response.text).toBe("OK");

    // Verify that ORDER_PAYMENT_FAILED event was published
    const events = await outboxEventService.findAll();
    const orderPaymentFailedEvents = events.filter(
      (event) => event.type === CONSTANTS.EVENTS.ORDER_PAYMENT_FAILED
    );

    expect(orderPaymentFailedEvents.length).toBe(1);

    const orderPaymentFailedEvent = orderPaymentFailedEvents[0];
    expect(orderPaymentFailedEvent.payload).toEqual({
      order_id: "9a99gND6Q5LPS0WFTNIj",
      external_id: 7465191925,
      status: "REJECTED",
    });
    expect(orderPaymentFailedEvent.type).toBe(CONSTANTS.EVENTS.ORDER_PAYMENT_FAILED);
    expect(orderPaymentFailedEvent.processed).toBe(false);
    expect(orderPaymentFailedEvent.retries).toBe(0);
  });

  it("should publish ORDER_PAYMENT_FAILED event for successful but failed status payments", async () => {
    const paymentWebhookBody = {
      TerminalKey: "1754681033618",
      OrderId: "9a99gND6Q5LPS0WFTNIj",
      Success: true,
      Status: "REVERSED", // This is a failed status even though Success is true
      PaymentId: 7465191926,
      ErrorCode: "0",
      Amount: 287800,
      CardId: 627691463,
      Pan: "220070******2667",
      ExpDate: "0835",
      Token: "*****",
    };

    // Call the webhook endpoint
    const response = await request(WEBHOOK_BASE_URL)
      .post("/payment")
      .send(paymentWebhookBody)
      .expect(200);

    expect(response.text).toBe("OK");

    // Verify that ORDER_PAYMENT_FAILED event was published (not ORDER_PAYMENT_CONFIRMED)
    const events = await outboxEventService.findAll();
    const orderPaymentConfirmedEvents = events.filter(
      (event) => event.type === CONSTANTS.EVENTS.ORDER_PAYMENT_CONFIRMED
    );
    const orderPaymentFailedEvents = events.filter(
      (event) => event.type === CONSTANTS.EVENTS.ORDER_PAYMENT_FAILED
    );

    expect(orderPaymentConfirmedEvents.length).toBe(0);
    expect(orderPaymentFailedEvents.length).toBe(1);

    const orderPaymentFailedEvent = orderPaymentFailedEvents[0];
    expect(orderPaymentFailedEvent.payload.status).toBe("REVERSED");
  });

  it("should not publish any events for non-confirmed, non-failed status payments", async () => {
    const paymentWebhookBody = {
      TerminalKey: "1754681033618",
      OrderId: "9a99gND6Q5LPS0WFTNIj",
      Success: true,
      Status: "AUTHORIZED", // Not CONFIRMED and not in failed statuses
      PaymentId: 7465191927,
      ErrorCode: "0",
      Amount: 287800,
      CardId: 627691463,
      Pan: "220070******2667",
      ExpDate: "0835",
      Token: "*****",
    };

    // Get initial event count
    const initialEvents = await outboxEventService.findAll();
    expect(initialEvents.length).toBe(0);

    // Call the webhook endpoint
    const response = await request(WEBHOOK_BASE_URL)
      .post("/payment")
      .send(paymentWebhookBody)
      .expect(200);

    expect(response.text).toBe("OK");

    // Verify that no new events were published
    const events = await outboxEventService.findAll();
    console.log(events)
    expect(events.length).toBe(0);
  });


});
