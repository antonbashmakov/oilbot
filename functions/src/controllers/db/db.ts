
import {
  functions,
  admin,
} from './imports';
import { toProcessor } from "../../services/events/factory";
import { OutboxEvent } from "../../models";

admin.initializeApp({}, "db");


if (process.env.GCLOUD_PROJECT !== 'test-project') {
  admin.firestore().settings({
    databaseId: process.env.DATABASE_ID,
  });
}

const db = admin.firestore();

const processOutboxEvent = functions.firestore
  .document("OUTBOX_EVENTS/{eventId}")
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
