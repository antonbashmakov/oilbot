import AbstractService from "./AbstractService";
import {COLLECTIONS} from "../constants";
import {Item, ItemStats} from "../models";
import { FieldValue } from "firebase-admin/firestore";


class ItemService extends AbstractService<Item> {
  findByCategory(category: string): Promise<Item[]> {
    return this.getCollection().where("category", "==", category)
      .get().then((result : any) => result.docs.map((doc: any) => this.toPOJO(doc.id, doc.data()) as Item));
  }

    obtainStatistics(itemId: string): Promise<ItemStats> {
      const p = this.db.collection(COLLECTIONS.ITEM_STATS).doc(itemId).get().then((doc) => {
        if (!doc.exists) {
          return null;
        }
        return doc.data() as ItemStats;
      });
  
      return p.then((stats) => {
        if (stats) return stats;
        const initialStats: ItemStats = {
          number_of_likes: 0,
          number_of_share_enters: 0,
        };
        return this.db.collection(COLLECTIONS.ITEM_STATS).doc(itemId).set(initialStats).then(() => initialStats);
      });
    }

  incrementStatistics(customerId: string, updates: Partial<ItemStats>): Promise<ItemStats> {
    return this.obtainStatistics(customerId).then(async (s) => {
      const ref = this.db.collection(COLLECTIONS.CUSTOMER_STATS).doc(customerId);


      let increment = {};
      if (updates.number_of_likes !== undefined) {
        increment = {...increment, number_of_orders: FieldValue.increment(updates.number_of_likes)};
      }
      if (updates.number_of_share_enters !== undefined) {
        increment = {...increment, number_of_canceled_orders: FieldValue.increment(updates.number_of_share_enters)};
      }
     
      return ref.update(increment).then(() => this.obtainStatistics(customerId));
    });
  }  

  getCollectionName(): string {
    return COLLECTIONS.ITEMS;
  }
  getExcludedFields(): string[] {
    return ["created_at"];
  }
}

export default ItemService;
