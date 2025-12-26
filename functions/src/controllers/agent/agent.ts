import * as dotenv from "dotenv";

import UserService, {
  functions,
  cors,
  admin,
  express,
  DeliveryService,
  OrderService,
  api,
} from "./imports";
import {DeliveryAgentOverview} from "../../models";
import {logger} from "../../services/logger";
import {authorize} from "../../services/utils";
import {localeMiddleware} from "../../middleware/localeMiddleware";
dotenv.config();

admin.initializeApp({}, "agent");

const db = admin.firestore();

if (process.env.GCLOUD_PROJECT !== "test-project" && db.databaseId !== process.env.DATABASE_ID) {
  db.settings({
    databaseId: process.env.DATABASE_ID,
  });
}

const agentApi = express();

agentApi.use(cors(
  {origin: true} // allows all cross origin xhr requests
));

agentApi.use(localeMiddleware);

agentApi.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userService = new UserService(db);
  try {
    return await authorize(req, res, next, userService, ["ADMIN", "AGENT"]);
  } catch (err: any) {
    logger.error(err);
    return api.error(res, err.message);
  }
});


agentApi.get("/deliveries/:id", async (req: express.Request, res: express.Response) => {
  try {
    const {id} = req.params;
    const deliveryService = new DeliveryService(db);

    // Fetch the agent user
    const delivery = await deliveryService.find(id);
    if (!delivery) {
      return api.notFound(res, "Delivery not found");
    }

    const orderService = new OrderService(db);

    const orders = await orderService.findOrders(delivery);

    const activeOrders = orders.filter((o) => o.status !== "CANCELED");
    const deliveries = activeOrders.filter((o) => !!o.shipping_address);
    const pickups = activeOrders.filter((o) => !o.shipping_address);


    // TODO: Implement proper logic to fetch pickup and delivery orders assigned to this agent
    // For now, return empty arrays
    const deliveryAgentOverview: DeliveryAgentOverview = {
      id: delivery.id,
      name: `${delivery.number}`, // Use email as name placeholder
      pickups, // Fetch pickup orders where agent is assigned
      deliveries, // Fetch delivery orders where agent is assigned
    };

    return api.send(res, deliveryAgentOverview);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

agentApi.put("/orders/:id/deliver", async (req: express.Request, res: express.Response) => {
  try {
    const {id} = req.params;
    const orderService = new OrderService(db);

    // Fetch the order
    const order = await orderService.find(id);
    if (!order) {
      return api.notFound(res, "Order not found");
    }

    // Check if order can be marked as delivered
    // For now, we'll allow any status transition to DELIVERED except CANCELED
    if (order.status === "CANCELED") {
      return api.badRequest(res, "Canceled order cannot be marked as delivered");
    }

    // Update order status to DELIVERED
    await orderService.update(order, {status: "DELIVERED"});

    // Return 204 No Content
    return res.status(204).send();
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

export default agentApi;
