import * as dotenv from "dotenv";

import {
  functions,
  cors,
  admin,
  express,
  api,
  UserService,
  verifyTelegramInitData,
  CustomerService,
} from "./imports";
import * as bcrypt from "bcrypt";
import {generateToken, who} from "../../services/utils";
import {Item, User} from "../../models";
import {localeMiddleware} from "../../middleware/localeMiddleware";

import CustomerBalanceService from "../../services/CustomerBalanceService";
import {SubscriptionService} from "../private/imports";
import {logger} from "firebase-functions/v1";
import ItemService from "../../services/ItemService";
import CartItemService from "../../services/CartItemService";

const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

admin.initializeApp({}, "public");
dotenv.config();

const db = admin.firestore();

if (process.env.GCLOUD_PROJECT !== "test-project" && db.databaseId !== process.env.DATABASE_ID) {
  db.settings({
    databaseId: process.env.DATABASE_ID,
  });
}

const userService = new UserService(db);
const customerService = new CustomerService(db);
const customerBalanceService = new CustomerBalanceService(db);
const subscriptionService = new SubscriptionService(db);
const itemService = new ItemService(db);
const cartItemService = new CartItemService(db);

const publicApi = express();

publicApi.use(cors(
  {
    origin: true,
    credentials: true, // allow cookies
    methods: ["GET", "POST", "PUT", "DELETE", "OPTIONS"],
  } // allows all cross origin xhr requests
));

publicApi.use(localeMiddleware);

publicApi.use(express.json());

publicApi.post("/signup", async (req: express.Request, res: express.Response) => {
  try {
    const {email, password} = req.body;

    // Validate required fields
    if (!email || !password) {
      return api.badRequest(res, "Missing required fields: email, password");
    }

    // Validate email format

    if (!emailRegex.test(email)) {
      return api.badRequest(res, "Invalid email format");
    }

    // Validate password length
    if (password.length < 6) {
      return api.badRequest(res, "Password must be at least 6 characters");
    }

    // Check if user already exists
    const existingUser = await userService.findByEmail(email);
    if (existingUser) {
      return api.badRequest(res, "User with this email already exists");
    }

    const hash = await bcrypt.hash(password, 10);
    const user: User = {
      id: "",
      email,
      password: hash,
      roles: [],
      created_at: new Date(),
    };

    const saved = await userService.add(user);

    saved.token = generateToken(saved);

    // Return the created user
    return api.send(res, saved);
  } catch (err: any) {
    functions.logger.error("Signup error:", err);
    return api.error(res, err.message || "Internal server error");
  }
});

publicApi.post("/login", async (req: express.Request, res: express.Response) => {
  try {
    const {email, password} = req.body;

    // Validate required fields
    if (!email || !password) {
      return api.badRequest(res, "Missing required fields: email, password");
    }
    if (!emailRegex.test(email)) {
      return api.badRequest(res, "Invalid email format");
    }
    const user = await userService.findByEmail(email);
    if (!user) {
      return api.unauthorized(res, "Invalid email or password");
    }

    const p = await userService.fetchPassword(user.id);

    const passwordMatch = await bcrypt.compare(password, p);
    if (!passwordMatch) {
      return api.unauthorized(res, "Invalid email or password");
    }

    // Remove password hash from response
    user.password = "p";
    user.token = generateToken(user);

    // Return the authenticated user
    return api.send(res, user);
  } catch (err: any) {
    functions.logger.error("Login error:", err);
    return api.error(res, err.message || "Internal server error");
  }
});

publicApi.get("/users/me", async (req: express.Request, res: express.Response) => {
  try {
    // Get user from request (set by authorize middleware)
    const user = await who(req, new UserService(db));

    if (!user) {
      return api.ok(res);
    }

    return api.send(res, user);
  } catch (err: any) {
    functions.logger.error(err);
    // The authorize function already sends error responses, so we just need to return
    // If error wasn't handled by authorize, handle it here
    if (!res.headersSent) {
      return api.error(res, err.message || "Internal server error");
    }
    return;
  }
});

