import { Firestore } from "firebase-admin/firestore";
import { OutboxEvent } from "../models";

import OutboxEventService from "./OutboxEventService";



class EventPublisher<T extends OutboxEvent> {

  protected firestore: Firestore;

  constructor(firebase: Firestore) {
    this.firestore = firebase;
  }  
  publish(event: T): Promise<OutboxEvent> {
    const outboxEventService = new OutboxEventService(this.firestore);
    return outboxEventService.add(event);
  }

}

export default EventPublisher;
