import { OutboxEvent } from "../models";
import { FirebaseAdmin } from "./AbstractService";
import OutboxEventService from "./OutboxEventService";



class EventPublisher {

  protected firebase: FirebaseAdmin;

  constructor(firebase: FirebaseAdmin) {
    this.firebase = firebase;
  }  
  publish(event: OutboxEvent): Promise<OutboxEvent> {
    const outboxEventService = new OutboxEventService(this.firebase);
    return outboxEventService.add(event);
  }

}

export default EventPublisher;
