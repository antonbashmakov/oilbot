
import * as dotenv from "dotenv";
import * as moment from "moment-timezone";

import {
  functions,
  admin,
} from "./imports";
import {toProcessor} from "../../services/events/factory";
import {ChargeSubscriptionEvent, OutboxEvent, Subscription} from "../../models";
import {logger} from "../../services/logger";
import SubscriptionService from "../../services/SubscriptionService";
import EventPublisher, {CONSTANTS} from "../webhook/imports";
import {TelegramService, toMessage} from "../admin/imports";
import {error} from "firebase-functions/logger";

admin.initializeApp({}, "db");

dotenv.config();

const databaseId = process.env.DATABASE_ID ?? "(default)";

const db = admin.firestore();

if (process.env.GCLOUD_PROJECT !== "test-project" && db.databaseId !== process.env.DATABASE_ID) {
  db.settings({
    databaseId,
  });
}

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

const dailySubscriptionCheck = async (_context: any) => {
  // Initialize services
  const subscriptionService = new SubscriptionService(db);

  // Use UTC for date calculations (Firestore stores dates in UTC)
  const now = moment.utc();
  const todayStart = now.clone().startOf("day");
  const fourDaysAgo = todayStart.clone().subtract(4, "days");

  const subscriptions = await subscriptionService.findActiveSubscriptionsNotOlderThen(fourDaysAgo.toDate());

  const subscriptionsToCancel: Subscription[] = [];
  const subscriptionsToCharge: Subscription[] = [];

  subscriptions.forEach((subscription) => {
    const nextPayment = moment.utc(subscription.next_payment_at).startOf("day");
    if (nextPayment.isSame(fourDaysAgo, "day")) {
      subscriptionsToCancel.push(subscription);
    } else if (nextPayment.isSameOrBefore(todayStart, "day")) {
      subscriptionsToCharge.push(subscription);
    }
    // If next_payment_at is in the future, skip
  });

  if (subscriptionsToCancel.length > 0) {
    const telegramService = new TelegramService();
    subscriptionService.runTransactionally(async (t) => {
      subscriptionsToCancel.forEach((s) => {
        t.update(subscriptionService.getObjectRef(s.id), {
          status: "CANCELED_PAYMENT_OVERDUE",
          canceled_at: new Date(),
        });
        const adminMessage = toMessage("SUBSCRIPTION_CANCELED_ADMIN", {subscriptionId: s.id});
        telegramService.sendMessage("270053857", adminMessage, s.id).catch((e: any) => error(`Failed to send SUBSCRIPTION_PAYMENT_CONFIRMED_ADMIN to 270053857 : ${e}`));
      });
    });
  }
  const eventPublisher = new EventPublisher<ChargeSubscriptionEvent>(db);

  const promises = subscriptionsToCharge.map((s) => {
    const event: ChargeSubscriptionEvent = {
      id: "", // will be set by OutboxEventService
      created_at: new Date(),
      processed_at: new Date(),
      processed: false,
      retries: 0,
      type: CONSTANTS.EVENTS.CHARGE_SUBSCRIPTION,
      payload: {
        subscription_id: s.id,
      },
    };

    return eventPublisher.publish(event);
  });

  await Promise.all(promises);

  return null;
};

// Scheduled function to process subscriptions daily at 00:00 UTC+3 (Moscow time)
const processSubscriptionsDaily = functions.pubsub
  .schedule("0 0 * * *")
  .onRun(
    dailySubscriptionCheck
  );

export default {
  processOutboxEvent,
  processSubscriptionsDaily,
  dailySubscriptionCheck,
};
