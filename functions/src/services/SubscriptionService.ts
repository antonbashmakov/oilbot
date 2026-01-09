import AbstractService from "./AbstractService";
import { Subscription } from "../models";
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

    const now = moment(date, "YYYY-MM-DD");
    const nextPaymentDate = moment(subscription.next_payment_at, "YYYY-MM-DD");

    return subscription.status === "ACTIVE" && now.isBefore(nextPaymentDate);
  }

  findActiveSubscriptionsNotOlderThen(date: Date): Promise<Subscription[]> {
    return this.getCollection().where("status", "==", "ACTIVE")
      .where("next_payment_at", ">=", date).get().then(result => {
        if (result.empty) {
          return [];
        }

        return result.docs.map((doc) => this.toPOJO(doc.id, doc.data()) as Subscription);
      });

  }

  /**
   * Create a new subscription for a customer
   * Sets next_payment_date to one month ahead from now
   */
  async createSubscription(customerId: string, fee = 0, date: Date): Promise<Subscription> {
    const d = moment(date, "YYYY-MM-DD");

    const nextPaymentDate = d.add(1, "M").toDate();

    const subscription: Subscription = {
      id: customerId,
      created_at: new Date(),
      next_payment_at: nextPaymentDate,
      status: "PENDING",
      fee,
    };

    return this.set(subscription);
  }

  toPOJO(id: any, o: any): Subscription | undefined {
    if (!o) return undefined;
    return { ...o, id, created_at: o.created_at.toDate(), next_payment_at: o.next_payment_at.toDate(), canceled_at: o.next_payment_at?.toDate() };
  }
}

export default SubscriptionService;
