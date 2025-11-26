import * as dotenv from 'dotenv';

import {
  functions,
  cors,
  admin,
  express,
  DeliveryService,
  OrderService,
  //AbstractService,
  api,
} from './imports';
import { DeliveryOverview, Stats } from '../../models';
import OrderPickingService from '../../services/OrderPickingService';
import CustomerService from '../../services/CustomerService';

admin.initializeApp({}, 'admin');
admin.firestore().settings({
  databaseId: process.env.DATABASE_ID,
});
dotenv.config();

const adminApi = express();


adminApi.use(cors(
  { origin: true } // allows all cross origin xhr requests
));

/*
adminApi.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userService = new UserService(admin);
  try {
    return await authorize(req, res, next, userService, admin);
  } catch (err: any) {
    logger.error(err);
    return api.error(res, err.message);
  }

});

*/

adminApi.get('/deliveries', async (req: express.Request, res: express.Response) => {
  try {

    const deliveryService = new DeliveryService(admin);

    const deliveries = await deliveryService.findAll();

    return api.send(res, deliveries);
  } catch (err: any) {

    functions.logger.error(err);
    return api.error(res, err.message || 'Internal server error');
  }
});

adminApi.get('/deliveries/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const deliveryService = new DeliveryService(admin);
    const orderService = new OrderService(admin);
    const delivery = await deliveryService.find(id);

    if (!delivery) {
      return api.notFound(res, 'Delivery not found');
    }

    const orders = await orderService.findOrders(delivery);
    const devileryOverview = { ...delivery, orders } as DeliveryOverview;

    const deliveryStats = orders.reduce((ds, order) => {

      const orderStats = order.items.reduce((os, item) => {
        if (!os[item.item_id]) {
          os[item.item_id] = { total: 0, fraction: 0, name: item.name };
        }
        os[item.item_id].total += item.price * item.quantity;
        os[item.item_id].fraction += item.fraction;

        return os;
      }, {} as { [key: string]: Stats });

      Object.keys(orderStats).forEach(key => {
        if (!ds[key]) {
          ds[key] = { ...orderStats[key] };
          return
        }

        ds[key].total += orderStats[key].total;
        ds[key].fraction += orderStats[key].fraction;
        ds[key].name = orderStats[key].name;
      });

      return ds;
    }, {} as { [key: string]: Stats });

    devileryOverview.stats = Object.keys(deliveryStats).map(key => deliveryStats[key]);

    return api.send(res, devileryOverview);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || 'Internal server error');
  }
});

adminApi.get('/orders/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const orderService = new OrderService(admin);

    const order = await orderService.find(id);

    if (!order) {
      return api.notFound(res, 'Delivery not found');
    }

    const customerService = new CustomerService(admin);
    const pickingService = new OrderPickingService(admin);

    const picking = await pickingService.find(id);
    const customer = await customerService.find(order.owner!.id);

    return api.send(res, { ...order, picking, customer });
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || 'Internal server error');
  }
});

adminApi.patch('/order-pickings/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const { items } = req.body;

    if (!items || !Array.isArray(items)) {
      return api.error(res, 'Items array is required');
    }

    const pickingService = new OrderPickingService(admin);
    const updatedPicking = await pickingService.updateItems(id, items);

    return api.send(res, updatedPicking);
  } catch (err: any) {
    functions.logger.error(err);
    if (err.message.includes('not found')) {
      return api.notFound(res, 'Order picking not found');
    }
    return api.error(res, err.message || 'Internal server error');
  }
});

adminApi.post('/orders/:id/order-picking', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const orderService = new OrderService(admin);
    const order = await orderService.find(id);

    if (!order) {
      return api.notFound(res, 'Order not found');
    }

    const pickingService = new OrderPickingService(admin);
    const picking = await pickingService.findOrCreateFromOrder(id, order);

    return api.send(res, picking);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || 'Internal server error');
  }
});

adminApi.post('/order-pickings/:pickingId/items/:itemId/collect', async (req: express.Request, res: express.Response) => {
  try {
    const { pickingId, itemId } = req.params;
    const pickingService = new OrderPickingService(admin);
    await pickingService.toggleOrderItemCollection(pickingId, itemId);
    return res.status(204).send();
  } catch (err: any) {
    functions.logger.error(err);
    if (err.message.includes('not found')) {
      return api.notFound(res, err.message);
    }
    return api.error(res, err.message || 'Internal server error');
  }
});

adminApi.post('/orders/:id/consolidate', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;

    const orderService = new OrderService(admin);
    const order = await orderService.find(id);

    if (!order) {
      return api.notFound(res, 'Order not found');
    }

    const pickingService = new OrderPickingService(admin);

    const picking = await pickingService.find(id);

    if (!picking || !picking.items.every(i => i.status === 'COLLECTED')) {
      return api.badRequest(res, 'Order is not compiled');
    }

    orderService.updateTransactionally(order, { status: 'RESOLVING' });

    return api.send(res, {});
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || 'Internal server error');
  }
});

export default adminApi;
