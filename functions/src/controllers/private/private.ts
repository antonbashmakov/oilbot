import {
  functions,
  cors,
  admin,
  express,
  api,
  DeliveryService,
  ItemService,
  CustomerService,
  CartItemService,
  OrderService,
  PaymentService,
  IdempotencyGuardService,
  TBankService,
  SubscriptionService,
  CustomerBalanceService,
  EventPublisher,
  CONSTANTS,
} from "./imports";
// import {authorize} from "../../services/utils";
import * as dotenv from "dotenv";
// import {logger} from "firebase-functions/v1";
import {DeliveryRef, ItemOverview, Order, OrderOverview, OrderCreatedEvent, Payment, Subscription} from "../../models";
import _ = require("lodash");
// import * as jwt from "jsonwebtoken";
import * as cookieParser from "cookie-parser";
import moment = require("moment");
import {logger} from "firebase-functions/v1";

admin.initializeApp(functions.config().firebase, "private");
dotenv.config();

const db = admin.firestore();

if (process.env.GCLOUD_PROJECT !== "test-project" && db.databaseId !== process.env.DATABASE_ID) {
  db.settings({
    databaseId: process.env.DATABASE_ID,
  });
}

const deliveryService = new DeliveryService(db);
const itemService = new ItemService(db);
const customerService = new CustomerService(db);
const cartItemService = new CartItemService(db);
const orderService = new OrderService(db);

const paymentService = new PaymentService(db);
const idempotencyGuardService = new IdempotencyGuardService(db);
const tbankService = new TBankService();
const subscriptionService = new SubscriptionService(db);
const customerBalanceService = new CustomerBalanceService(db);


const privateApi = express();

privateApi.use(cors(
  {origin: true} // allows all cross origin xhr requests
));

privateApi.use(cookieParser());
/*
// Cookie authentication middleware for customer routes
const cookieAuthMiddleware = async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  try {
    // Get JWT from cookie
    const token = req.cookies?.__session;

    if (!token) {
      return api.unauthorized(res, "Authentication required");
    }

    // Verify JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET as string) as { id: string };
    await customerService.require(decoded.id);
    return next();
  } catch (error: any) {
    if (error.name === "JsonWebTokenError" || error.name === "TokenExpiredError") {
      return api.unauthorized(res, "Invalid or expired token");
    }
    return api.error(res, "Authentication failed");
  }
};
*/
// Apply cookie auth middleware to all customer routes
// privateApi.use(cookieAuthMiddleware);

privateApi.get("/deliveries", async (req: express.Request, res: express.Response) => {
  try {
    const deliveries = await deliveryService.findAll();
    api.send(res, deliveries);
  } catch (err: any) {
    functions.logger.error(err);
    api.error(res, err.message || "Internal server error");
  }
});

