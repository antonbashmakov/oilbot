import * as dotenv from "dotenv";

import {
  functions,
  cors,
  admin,
  express,
  EventPublisher,
  CONSTANTS,
} from "./imports";
import {OrderPaymentConfirmedEvent, OrderPaymentFailedEvent} from "../../models";
import {debug} from "firebase-functions/logger";

dotenv.config();

admin.initializeApp({}, "webhook");

const db = admin.firestore();

if (process.env.GCLOUD_PROJECT !== "test-project" && db.databaseId !== process.env.DATABASE_ID) {
  db.settings({
    databaseId: process.env.DATABASE_ID,
  });
}

const webhookApi = express();

webhookApi.use(cors(
  {origin: true} // allows all cross origin xhr requests
));

webhookApi.use(express.json());

interface PaymentWebhookBody {
  TerminalKey: string;
  OrderId: string;
  Success: boolean;
  Status: string;
  PaymentId: number;
  ErrorCode: string;
  Amount: number;
  CardId: number;
  Pan: string;
  ExpDate: string;
  Token: string;
}

webhookApi.post("/payment", async (req: express.Request, res: express.Response) => {
  try {
    const body: PaymentWebhookBody = req.body;

    debug("Payment id : " + `${body.PaymentId}`);

    // Process successful confirmed payments
    if (body.Success && body.Status === "CONFIRMED") {
      const eventPublisher = new EventPublisher<OrderPaymentConfirmedEvent>(db);

      const event: OrderPaymentConfirmedEvent = {
        id: "", // will be set by OutboxEventService
        created_at: new Date(),
        processed_at: new Date(),
        processed: false,
        retries: 0,
        type: CONSTANTS.EVENTS.ORDER_PAYMENT_CONFIRMED,
        payload: {
          order_id: body.OrderId,
          external_id: `${body.PaymentId}`, // we do store them as strings
        },
      };

      await eventPublisher.publish(event);
    }

    // Process failed payment statuses
    const failedStatuses = ["REVERSED", "CANCELED", "REJECTED", "DEADLINE_EXPIRED"];
    if (body.Success && failedStatuses.includes(body.Status)) {
      const eventPublisher = new EventPublisher<OrderPaymentFailedEvent>(db);

      const event: OrderPaymentFailedEvent = {
        id: "", // will be set by OutboxEventService
        created_at: new Date(),
        processed_at: new Date(),
        processed: false,
        retries: 0,
        type: CONSTANTS.EVENTS.ORDER_PAYMENT_FAILED,
        payload: {
          order_id: body.OrderId,
          external_id: body.PaymentId,
          status: body.Status,
        },
      };

      await eventPublisher.publish(event);
    }

    // Always return 200 OK to the bank webhook
    return res.status(200).send("OK");
  } catch (err: any) {
    functions.logger.error("Payment webhook error:", err);

    // Always return 200 OK to the bank webhook even on errors
    // to prevent the bank from retrying
    return res.status(200).send("OK");
  }
});

export default webhookApi;
