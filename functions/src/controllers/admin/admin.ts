import * as dotenv from 'dotenv';

import {
  functions,
  cors,
  admin,
  express,
  // UserService,
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

interface CreateDocumentRequest {
  collection: string;
  object: any;
}

adminApi.post('/create/document', async (req: express.Request, res: express.Response) => {
  const { collection, object } = req.body as CreateDocumentRequest;

  // Create a concrete implementation of AbstractService
  class ConcreteService extends AbstractService<any> {
    getCollectionName(): string { return collection; }
    getExcludedFields(): string[] { return []; }
  }

  const service = new ConcreteService(admin);

  try {
    const ret = await service.add(object);
    api.send(res, ret);
  } catch (err: any) {
    logger.error(err);
    api.error(res, err.message);
  }

});

export default adminApi;
