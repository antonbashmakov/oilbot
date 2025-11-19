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


export default publicApi;
