import { OrderConciliatedEvent } from "../../models";
import OrderService from "../OrderService";
import TelegramService from "../TelegramService";
import AbstractProcessor from "./AbstractProcessor";
import { toMessage } from "../../messaging/util";

class OrderConciliatedProcessor extends AbstractProcessor {

  async process(event: OrderConciliatedEvent): Promise<void> {
    const orderService = new OrderService(this.db);
    const telegramService = new TelegramService();

    // Get the order
    const order = await orderService.require(event.payload.order_id);

    // Send Telegram message to order owner
    const chatId = order.owner?.id;
    if (chatId) {
      // Prepare template values
      const templateValues = {
        orderId: order.id
      };

      // Generate message using template
      const message = toMessage('ORDER_CONCILIATED', templateValues);
      await telegramService.sendMessage(chatId, message);
    } else {
      console.warn(`No chat ID found for order ${order.id}, skipping Telegram message`);
    }
  }
}

export default OrderConciliatedProcessor;
