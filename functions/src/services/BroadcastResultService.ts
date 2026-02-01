import AbstractService from "./AbstractService";
import {COLLECTIONS} from "../constants";
import {BroadcastResult} from "../models";

class BroadcastResultService extends AbstractService<BroadcastResult> {
  toPOJO(id: any, o: any): BroadcastResult | undefined {
    if (!o) return undefined;
    return {...o, id, created_at: o.created_at.toDate()};
  }

  getCollectionName(): string {
    return COLLECTIONS.BROADCAST_RESULTS;
  }

  getExcludedFields(): string[] {
    return ["created_at"]; // No fields to exclude
  }
}

export default BroadcastResultService;
