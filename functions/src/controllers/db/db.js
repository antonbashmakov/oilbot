
import * as admin from "firebase-admin";
import * as functions from "firebase-functions";

admin.initializeApp(functions.config().firebase, "db");


const processOutboxEvent = functions.firestore
  .document("outboxEvents/{eventId}")
  .onCreate(async (snap, context) => {
    const data = snap.data();

    try {
      // mark success
      await snap.ref.update({
        processed: true,
        processedAt: Date.now(),
      });
    } catch (error) {
      console.error("Failed to process event:", error);

      // increment retry counter — DO NOT mark as processed
      await snap.ref.update({
        retries: data.retries + 1,
        lastError: error.message,
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
