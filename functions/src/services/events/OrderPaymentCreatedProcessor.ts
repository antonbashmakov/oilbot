import { OrderResolvedEvent } from "../../models";
import OrderService from "../OrderService";
import PaymentService from "../PaymentService";
import TelegramService from "../TelegramService";
import AbstractProcessor from "./AbstractProcessor";

class OrderPaymentCreatedProcessor extends AbstractProcessor {

  private formatDate(input: Date | string): string {
    const date = input instanceof Date ? input : new Date(input);
    const dd = String(date.getUTCDate()).padStart(2, "0");
    const mm = String(date.getUTCMonth() + 1).padStart(2, "0");
    const yyyy = date.getUTCFullYear();
    return `${dd}.${mm}.${yyyy}`;
  }

  private formatOrderMessage(order: any, paymentUrl: string): string {
    let message = "*🛒 Ваш заказ*\n\n*Товары:*\n";

    order.items.forEach((item: any) => {
      message += `- *${item.name} *: *${item.price} ₽*\n\n`;
    });

    const delivery = order.delivery 
      ? `*🚚 Доставка:*\nc *${this.formatDate(order.delivery.delivery_start)}* по *${this.formatDate(order.delivery.delivery_end)}*\n`
      : `❓ Доставка еще не определена\n`;

    message += `*💰 Общая сумма:* *${order.total} ₽*\n${delivery}*ID заказа:* \`${order.id}\`\n\n`;
    message += `🔗 Ссылка на оплату: ${paymentUrl}`;

    return message;
  }

  async process(event: OrderResolvedEvent): Promise<void> {
    const orderService = new OrderService(this.db);
    const paymentService = new PaymentService(this.db);
    const telegramService = new TelegramService();

    const order = await orderService.find(event.payload.order_id);

    if (!order) {
      throw new Error(`Order with id ${event.payload.order_id} not found`);
    }

    // Find existing payment for this order
    const payments = await paymentService.findAll();
    const payment = payments.find(p => p.order_id === order.id);

    if (!payment) {
      throw new Error(`No payment found for order ${order.id}`);
    }

    // Send Telegram message
    const chatId = order.owner?.id; // Using owner.id as chat ID
    if (chatId) {
      const message = this.formatOrderMessage(order, payment.payment_url);
      await telegramService.sendMessage(chatId, message);
    } else {
      console.warn(`No chat ID found for order ${order.id}, skipping Telegram message`);
    }
  }
}

export default OrderPaymentCreatedProcessor;
