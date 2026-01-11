import {Firestore} from "firebase-admin/firestore";
import {OutboxEvent} from "../models";

class MockEventPublisher<T extends OutboxEvent> {
  protected firestore: Firestore;

  constructor(firebase: Firestore) {
    this.firestore = firebase;
  }
  publish(event: T): Promise<OutboxEvent> {
    return Promise.resolve(event);
  }
}

export default MockEventPublisher;
