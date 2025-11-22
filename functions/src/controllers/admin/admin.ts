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
import { DeliveryOverview, Stats } from '../../models/models';
import OrderPickingService from '../../services/OrderPickingService';

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
    const devileryOverview = {...delivery, orders} as DeliveryOverview;

    const deliveryStats = orders.reduce((ds, order) => {
      
      const orderStats = order.items.reduce((os, item) => {
        if(!os[item.item_id]) {
          os[item.item_id] = { total: 0, fraction: 0 , name: item.name };
        }
        os[item.item_id].total += item.price * item.quantity;
        os[item.item_id].fraction += item.fraction;

        return os;
      }, {} as { [key: string]: Stats });

      Object.keys(orderStats).forEach(key => {
        if(!ds[key]) {
          ds[key] = { ...orderStats[key] };
          return
        }

        ds[key].total += orderStats[key].total;
        ds[key].fraction += orderStats[key].fraction;
        ds[key].name = orderStats[key].name;
      });

      ;


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

    const pickingService = new OrderPickingService(admin);

    const picking = await pickingService.find(id);
    
    return api.send(res, {...order, picking});
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || 'Internal server error');
  }
});

export default adminApi;
