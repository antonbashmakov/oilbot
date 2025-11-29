import AbstractService from "./AbstractService";
import { COLLECTIONS } from '../constants';

import { IdempotentObject } from '../models';

class IdempotencyGuardService extends AbstractService<IdempotentObject> {
  getCollectionName(): string {
    return COLLECTIONS.IDEMPOTENT_REQUESTS;
  }

  async runIdempotentRequest<T>(key: string, method: () => Promise<T>) {

    return this.runTransactionally(async (t) => {

      const docRef = this.getCollection().doc(key);

      const snapshot = await docRef.get();

      if (snapshot.exists) return (snapshot.data() as IdempotentObject).data;

      const data = await method();

      const idempotentRequestResult: IdempotentObject<T> = {
        id: key,
        created_at: new Date(),
        data
      }

      t.set(docRef, idempotentRequestResult);

      return data;
    })


  }

  getExcludedFields(): string[] {
    return ["created_at"];
  }
}

export default IdempotencyGuardService;
