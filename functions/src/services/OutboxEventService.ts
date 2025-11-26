import AbstractService from "./AbstractService";
import { COLLECTIONS } from '../constants';

import { OutboxEvent } from '../models';

class OutboxEventService<T extends OutboxEvent> extends AbstractService<T> {
  getCollectionName(): string {
    return COLLECTIONS.OUTBOX_EVENTS;
  }

  getExcludedFields(): string[] {
    return ["createdAt", "processedAt"];
  }
}

export default OutboxEventService;
