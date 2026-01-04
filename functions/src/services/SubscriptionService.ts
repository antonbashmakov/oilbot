import AbstractService from "./AbstractService";
import {Subscription} from "../models";
import * as moment from "moment";


class SubscriptionService extends AbstractService<Subscription> {
  getCollectionName(): string {
    return "SUBSCRIPTIONS";
  }

  getExcludedFields(): string[] {
    return ["created_at", "next_payment_at"];
  }

  /**
   * Check if customer has an active subscription that is not passed due
   * (current date is before next_payment_date)
   */
  async hasActiveSubscription(customerId: string, date: Date): Promise<boolean> {
    const subscription = await this.find(customerId); // subscription stored y owner's id

    if (!subscription) {
      return false;
    }

    const now = moment(date, 'YYYY-MM-DD');
    const nextPaymentDate = moment(subscription.next_payment_at, 'YYYY-MM-DD');

    return subscription.status === "ACTIVE" && now.isBefore(nextPaymentDate);
  }

  /**
   * Create a new subscription for a customer
   * Sets next_payment_date to one month ahead from now
   */
  async createSubscription(customerId: string, fee = 0, date: Date): Promise<Subscription> {

    const d = moment(date, 'YYYY-MM-DD');
    
    const nextPaymentDate = d.add(1, 'M').toDate();

    const subscription: Subscription = {
      id: customerId,
      created_at: new Date(),
      next_payment_at: nextPaymentDate,
      status: "PENDING",
      fee,
    };

    return this.set(subscription);
  }
}

export default SubscriptionService;
