
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";
import { toProcessor } from "../../services/events/factory";
import { OutboxEvent } from "../../models";

admin.initializeApp(functions.config().firebase, "db");

const db = admin.firestore();


const processOutboxEvent = functions.firestore
  .document("outboxEvents/{eventId}")
  .onCreate(async (snap, context) => {
    const data = snap.data() as OutboxEvent;

    try {

      const ProcessorConstructor = toProcessor(data.type);
      const processor = new ProcessorConstructor(db);
      processor.process(data);

      // mark success
      await snap.ref.update({
        processed: true,
        processedAt: Date.now(),
      });

    } catch (error ) {
      console.error("Failed to process event:", error);

      // increment retry counter — DO NOT mark as processed
      await snap.ref.update({
        retries: data.retries + 1,
        processedAt: Date.now(),
        lastError: (error as any).message,
      });

      throw error; // allow built-in retry by Cloud Functions (if enabled)
    }
  });

/*
const retryOutbox = functions.pubsub
  .schedule("0 *x * * *") // each hour
  .onRun( processOutboxEvent);
*/

export default {
  processOutboxEvent,
};
