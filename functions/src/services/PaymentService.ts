import AbstractService from "./AbstractService";
import {COLLECTIONS} from "../constants";
import {Payment} from "../models";


class PaymentService extends AbstractService<Payment> {
  toPOJO(id:any, o: any): Payment | undefined {
    if (!o) return;

    const p = {id, ...o} as Payment;

    p.created_at = o.created_at.toDate();

    return p;
  }

  getCollectionName(): string {
    return COLLECTIONS.PAYMENTS;
  }
  getExcludedFields(): string[] {
    return ["created_at"];
  }
}

export default PaymentService;
