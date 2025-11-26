import { OutboxEvent } from "../../models";
import { FirebaseAdmin } from "../AbstractService";

abstract class AbstractProcessor {

    protected firebase: FirebaseAdmin;
  
    constructor(firebase: FirebaseAdmin) {
      this.firebase = firebase;
    }

  abstract process(event:  OutboxEvent): void;

}

export default AbstractProcessor;