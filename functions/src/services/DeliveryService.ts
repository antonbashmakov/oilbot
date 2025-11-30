import AbstractService from "./AbstractService";
import {COLLECTIONS} from "../constants";

import {Delivery} from "../models";

class DeliveryService extends AbstractService<Delivery> {
  findDeliveriesByStatus(status: Delivery["status"]): Promise<Delivery[]> {
    return this.getCollection().where("status", "==", status).orderBy("delivery_start", "desc")
      .get().then((result : any) => result.docs.map((doc: any) => doc.data() as Delivery));
  }

  toPOJO(id: any, o: any): Delivery {
    return {...o, id, delivery_end: o.delivery_end.toDate(), delivery_start: o.delivery_start.toDate(), order_deadline: o.order_deadline?.toDate()};
  }

  getCollectionName(): string {
    return COLLECTIONS.DELIVERIES;
  }
  getExcludedFields(): string[] {
    return ["created_at"];
  }
}

export default DeliveryService;