privateApi.get("/deliveries/:id", async (req: express.Request, res: express.Response) => {
  try {
    const {id} = req.params;
    const delivery = await deliveryService.find(id);

    if (!delivery) {
      return api.notFound(res, "Delivery not found");
    }

    return api.send(res, delivery);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.get("/items/category/:category", async (req: express.Request, res: express.Response) => {
  try {
    const {category} = req.params;

    const deliveryService = new DeliveryService(db);

    let items;

    if (category === "ALL") {
      items = await itemService.findAll();
    } else {
      items = await itemService.findByCategory(category);
    }

    if (!items || items.length === 0) {
      return api.send(res, []);
    }

    const groups = [...new Set(items.map((item) => item.group))];

    const groupDeliveries = await deliveryService.findClosestByGroups(groups);
    const deliveryMap: { [key: string]: DeliveryRef[] } = _.groupBy(groupDeliveries, "group");

    const itemOverviews = items.map((item) => ({
      name: item.name,
      category: item.category,
      group: item.group,
      unit: item.unit,
      unit_description:
        item.unit_description,
      is_weighted: item.is_weighted,
      fraction: item.fraction,
      price_out: item.price_out,
      description: item.description,
      fraction_price_out: item.fraction_price_out,
      id: item.id, link: item.link,
      deliveries: deliveryMap[item.group] || [],
    } as ItemOverview));

    return api.send(res, itemOverviews);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.get("/customers/:customerId/cart/items", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId} = req.params;

    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    const cartItems = await cartItemService.fetchForOwner({id: String(customer.id)});
    return api.send(res, cartItems || []);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.post("/customers/:customerId/cart/items", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId} = req.params;
    const {itemId} = req.body;

    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    const item = await itemService.find(itemId);
    if (!item) {
      return api.notFound(res, "Item not found");
    }

    const cartItem = await cartItemService.addToCart(item, customer);
    return api.send(res, cartItem);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.delete("/customers/:customerId/cart/items", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId} = req.params;
    const {cartItemId, itemId} = req.body;

    if (!cartItemId && !itemId) {
      return api.badRequest(res, "Either cartItemId or itemId must be provided");
    }

    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    if (itemId) {
      const cartItems = await cartItemService.fetchForOwner({id: String(customer.id)});
      const itemsToRemove = cartItems?.filter((item) => item.item_id === itemId);
      cartItemService.deleteTransactionally(itemsToRemove);

      return api.send(res, {});
    }


    // Assuming there's a method to remove cart item by ID
    // We need to check if the cart item belongs to this customer
    const cartItems = await cartItemService.fetchForOwner({id: String(customer.id)});
    const cartItem = cartItems?.find((item) => item.id === cartItemId);

    if (!cartItem) {
      return api.notFound(res, "Cart item not found");
    }

    await cartItemService.delete(cartItem);

    // Assuming there's a removeFromCart or delete method in CartItemService
    // For now, we'll return success since we found the item
    // In a real implementation, we would call something like:
    // await cartItemService.removeFromCart(cartItemId);

    return res.status(204).send();
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.get("/customers/:customerId/orders", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId} = req.params;

    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    const orders = await orderService.fetchForOwner({id: String(customer.id)});


    if (!orders || orders.length === 0) {
      return api.send(res, []);
    }

    const payments = await paymentService.findByOrderIds(orders.map((o) => o.id));

    const groupedPayments = _.keyBy(payments, "order_id");

    const overviews = orders.map((order) => {
      const overview: OrderOverview = {...order};
      const p = groupedPayments[order.id];
      if (p) {
        overview.payment = p;
      }

      return overview;
    });

    return api.send(res, overviews);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});
/*
privateApi.post("/customers/:customerId/orders", async (req: express.Request, res: express.Response) => {
  try {
    const { customerId } = req.params;

    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    const cartItems = await cartItemService.fetchForOwner({ id: String(customer.id) });
    if (!cartItems || cartItems.length === 0) {
      return api.send(res, {});
    }

    const order = await orderService.createOrderFromCart(customer, cartItems, null);
    return api.send(res, order);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});
*/

privateApi.get("/customers/:customerId", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId} = req.params;

    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    // Get customer balance
    const balance = await customerBalanceService.obtainForCustomer(customerId);

    // Get customer statistics
    const stats = await customerService.obtainStatistics(customerId);

    // Get subscription
    const subscription = await subscriptionService.find(customerId);

    // Construct customer overview
    const customerOverview = {
      ...customer,
      balance,
      stats,
      subscription: subscription || null,
    };

    return api.send(res, customerOverview);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.get("/customers/:customerId/items/:itemId", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId, itemId} = req.params;

    // Check if customer exists
    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    // Get item
    const item = await itemService.find(itemId);
    if (!item) {
      return api.notFound(res, "Item not found");
    }

    // Get item statistics
    const stats = await itemService.obtainStatistics(itemId);

    // Get deliveries for the item's group (similar to category endpoint)
    const deliveryService = new DeliveryService(db);
    const groupDeliveries = await deliveryService.findClosestByGroups([item.group]);
    const deliveries = groupDeliveries.filter((d) => d.group === item.group);

    // Construct item overview
    const itemOverview: ItemOverview = {
      name: item.name,
      category: item.category,
      group: item.group,
      unit: item.unit,
      unit_description: item.unit_description,
      fraction: item.fraction,
      price_out: item.price_out,
      description: item.description,
      fraction_price_out: item.fraction_price_out,
      id: item.id,
      link: item.link,
      deliveries: deliveries as any,
      is_weighted: item.is_weighted,
      stats: stats,
    };

    return api.send(res, itemOverview);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.post("/customers/:customerId/cart/order", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId} = req.params;
    const idempotencyKey = req.headers["idempotency_key"] as string;

    if (!idempotencyKey) {
      return api.badRequest(res, "idempotency_key header is required");
    }

    const customer = await customerService.find(customerId);
    if (!customer) {
      throw new Error("Customer not found");
    }

    // Use idempotency guard to ensure transactional and idempotent operation
    const result = await idempotencyGuardService.runIdempotentRequest<{ orders: Order[], payments: Payment[] }>(
      `cart-order-${customerId}-${idempotencyKey}`,
      async () => {
        const hasActiveSubscription = await subscriptionService.hasActiveSubscription(customerId, new Date());
        const stats = await customerService.obtainStatistics(customerId);
        const balance = await customerBalanceService.obtainForCustomer(customerId);
        let subscriptionToCreate;

        if (((stats.number_of_free_orders || 0) <= 0) && !hasActiveSubscription && balance.value < 300) {
          logger.error(`Customer ${customerId} cannot place order due to insufficient balance and no active subscription`, {balance: balance, customer});
          throw new Error("Active subscription is missing");
        }

        if (((stats.number_of_free_orders || 0) <= 0) && !hasActiveSubscription && balance.value >= 300) {
          subscriptionToCreate = subscriptionService.buildSubscription(customerId, 300, new Date());
          subscriptionToCreate.status = "ACTIVE";
        }

        const cartItems = await cartItemService.fetchForOwner({id: String(customer.id)});
        if (!cartItems || cartItems.length === 0) {
          throw new Error("Cart is empty");
        }

        // Group cart items by their group field
        const groupedCartItems = _.groupBy(cartItems, "group");
        const groups = Object.keys(groupedCartItems);

        // Find deliveries for each group
        const groupDeliveries = await deliveryService.findClosestByGroups(groups);

        // Create a map of group to earliest delivery (closest future delivery)
        const deliveryMap: { [key: string]: DeliveryRef } = {};
        groupDeliveries.forEach((delivery) => {
          const group = delivery.group;
          // If we haven't found a delivery for this group yet, or if this delivery is earlier (smaller delivery_start)
          if (!deliveryMap[group] || delivery.delivery_start.getTime() < deliveryMap[group].delivery_start.getTime()) {
            deliveryMap[group] = delivery;
          }
        });

        const orders: Order[] = [];
        const payments: Payment[] = [];

        // Create order for each group
        for (const [group, items] of Object.entries(groupedCartItems)) {
          const delivery = deliveryMap[group];
          console.log(`Creating order for group ${group} with delivery ${delivery?.id}`);

          const order = await orderService.createOrderFromCart(customer, items, delivery,);
          const paymentRequest = tbankService.orderToPaymentRequest(order);
          const paymentResponse = await tbankService.initPayment(paymentRequest);

          if (!paymentResponse.Success) {
            logger.error(`Payment initialization failed for group ${group}: ${paymentResponse.Message}; ${paymentResponse.Details}`);
            throw new Error(`Payment initialization failed for group ${group}: ${paymentResponse.Message}; ${paymentResponse.Details}`);
          }

          const payment: Payment = {
            id: "",
            external_id: paymentResponse.PaymentId,
            terminal_key: paymentRequest.TerminalKey,
            payment_url: paymentResponse.PaymentURL!,
            order_id: order.id,
            amount: order.total * 100,
            total: order.total * 100,
            status: "SENT",
            success: false,
            created_at: new Date(),
            updated_at: new Date(),
            error_code: paymentResponse.ErrorCode || "0",
          };

          const p = await paymentService.add(payment);
          payments.push(p);

          await orderService.update(order, {status: "PAYMENT_IN_PROGRESS"});

          const event: OrderCreatedEvent = {
            id: "", // will be set by OutboxEventService
            idempotent_key: order.id,
            created_at: new Date(),
            processed_at: new Date(),
            processed: false,
            retries: 0,
            type: CONSTANTS.EVENTS.ORDER_CREATED,
            payload: {order_id: order.id},
          };

          const eventPublisher = new EventPublisher<OrderCreatedEvent>(db);
          await eventPublisher.publish(event);

          orders.push(order);
        }

        // Update customer statistics (once for all orders)
        await customerService.incrementStatistics(customerId, {
          number_of_orders: orders.length,
          number_of_active_orders: orders.length,
          number_of_free_orders: -orders.length,
        });

        if (subscriptionToCreate) {
          await subscriptionService.set(subscriptionToCreate);
          await customerBalanceService.updateBalance(customerId, -300, "SUBSCRIPTION_CHARGE");
        }

        return {
          orders,
          payments,
        };
      }
    );
    return api.send(res, {orders: result.orders, payments: result.payments});
  } catch (err: any) {
    functions.logger.error(err);

    // Handle specific error cases
    if (err.message === "Customer not found") {
      return api.notFound(res, "Customer not found");
    }
    if (err.message === "Cart is empty") {
      return api.badRequest(res, "Cart is empty");
    }
    if (err.message.includes("Payment initialization failed")) {
      return api.error(res, err.message);
    }
    if (err.message === "Active subscription is missing") {
      return api.paymentRequired(res, "Customer needs an active subscription to place orders");
    }

    logger.error("Unhandled error during cart order creation", {error: err});

    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.post("/customers/:customerId/subscriptions", async (req: express.Request, res: express.Response) => {
  const idempotencyKey = req.headers["idempotency_key"] as string;

  if (!idempotencyKey) {
    return api.badRequest(res, "idempotency_key header is required");
  }
  const {customerId} = req.params;
  const {method} = req.body ;

  // Check if customer exists
  const customer = await customerService.find(customerId);
  if (!customer) {
    return api.notFound(res, "Customer not found");
  }

  try {
    const result = await idempotencyGuardService.runIdempotentRequest<{ payment: Payment, subscription: Subscription }>(
      `cart-order-${customerId}-${idempotencyKey}`,
      async () => {
        const hasActiveSubscription = await subscriptionService.hasActiveSubscription(customerId, new Date());

        if (hasActiveSubscription) {
          throw new Error("Active subscription exists");
        }

        const d = moment(new Date(), "YYYY-MM-DD");
        const nextPaymentDate = d.add(1, "M").toDate();
        const subscription: Subscription = {
          id: customerId,
          created_at: new Date(),
          next_payment_at: nextPaymentDate,
          status: "PENDING",
          fee: 10,
        };

        const paymentRequest = method === "sbp" ? tbankService.subscriptionToInitQRPaymentRequest(subscription) : tbankService.subscriptionToInitCardPaymentRequest(subscription);
        let paymentResponse = await tbankService.initPayment(paymentRequest);

        if (!paymentResponse.Success) {
          throw new Error(`Payment initialization failed: ${paymentResponse.Message}; ${paymentResponse.Details}`);
        }

        if(method === "sbp") {
          const qrRequest = tbankService.paymentToQRRequest(paymentResponse.PaymentId);
          paymentResponse = await tbankService.requestQR(qrRequest);
        }

        if (!paymentResponse.Success) {
          throw new Error(`QR Payment initialization failed: ${paymentResponse.Message}; ${paymentResponse.Details}`);
        }
        // https://qr.nspk.ru/AD1P0060EL96K9C18LLRIJ39S23RO4HP?type=02&bank=100000000004&sum=1000&cur=RUB&crc=92EA
        const payment: Payment = {
          id: "",
          external_id: paymentResponse.PaymentId,
          terminal_key: paymentRequest.TerminalKey,
          payment_url:  method === "sbp" ? paymentResponse.Data! : paymentResponse.PaymentURL!,
          order_id: customerId,
          amount: subscription.fee * 100,
          total: subscription.fee * 100,
          status: "SENT",
          success: false,
          created_at: new Date(),
          updated_at: new Date(),
          error_code: paymentResponse.ErrorCode || "0",
        };

        const p = await paymentService.add(payment);
        await subscriptionService.set(subscription);

        return {
          payment: p,
          subscription,
        };
      });

    return api.send(res, {paymentUrl: result.payment.payment_url});
  } catch (err: any) {
    functions.logger.error(err);


    if (err.message.includes("Payment initialization failed")) {
      return api.error(res, err.message);
    }
    if (err.message === "Active subscription exists") {
      return api.badRequest(res, "Customer already has an active subscription");
    }

    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.get("/customers/:customerId/banks", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId} = req.params;

    // Check if customer exists
    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    // Create banks list request - using "mobile" type as default
    const banksListRequest = tbankService.createBanksListRequest("mobile");
    
    // Fetch banks list from Tinkoff API
    const banks = await tbankService.banksList(banksListRequest);

    logger.info(banks);

    // Return the banks list in the standard API response format
    return api.send(res, banks);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

export default privateApi;
