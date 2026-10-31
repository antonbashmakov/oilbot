import AbstractService from "./AbstractService";
import {COLLECTIONS} from "../constants";
import {Car, Customer, CustomerAccounting, CustomerStats} from "../models";
import {FieldValue} from "firebase-admin/firestore";

// gRPC status code of a create() on an existing document.
const ALREADY_EXISTS = 6;
// How long the messages of a car still being identified are kept.
const CAR_DRAFT_TTL_MS = 24 * 60 * 60 * 1000;


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
        number_of_active_orders: 0,
        number_of_free_orders: 1,
        number_of_canceled_orders: 0,
        number_of_fulfilled_orders: 0,
        number_of_paid_months: 0,
        paid_in_total: 0,
      };
      return this.db.collection(COLLECTIONS.CUSTOMER_STATS).doc(customerId).set(initialStats).then(() => initialStats);
    });
  }
  obtainAccounting(customerId: string): Promise<CustomerAccounting> {
    const p = this.db.collection(COLLECTIONS.CUSTOMER_ACCOUNTING).doc(customerId).get().then((doc) => {
      if (!doc.exists) {
        return null;
      }
      return doc.data() as CustomerAccounting;
    });

    return p.then((stats) => {
      if (stats) return stats;
      const accounting: CustomerAccounting = {
        id: customerId,
        rebill_id: "",
      };
      return this.db.collection(COLLECTIONS.CUSTOMER_ACCOUNTING).doc(customerId).set(accounting).then(() => accounting);
    });
  }

  updateAccounting(accounting: CustomerAccounting): Promise<CustomerAccounting> {
    return this.db.collection(COLLECTIONS.CUSTOMER_ACCOUNTING).doc(accounting.id).update(accounting).then(() => accounting);
  }

  getAccountingRef(accountingId: string) {
    return this.db.collection(COLLECTIONS.CUSTOMER_ACCOUNTING).doc(accountingId);
  }

  incrementStatistics(customerId: string, updates: Partial<CustomerStats>): Promise<CustomerStats> {
    return this.obtainStatistics(customerId).then(async (s) => {
      const ref = this.db.collection(COLLECTIONS.CUSTOMER_STATS).doc(customerId);


      let increment = {};
      if (updates.number_of_orders !== undefined) {
        increment = {...increment, number_of_orders: FieldValue.increment(updates.number_of_orders)};
      }
      if (updates.number_of_canceled_orders !== undefined) {
        increment = {...increment, number_of_canceled_orders: FieldValue.increment(updates.number_of_canceled_orders)};
      }
      if (updates.number_of_fulfilled_orders !== undefined) {
        increment = {...increment, number_of_fulfilled_orders: FieldValue.increment(updates.number_of_fulfilled_orders)};
      }
      if (updates.number_of_free_orders !== undefined) {
        const stats = (await ref.get()).data();
        if ((updates.number_of_free_orders >= 0 || // update only if increase
          (updates.number_of_free_orders < 0 && (stats!.number_of_free_orders + updates.number_of_free_orders >= 0)))) { //  or if the update is correct
          increment = {...increment, number_of_free_orders: FieldValue.increment(updates.number_of_free_orders)};
        }
      }
      if (updates.number_of_paid_months !== undefined) {
        increment = {...increment, number_of_paid_months: FieldValue.increment(updates.number_of_paid_months)};
      }
      if (updates.number_of_active_orders !== undefined) {
        increment = {...increment, number_of_active_orders: FieldValue.increment(updates.number_of_active_orders)};
      }
      if (updates.paid_in_total !== undefined) {
        increment = {...increment, paid_in_total: FieldValue.increment(updates.paid_in_total)};
      }
      if (Object.keys(increment).length === 0) {
        return (await ref.get()).data() as CustomerStats;
      }
      return ref.update(increment).then(() => this.obtainStatistics(customerId));
    });
  }

  /**
   * Saves the car as the customer's car; undefined when there is no such customer.
   */
  async saveCar(customerId: string, car: Car): Promise<Customer | undefined> {
    const customer = await this.find(customerId);
    if (!customer) return undefined;

    const saved: Car = {
      make: car.make.trim(),
      model: car.model.trim(),
      year: car.year ?? null,
      engine: car.engine ?? null,
      ...(car.description ? {description: car.description} : {}),
    };

    await this.update(customer, {car: saved});
    return {...customer, car: saved};
  }

  /**
   * The customer's messages with car information of an identification still in progress; empty
   * when there is none or it is older than CAR_DRAFT_TTL_MS.
   */
  carDraftTokens(customer: Customer, now = new Date()): string[] {
    const draft = customer.car_draft;
    if (!draft || now.getTime() - draft.updated_at.getTime() > CAR_DRAFT_TTL_MS) return [];
    return draft.tokens;
  }

  setCarDraft(customer: Customer, tokens: string[]): Promise<any> {
    return this.update(customer, {car_draft: {tokens, updated_at: new Date()}});
  }

  clearCarDraft(customer: Customer): Promise<any> {
    return this.update(customer, {car_draft: FieldValue.delete()} as unknown as Partial<Customer>);
  }

  /**
   * The customer with the customer's external_id, created when there is none. A new customer's id
   * is <origin>_<external_id> and is written with create(), so parallel sign-ins of one person
   * cannot create two customers.
   */
  async findOrCreateByExternalId(customer: Customer): Promise<Customer> {
    const existing = await this.findByExternalId(customer.external_id);
    if (existing) return existing;

    const ref = this.getCollection().doc(`${customer.origin}_${customer.external_id}`);

    try {
      await ref.create({...customer, id: ref.id});
      return {...customer, id: ref.id};
    } catch (err: any) {
      if (err?.code !== ALREADY_EXISTS) throw err;
      return this.toPOJO(ref.id, (await ref.get()).data()) as Customer;
    }
  }

  findByExternalId(externalId: string): Promise<Customer | undefined> {
    return this.db.collection(this.getCollectionName()).where("external_id", "==", externalId).get().then((snapshot) => {
      if (snapshot.empty) {
        return undefined;
      }
      const doc = snapshot.docs[0];
      return this.toPOJO(doc.id, doc.data() as Customer);
    });
  }

  toPOJO(id: any, o: any): Customer | undefined {
    if (!o) return;

    const ret = {...o, id: `${id}`} as Customer; // convert all ids to string

    if (o.created_at) {
      ret.created_at = o.created_at?.toDate();
    }
    if (o.last_seen_at) {
      ret.last_seen_at = o.last_seen_at.toDate();
    }
    if (o.car_draft?.updated_at?.toDate) {
      ret.car_draft = {...o.car_draft, updated_at: o.car_draft.updated_at.toDate()};
    }


    return ret;
  }


  getCollectionName(): string {
    return COLLECTIONS.CUSTOMERS;
  }
  getExcludedFields(): string[] {
    return ["created_at", "last_seen_at"];
  }
}

export default CustomerService;