publicApi.get("/stats/:userId", async (req: express.Request, res: express.Response) => {
  try {
    const {userId} = req.params;

    if (!userId) {
      return api.badRequest(res, "Missing userId parameter");
    }

    // Check if customer exists
    const customer = await customerService.find(userId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }


    await customerService.incrementStatistics(userId, {number_of_free_orders: -1});
    const stats = await customerService.obtainStatistics(userId);
    return api.send(res, stats);
  } catch (err: any) {
    functions.logger.error("Stats error:", err);
    return api.error(res, err.message || "Internal server error");
  }
});
publicApi.post("/auth/telegram", async (req: express.Request, res: express.Response) => {
  try {
    functions.logger.info("Verifying Telegram init data:", req.body.initData);

    if (!req.body.initData) {
      /*

      const id = "270053857";
      const customer = await customerService.find(id);
      const balance = await customerBalanceService.obtainForCustomer(id);
      const stats = await customerService.obtainStatistics(id);
      const subscription = await subscriptionService.find(id);
      functions.logger.info("Verifying Telegram init data:", id);
      return api.send(res, { ...customer, balance, stats, subscription });
      */
      return api.badRequest(res, "Missing initData query parameter");
    }

    const verification = verifyTelegramInitData(req.body.initData as string, process.env.TELEGRAM_BOT_TOKEN as string);
    if (!verification) {
      return api.forbidden(res, "Invalid Telegram init data");
    }

    res.cookie("__session", verification.jwt, {
      httpOnly: true,
      secure: true, // HTTPS only
      sameSite: "strict",
    });

    const systemUser = {...verification.data.user, id: `${verification.data.user?.id}`};

    let customer = await customerService.find(`${verification.data.user?.id}`);

    if (!customer) {
      await customerService.set(systemUser);

      customer = systemUser;
    }

    logger.debug("Current customer : ", customer);

    const balance = await customerBalanceService.obtainForCustomer(customer.id);
    const stats = await customerService.obtainStatistics(customer.id);
    const subscription = await subscriptionService.find(customer.id);

    if (verification.data.start_param) {
      try {
        /* send an share enter event later
        const jsonString = decodeURIComponent(readBase64String(verification.data.start_param));

        logger.debug("jsonString : ", jsonString);
        const params = JSON.parse(jsonString);
        if (params.type === "path") redirectUrl = params.value;

        */
      } catch (e) {
        console.warn("start_param parsing failed: ", e);
      }
    }


    return api.send(res, {...customer, balance, stats, subscription});
  } catch (err: any) {
    functions.logger.error(err);
    // The authorize function already sends error responses, so we just need to return
    // If error wasn't handled by authorize, handle it here
    if (!res.headersSent) {
      return api.error(res, err.message || "Internal server error");
    }
    return;
  }
});

publicApi.post("/fix-cartitems", async (req: express.Request, res: express.Response) => {
  try {
    functions.logger.info("Starting fix-cartitems endpoint");

    // 1) Fetch all from ITEMS table and convert list to map where id is items id and value is item object
    const items = await itemService.findAll();
    functions.logger.info(`Fetched ${items.length} items`);
    
    const idToItem = new Map<string, Item>();
    items.forEach(item => {
      idToItem.set(item.id, item);
    });

    // 2) Fetch all from CART_ITEMS
    const cartItems = await cartItemService.findAll();
    functions.logger.info(`Fetched ${cartItems.length} cart items`);

    // 3) For each cart item find corresponding item in idToItem and update cart item
    const updates: Array<{cartItem: any, item: any}> = [];
    const notFound: string[] = [];
    
    for (const cartItem of cartItems) {
      const item = idToItem.get(cartItem.item_id);
      if (item && item.fraction_price_out !== undefined) {
        // Only update if price is different
        if (cartItem.price !== item.fraction_price_out) {
          updates.push({
            cartItem,
            item
          });
        }
      } else {
        notFound.push(cartItem.item_id);
      }
    }

    functions.logger.info(`Found ${updates.length} cart items to update`);
    if (notFound.length > 0) {
      functions.logger.warn(`Could not find items for ${notFound.length} cart items: ${notFound.join(', ')}`);
    }

    await cartItemService.runTransactionally( async t => {
      updates.forEach(({cartItem, item}) => {
        const docRef = cartItemService.getCollection().doc(`${cartItem.id}`);
        t.update(docRef, { price: item.fraction_price_out });
      });
    });

    functions.logger.info(`Successfully updated ${updates.length} cart items`);

    return api.send(res, {
      success: true,
      message: `Updated ${updates.length} cart items`,
      updatedCount: updates.length,
      notFoundCount: notFound.length,
      notFoundItemIds: notFound
    });
  } catch (err: any) {
    functions.logger.error("Error in fix-cartitems:", err);
    return api.error(res, err.message || "Internal server error");
  }
});

publicApi.get("/cart/owners", async (req: express.Request, res: express.Response) => {
  try {
    functions.logger.info("Starting /cart/owners endpoint");

    // 1) Fetch all cart items
    const cartItems = await cartItemService.findAll();
    functions.logger.info(`Fetched ${cartItems.length} cart items`);

    // 2) Extract unique owner IDs from cart items
    const ownerIds = new Set<string>();
    cartItems.filter(ci => !!ci.created_at).forEach(cartItem => {
      if (cartItem.owner && cartItem.owner.id) {
        ownerIds.add(String(cartItem.owner.id));
      }
    });

    functions.logger.info(`Found ${ownerIds.size} unique owners`);

    // 3) Fetch customer objects for each owner ID
    const customers = [];
    // Convert Set to Array for iteration
    const ownerIdsArray = Array.from(ownerIds);
    for (const ownerId of ownerIdsArray) {
      const customer = await customerService.find(ownerId);
      if (customer) {
        customers.push(customer);
      } else {
        functions.logger.warn(`Customer not found for owner ID: ${ownerId}`);
      }
    }

    functions.logger.info(`Returning ${customers.length} customers`);

    return api.send(res, {
      success: true,
      count: customers.length,
      customers
    });
  } catch (err: any) {
    functions.logger.error("Error in /cart/owners:", err);
    return api.error(res, err.message || "Internal server error");
  }
});

export default publicApi;
