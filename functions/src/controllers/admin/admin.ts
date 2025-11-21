import * as dotenv from 'dotenv';

import {
  functions,
  cors,
  admin,
  express,
  DeliveryService,
  OrderService,
  Order,
  //AbstractService,
  api,
  Delivery,
} from './imports';

admin.initializeApp({}, 'admin');
admin.firestore().settings({
  databaseId: process.env.DATABASE_ID, 
});
dotenv.config();

const adminApi = express();
interface DeliveryOverview extends Delivery  {
  orders: Array<Order> ;
}



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
    
    return api.send(res, devileryOverview);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || 'Internal server error');
  }
});

export default adminApi;
