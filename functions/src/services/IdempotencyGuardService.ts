import AbstractService from "./AbstractService";
import { COLLECTIONS } from '../constants';

import { IdempotentObject } from '../models';

class IdempotencyGuardService extends AbstractService<IdempotentObject> {
  getCollectionName(): string {
    return COLLECTIONS.IDEMPOTENT_REQUESTS;
  }

  async runIdempotentRequest<T>(key: string, method: () => Promise<T>) {
      let result = this.find(key);

      if(result) return result;

      const data = await method();  
      
      const idempotentRequestResult: IdempotentObject<T> = {
        id: key,
        created_at: new Date(),
        data
      }

      this.set(idempotentRequestResult);

      return data;
  }

  getExcludedFields(): string[] {
    return ["created_at", "processed_at"];
  }
}

export default IdempotencyGuardService;
