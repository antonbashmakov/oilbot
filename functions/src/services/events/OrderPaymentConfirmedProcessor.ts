import { OrderPaymentConfirmedEvent } from "../../models";
import OrderService from "../OrderService";
import PaymentService from "../PaymentService";
import TelegramService from "../TelegramService";
import AbstractProcessor from "./AbstractProcessor";
import { toMessage } from "../../messaging/util";
import { error, warn } from "firebase-functions/logger";

class OrderPaymentConfirmedProcessor extends AbstractProcessor {
  async process(event: OrderPaymentConfirmedEvent): Promise<void> {
    const orderService = new OrderService(this.db);
    const paymentService = new PaymentService(this.db);
    const telegramService = new TelegramService();

    const orderId = event.payload.order_id;

    const order = await orderService.require(orderId);

    const payment = await paymentService.findByExternalId(event.payload.external_id);
    if (!payment) {
      throw new Error(`Payment not found  ${event.payload.external_id}`);
    }

    await orderService.runTransactionally(async t => {
      const orderDocRef = orderService.getCollection().doc(order.id);
      t.update(orderDocRef, { status: "PAID" });

      const paymentDocRef = paymentService.getCollection().doc(payment.id);
      t.update(paymentDocRef, { success: true });

      if (order.type === "CONCILIATION") {
        // For CONCILIATION orders, update the original order status
        const originalOrderDocRef = orderService.getCollection().doc(order.reconciliated_order_id!);
        t.update(originalOrderDocRef, { status: "CONCILIATED" });
      }

    });

    switch (order.type) {
      case "CONCILIATION": {
        const templateValues = {
          originalOrderId: order.reconciliated_order_id,
        };
        const message = toMessage("ORDER_PAYMENT_CONFIRMED_CONCILIATION", templateValues);
        telegramService.sendMessage(order.owner.id, message).catch(e => error(`Failed to send ORDER_PAYMENT_CONFIRMED_CONCILIATION to ${order.owner.id}: ${e}`));
        break;
      }

      case "ORIGINAL": {
        const templateValues = {
          items: order.items.map((item) => ({
            name: item.name,
            price: item.price,
          })),
          total: order.total,
        };
        const message = toMessage("ORDER_PAYMENT_CONFIRMED_ORIGINAL", templateValues);
        telegramService.sendMessage(order.owner.id, message).catch(e => error(`Failed to send ORDER_PAYMENT_CONFIRMED_ORIGINAL to ${order.owner.id}: ${e}`));
        break;
      }

      default: warn(`Got not existing order type: ${order.type}`);

    }

    // Send notification to hardcoded chat ID
    const adminTemplateValues = {
      orderId: orderId,
    };
    const adminMessage = toMessage("ORDER_PAYMENT_CONFIRMED_ADMIN", adminTemplateValues);
    telegramService.sendMessage("270053857", adminMessage).catch(e => error(`Failed to send ORDER_PAYMENT_CONFIRMED_ADMIN to 270053857 : ${e}`));
  }
}

export default OrderPaymentConfirmedProcessor;
