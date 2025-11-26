import AbstractService from "./AbstractService";
import { COLLECTIONS } from '../constants';

import { OutboxEvent } from '../models';

class OutboxEventService extends AbstractService<OutboxEvent> {
  getCollectionName(): string {
    return COLLECTIONS.OUTBOX_EVENTS;
  }

  getExcludedFields(): string[] {
    return ["createdAt", "processedAt"];
  }
}

export default OutboxEventService;
