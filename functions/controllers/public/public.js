import {
  functions,
  express,
  admin,
  cors,
  UserService,
  api,
  authorize,
} from './imports.js';
import dotenv from 'dotenv';

admin.initializeApp(functions.config().firebase, 'public');
dotenv.config();

const publicApi = express();

publicApi.use(cors(
  { origin: true } // allows all cross origin xhr requests
));

publicApi.get('/products', async (req, res) => {
  api.send(res, []);
});


/*


publicApi.get('/heartbeat', async (req, res) => {
  try {
    api.send(res);
  } catch (err) {
    functions.logger.error(err);
    api.error(res, err);
  }
});
*/

export default publicApi;
