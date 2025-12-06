import {
  functions,
  cors,
  admin,
  express,
  api,
  DeliveryService,
  ItemService,
  CustomerService,
  CartItemService,
  OrderService,
  UserService,
} from "./imports";
import {authorize} from "../../services/utils";
import * as dotenv from "dotenv";
import {logger} from "firebase-functions/v1";

admin.initializeApp(functions.config().firebase, "private");
dotenv.config();

const db = admin.firestore();

if (process.env.GCLOUD_PROJECT !== "test-project" && db.databaseId !== process.env.DATABASE_ID) {
  db.settings({
    databaseId: process.env.DATABASE_ID,
  });
}

const deliveryService = new DeliveryService(db);
const itemService = new ItemService(db);
const customerService = new CustomerService(db);
const cartItemService = new CartItemService(db);
const orderService = new OrderService(db);

const privateApi = express();

privateApi.use(cors(
  {origin: true} // allows all cross origin xhr requests
));

privateApi.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userService = new UserService(db);
  try {
    return await authorize(req, res, next, userService);
  } catch (err: any) {
    logger.error(err);
    return api.error(res, err.message);
  }
});

privateApi.get("/deliveries", async (req: express.Request, res: express.Response) => {
  try {
    const deliveries = await deliveryService.findAll();
    api.send(res, deliveries);
  } catch (err: any) {
    functions.logger.error(err);
    api.error(res, err.message || "Internal server error");
  }
});

privateApi.get("/deliveries/:id", async (req: express.Request, res: express.Response) => {
  try {
    const {id} = req.params;
    const delivery = await deliveryService.find(id);

    if (!delivery) {
      return api.notFound(res, "Delivery not found");
    }

    return api.send(res, delivery);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.get("/items/category/:category", async (req: express.Request, res: express.Response) => {
  try {
    const {category} = req.params;
    const items = await itemService.findByCategory(category);
    return api.send(res, items);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.post("/customers/:customerId/cart/items/:itemId", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId, itemId} = req.params;

    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    const item = await itemService.find(itemId);
    if (!item) {
      return api.notFound(res, "Item not found");
    }

    const cartItem = await cartItemService.addToCart(item, customer);
    return api.send(res, cartItem);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.post("/customers/:customerId/orders", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId} = req.params;

    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    const cartItems = await cartItemService.fetchForOwner({id: String(customer.id)});
    if (!cartItems || cartItems.length === 0) {
      return api.send(res, {});
    }

    const order = await orderService.createOrderFromCart(customer, cartItems);
    return api.send(res, order);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

export default privateApi;
