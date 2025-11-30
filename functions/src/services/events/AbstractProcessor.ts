import {Firestore} from "firebase-admin/firestore";
import {OutboxEvent} from "../../models";

abstract class AbstractProcessor {
  protected db: Firestore;

  constructor(db: Firestore) {
    this.db = db;
  }

  abstract process(event: OutboxEvent): void;
}

export default AbstractProcessor;
