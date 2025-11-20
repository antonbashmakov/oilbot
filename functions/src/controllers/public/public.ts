import {
  functions,
  cors,
  admin,
  express,
  api,
} from './imports';
import * as dotenv from 'dotenv';

admin.initializeApp(functions.config().firebase, 'public');
dotenv.config();

const publicApi = express();

publicApi.use(cors(
  { origin: true } // allows all cross origin xhr requests
));

publicApi.get('/deliveries', async (req: express.Request, res: express.Response) => {
  try {
    api.send(res);
  } catch (err: any) {
    functions.logger.error(err);
    api.error(res, err);
  }
});

export default publicApi;
