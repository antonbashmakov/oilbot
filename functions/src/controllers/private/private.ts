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
} from './imports';
import * as dotenv from 'dotenv';

admin.initializeApp(functions.config().firebase, 'public');
dotenv.config();

const db = admin.firestore();

const deliveryService = new DeliveryService(db);
const itemService = new ItemService(db);
const customerService = new CustomerService(db);
const cartItemService = new CartItemService(db);
const orderService = new OrderService(db);

const publicApi = express();

publicApi.use(cors(
  { origin: true } // allows all cross origin xhr requests
));

publicApi.get('/deliveries', async (req: express.Request, res: express.Response) => {
  try {
    const deliveries = await deliveryService.findAll();
    api.send(res, deliveries);
  } catch (err: any) {
    functions.logger.error(err);
    api.error(res, err.message || 'Internal server error');
  }
});

publicApi.get('/deliveries/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const delivery = await deliveryService.find(id);
    
    if (!delivery) {
      return api.notFound(res, 'Delivery not found');
    }
    
    return api.send(res, delivery);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || 'Internal server error');
  }
});

publicApi.get('/items/category/:category', async (req: express.Request, res: express.Response) => {
  try {
    const { category } = req.params;
    const items = await itemService.findByCategory(category);
    return api.send(res, items);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || 'Internal server error');
  }
});

publicApi.post('/customers/:customerId/cart/items/:itemId', async (req: express.Request, res: express.Response) => {
  try {
    const { customerId, itemId } = req.params;

    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, 'Customer not found');
    }

    const item = await itemService.find(itemId);
    if (!item) {
      return api.notFound(res, 'Item not found');
    }

    const cartItem = await cartItemService.addToCart(item, customer);
    return api.send(res, cartItem);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || 'Internal server error');
  }
});

publicApi.post('/customers/:customerId/orders', async (req: express.Request, res: express.Response) => {
  try {
    const { customerId } = req.params;

    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, 'Customer not found');
    }

    const cartItems = await cartItemService.fetchForOwner({ id: String(customer.id) });
    if (!cartItems || cartItems.length === 0) {
      return api.send(res, {});
    }

    const order = await orderService.createOrderFromCart(customer, cartItems);
    return api.send(res, order);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || 'Internal server error');
  }
});

export default publicApi;
