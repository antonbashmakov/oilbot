import { PaymentCreatedEvent } from "../../models";
import OrderService from "../OrderService";
import PaymentService from "../PaymentService";
import TelegramService from "../TelegramService";
import AbstractProcessor from "./AbstractProcessor";
import { toMessage, formatDate } from "../../messaging/util";
import ConversationMessageService from "../ConversationMessageService";

class OrderPaymentCreatedProcessor extends AbstractProcessor {

  async process(event: PaymentCreatedEvent): Promise<void> {
    const orderService = new OrderService(this.db);
    const paymentService = new PaymentService(this.db);
    const telegramService = new TelegramService();

    // Find existing payment for this order
    const payment = await paymentService.require(event.payload.payment_id);
    const order = await orderService.require(payment.order_id);

    // Send Telegram message
    const chatId = order.owner.id; // Using owner.id as chat ID
    // Prepare template values
    const templateValues = {
      items: order.items.map(item => ({
        name: item.name,
        price: item.price
      })),
      delivery: order.delivery ? {
        deliveryStart: formatDate(order.delivery.delivery_start),
        deliveryEnd: formatDate(order.delivery.delivery_end)
      } : null,
      total: order.total,
      orderId: order.id,
      paymentUrl: payment.payment_url
    };

    const message = toMessage('ORDER_PAYMENT_CREATED', templateValues);
    const ret = await telegramService.sendMessage(chatId, message);

    if (ret) {

      ret.thread_id = order.id;

      const conversationMessageService = new ConversationMessageService(this.db);
      await conversationMessageService.add(ret);
    }
  }
}

export default OrderPaymentCreatedProcessor;
