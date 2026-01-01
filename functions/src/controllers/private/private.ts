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
  //UserService,
} from "./imports";
//import {authorize} from "../../services/utils";
import * as dotenv from "dotenv";
//import {logger} from "firebase-functions/v1";
import { localeMiddleware } from "../../middleware/localeMiddleware";
import { DeliveryRef, ItemOverview } from "../../models";
import _ = require("lodash");

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
  { origin: true } // allows all cross origin xhr requests
));

privateApi.use(localeMiddleware);

/*
privateApi.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userService = new UserService(db);
  try {
    return await authorize(req, res, next, userService);
  } catch (err: any) {
    logger.error(err);
    return api.error(res, err.message);
  }
});

*/

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
    const { id } = req.params;
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
    const { category } = req.params;

    const deliveryService = new DeliveryService(db);

    let items;

    if (category === "ALL") {
      items = await itemService.findAll();
    } else {
      items = await itemService.findByCategory(category);
    }

    if (!items || items.length === 0) {
      return api.send(res, []);
    }

    const groups = [...new Set(items.map(item => item.group))];

    const groupDeliveries = await deliveryService.findClosestByGroups(groups);
    const deliveryMap: { [key: string]: DeliveryRef[] } = _.groupBy(groupDeliveries, "group");

    const itemOverviews = items.map((item) => ({
      name: item.name,
      category: item.category,
      group: item.group,
      unit: item.unit,
      unit_description:
        item.unit_description,
      fraction: item.fraction,
      price_out: item.price_out,
      description: item.description,
      fraction_price_out: item.fraction_price_out,
      id: item.id, link: item.link,
      deliveries: deliveryMap[item.group] || []
    } as ItemOverview));

    return api.send(res, itemOverviews);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.get("/customers/:customerId/cart/items", async (req: express.Request, res: express.Response) => {
  try {
    const { customerId } = req.params;

    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    const cartItems = await cartItemService.fetchForOwner({ id: String(customer.id) });
    return api.send(res, cartItems || []);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.post("/customers/:customerId/cart/items", async (req: express.Request, res: express.Response) => {
  try {
    const { customerId } = req.params;
    const { itemId } = req.body;

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

privateApi.delete("/customers/:customerId/cart/items", async (req: express.Request, res: express.Response) => {
  try {
    const { customerId } = req.params;
    const { cartItemId, itemId } = req.body;

    if(!cartItemId && !itemId) {
      return api.badRequest(res, "Either cartItemId or itemId must be provided");
    }

    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    if (itemId) {
      const cartItems = await cartItemService.fetchForOwner({ id: String(customer.id) });
      const itemsToRemove = cartItems?.filter(item => item.item_id === itemId);
      cartItemService.deleteTransactionally(itemsToRemove);

      return api.send(res, {});
    }


    // Assuming there's a method to remove cart item by ID
    // We need to check if the cart item belongs to this customer
    const cartItems = await cartItemService.fetchForOwner({ id: String(customer.id) });
    const cartItem = cartItems?.find(item => item.id === cartItemId);

    if (!cartItem) {
      return api.notFound(res, "Cart item not found");
    }

    await cartItemService.delete(cartItem);

    // Assuming there's a removeFromCart or delete method in CartItemService
    // For now, we'll return success since we found the item
    // In a real implementation, we would call something like:
    // await cartItemService.removeFromCart(cartItemId);

    return res.status(204).send();
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.post("/customers/:customerId/orders", async (req: express.Request, res: express.Response) => {
  try {
    const { customerId } = req.params;

    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    const cartItems = await cartItemService.fetchForOwner({ id: String(customer.id) });
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
