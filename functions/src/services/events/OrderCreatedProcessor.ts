import {OrderPaymentConfirmedEvent} from "../../models";
import TelegramService from "../TelegramService";
import AbstractProcessor from "./AbstractProcessor";
import {toMessage} from "../../messaging/util";
import {error} from "firebase-functions/logger";

class OrderCreatedProcessor extends AbstractProcessor {
  async process(event: OrderPaymentConfirmedEvent): Promise<void> {
    const telegramService = new TelegramService();

    const orderId = event.payload.order_id;

    // Send notification to hardcoded chat ID
    const adminTemplateValues = {
      orderId,
    };
    const adminMessage = toMessage("ORDER_CREATED_ADMIN", adminTemplateValues);
    telegramService.sendMessage("270053857", adminMessage, orderId!).catch((e) => error(`Failed to send ORDER_CREATED_ADMIN to 270053857 : ${e}`));
  }
}

export default OrderCreatedProcessor;
