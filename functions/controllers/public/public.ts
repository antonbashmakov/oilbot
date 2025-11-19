import {
  functions,
  express,
  admin,
  cors,
  UserService,
  api,
  authorize,
} from './imports';
import dotenv from 'dotenv';

admin.initializeApp(functions.config().firebase, 'public');
dotenv.config();

const publicApi = express();

publicApi.use(cors(
  { origin: true } // allows all cross origin xhr requests
));
