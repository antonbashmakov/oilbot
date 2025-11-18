import dotenv from 'dotenv';

import {
  functions,
  cors,
  admin,
  express,
  UserService,
  CartService,
  api,
  authorize,
  logger,
} from './imports.js';


admin.initializeApp(functions.config().firebase, 'private');
dotenv.config();

const privateApi = express();

privateApi.use(cors(
  { origin: true } // allows all cross origin xhr requests
));

privateApi.use(async (req, res, next) => {
  const userService = new UserService(admin);
  try {
    //return await authorize(req, res, next, userService, admin);
    return next();
  } catch (err) {
    logger.error(err);
    return api.error(res);
  }

});

privateApi.get('/users/me', async (req, res) => {

  const user = req.user;

  api.send(res, user);
});

privateApi.patch('/carts/:cartId', async (req, res) => {

  const cart = req.body;
  const cartId = req.params.cartId;

  try {

    const cartService = new CartService(admin);

    logger.debug(cart)

    const c = await cartService.set({id: cartId, ...cart})

    api.send(res, { c });

  } catch (err) {
    logger.error(err);
    return api.error(res);
  }
});




export default privateApi;
