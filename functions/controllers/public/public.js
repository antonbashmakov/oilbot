import {
  functions,
  express,
  admin,
  cors,
  UserService,
  ProductService,
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

  const productService = new ProductService(admin);

  const products = await productService.findAll();
  
  api.send(res, products);
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
