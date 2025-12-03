import AbstractService from "./AbstractService";
import {COLLECTIONS} from "../constants";
import {Payment} from "../models";


class PaymentService extends AbstractService<Payment> {
  toPOJO(id:any, o: any): Payment | undefined {
    if (!o) return;

    const p = {id, ...o} as Payment;

    p.amount = o.total; // duplicate for now, remove total later
    p.updated_at = o.updated_at?.toDate();
    p.created_at = o.created_at?.toDate();
    p.confirmed_at = o.confirmed_at?.toDate();

    return p;
  }

  getCollectionName(): string {
    return COLLECTIONS.PAYMENTS;
  }
  async findByExternalId(id: string): Promise<Payment | undefined> {
    let result = await this.getCollection()
      .where("external_id", "==", id)
      .get();

    if (result.empty) {
      result = await this.getCollection()
      .where("external_id", "==", Number(id))
      .get();
    }
    if (result.empty) {
      return undefined;
    }

    // Return the first payment found
    const doc = result.docs[0];
    return this.toPOJO(doc.id, doc.data()) as Payment;
  }

  async findByOrderId(orderId: string): Promise<Payment[]> {
    const result = await this.getCollection()
      .where("order_id", "==", orderId)
      .get();

    if (result.empty) {
      return [];
    }

    return result.docs.map((doc) => this.toPOJO(doc.id, doc.data()) as Payment);
  }

  getExcludedFields(): string[] {
    return ["created_at", "updated_at", "confirmed_at"];
  }
}

export default PaymentService;
