import AbstractService from "./AbstractService";
import { COLLECTIONS } from "../constants";
import { Customer, CustomerStats } from "../models";
import { FieldValue } from "firebase-admin/firestore";


class CustomerService extends AbstractService<Customer> {

  obtainStatistics(customerId: string): Promise<CustomerStats> {
    const p = this.db.collection(COLLECTIONS.CUSTOMER_STATS).doc(customerId).get().then((doc) => {
      if (!doc.exists) {
        return null;
      }
      return doc.data() as CustomerStats;
    });

    return p.then((stats) => {
      if (stats) return stats;
      const initialStats: CustomerStats = {
        id: customerId,
        number_of_orders: 0,
        number_of_canceled_orders: 0,
        number_of_fulfilled_orders: 0,
        number_of_paid_months: 0,
        paid_in_total: 0,
      };
      return this.db.collection(COLLECTIONS.CUSTOMER_STATS).doc(customerId).set(initialStats).then(() => initialStats);
    });
  }

  incrementStatistics(customerId: string, updates: Partial<CustomerStats>): Promise<CustomerStats> {
    return this.obtainStatistics(customerId).then(s => {
      const ref = this.db.collection(COLLECTIONS.CUSTOMER_STATS).doc(customerId);

      let increment = {};
      if (updates.number_of_orders !== undefined) {
        increment = { ...increment, [updates.number_of_orders]: FieldValue.increment(updates.number_of_orders) };
      }
      if (updates.number_of_canceled_orders !== undefined) {
        increment = { ...increment, [updates.number_of_canceled_orders]: FieldValue.increment(updates.number_of_canceled_orders) };
      }
      if (updates.number_of_fulfilled_orders !== undefined) {
        increment = { ...increment, [updates.number_of_fulfilled_orders]: FieldValue.increment(updates.number_of_fulfilled_orders) };
      }
      if (updates.number_of_paid_months !== undefined) {
        increment = { ...increment, [updates.number_of_paid_months]: FieldValue.increment(updates.number_of_paid_months) };
      }
      if (updates.paid_in_total !== undefined) {
        increment = { ...increment, [updates.paid_in_total]: FieldValue.increment(updates.paid_in_total) };
      }
      return ref.update(increment).then(() => this.obtainStatistics(customerId));
    })
  }


  getCollectionName(): string {
    return COLLECTIONS.CUSTOMERS;
  }
  getExcludedFields(): string[] {
    return ["created_at"];
  }
}

export default CustomerService;
