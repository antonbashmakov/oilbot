
import * as dotenv from "dotenv";

import {
  functions,
  admin,
} from "./imports";
import {toProcessor} from "../../services/events/factory";
import {OutboxEvent} from "../../models";
import {logger} from "../../services/logger";

admin.initializeApp({}, "db");

dotenv.config();

const databaseId = process.env.DATABASE_ID ?? "(default)";

const db = new admin.firestore.Firestore({
  projectId: process.env.GCLOUD_PROJECT,
  databaseId,
});

const processOutboxEvent = functions.firestore
  .database(databaseId)
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
    } catch (error) {
      logger.error("Failed to process event:", error);
      // increment retry counter — DO NOT mark as processed
      await snap.ref.update({
        retries: data.retries + 1,
        processedAt: Date.now(),
        lastError: (error as any).message,
      });
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
