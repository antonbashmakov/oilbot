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
        createdAt: new Date(),
        data
      }

      this.set(idempotentRequestResult);

      return data;
  }

  getExcludedFields(): string[] {
    return ["createdAt", "processedAt"];
  }
}

export default IdempotencyGuardService;
