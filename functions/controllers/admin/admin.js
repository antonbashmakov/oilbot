import dotenv from 'dotenv';

import {
  functions,
  cors,
  admin,
  express,
  UserService,
  api,
  authorize,
} from './imports.js';

const logger = functions.logger;

admin.initializeApp(functions.config().firebase, 'admin');
dotenv.config();

const adminApi = express();

adminApi.use(cors(
  { origin: true } // allows all cross origin xhr requests
));

adminApi.use(async (req, res, next) => {
  const userService = new UserService(admin);
  try {
    return await authorize(req, res, next, userService, admin);
  } catch (err) {
    logger.error(err);
    return api.error(res);
  }

});


export default adminApi;
