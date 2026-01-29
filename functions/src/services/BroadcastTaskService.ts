import AbstractService from "./AbstractService";
import {COLLECTIONS} from "../constants";
import {BroadcastTask} from "../models";

class BroadcastTaskService extends AbstractService<BroadcastTask> {


  getCollectionName(): string {
    return COLLECTIONS.BROADCAST_TASKS;
  }
  getExcludedFields(): string[] {
    return ["created_at", "updated_at"];
  }
}

export default BroadcastTaskService;
