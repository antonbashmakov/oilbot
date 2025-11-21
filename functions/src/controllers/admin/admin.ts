import * as dotenv from 'dotenv';

import {
  functions,
  cors,
  admin,
  express,
  DeliveryService,
  AbstractService,
  api,
} from './imports';

const logger = functions.logger;

admin.initializeApp(functions.config().firebase, 'admin');
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

adminApi.get('/deliveries/:id', async (req: express.Request, res: express.Response) => {
  try {
    const { id } = req.params;
    const deliveryService = new DeliveryService(admin);
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

export default adminApi;
