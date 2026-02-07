import {OrderPaymentConfirmedEvent} from "../../models";
import PaymentService from "../PaymentService";
import TelegramService from "../TelegramService";
import AbstractProcessor from "./AbstractProcessor";
import {toMessage} from "../../messaging/util";
import {error} from "firebase-functions/logger";
import SubscriptionService from "../SubscriptionService";
import CustomerService from "../CustomerService";

class SubscriptionPaymentConfirmedProcessor extends AbstractProcessor {
  async process(event: OrderPaymentConfirmedEvent): Promise<void> {
    const subscriptionService = new SubscriptionService(this.db);
    const customerService = new CustomerService(this.db);
    const paymentService = new PaymentService(this.db);
    const telegramService = new TelegramService();

    const subscriptionId = event.payload.subscription_id;

    if (!subscriptionId) {
      throw new Error("Subscription id is missing!");
    }


    const subscription = await subscriptionService.require(subscriptionId);
    const payment = await paymentService.findByExternalId(event.payload.external_id);

    if (!payment) {
      throw new Error(`Payment not found  ${event.payload.external_id}`);
    }
    if (!subscription) {
      throw new Error(`Subscription not found  ${subscriptionId}`);
    }

    await subscriptionService.runTransactionally(async (t) => {
      /**
       *  Subscription, Accounting, Balance and Stats all stored by customer's id
       */
      const subscriptionDocRef = subscriptionService.getCollection().doc(subscription.id);
      t.update(subscriptionDocRef, {status: "ACTIVE"});

      const paymentDocRef = paymentService.getCollection().doc(payment.id);
      t.update(paymentDocRef, {success: true, status: "CONFIRMED"});

      if (event.payload.rebill_id || event.payload.account_token) {
        const accountingRef = customerService.getAccountingRef(subscriptionId);
        t.set(accountingRef, {id: subscriptionId, rebill_id: event.payload.rebill_id || "", account_token: event.payload.account_token || ""}, {merge: true});
      }
    });

    // Send notification to hardcoded chat ID
    const adminTemplateValues = {
      subscriptionId,
    };
    const adminMessage = toMessage("SUBSCRIPTION_PAYMENT_CONFIRMED_ADMIN", adminTemplateValues);
    telegramService.sendMessage("270053857", adminMessage, subscriptionId).catch((e) => error(`Failed to send SUBSCRIPTION_PAYMENT_CONFIRMED_ADMIN to 270053857 : ${e}`));
  }
}

export default SubscriptionPaymentConfirmedProcessor;
