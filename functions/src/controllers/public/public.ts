import {
  functions,
  cors,
  admin,
  express,
  api,
  DeliveryService,
} from './imports';
import * as dotenv from 'dotenv';

admin.initializeApp(functions.config().firebase, 'public');
dotenv.config();

const deliveryService = new DeliveryService(admin);

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

export default publicApi;
