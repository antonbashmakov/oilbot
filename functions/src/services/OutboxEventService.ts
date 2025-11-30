import AbstractService from "./AbstractService";
import {COLLECTIONS} from "../constants";

import {OutboxEvent} from "../models";

class OutboxEventService<T extends OutboxEvent> extends AbstractService<T> {
  getCollectionName(): string {
    return COLLECTIONS.OUTBOX_EVENTS;
  }

  toPOJO(id: any, o: any): T {
    return {...o, id, processed_at: o.processed_at.toDate(), created_at: o.created_at.toDate()};
  }

  getExcludedFields(): string[] {
    return ["created_at", "processed_at"];
  }
}

export default OutboxEventService;
