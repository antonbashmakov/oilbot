import * as dotenv from "dotenv";

import UserService, {
  functions,
  cors,
  admin,
  express,
  DeliveryService,
  OrderService,
  PaymentService,
  CustomerService,
  TelegramService,
  api,
  CONSTANTS,
  toMessage,
  formatDate,
} from "./imports";
import {DeliveryOverview, OrderResolvedEvent, Stats, Payment, CustomerOverview, OrderCancelledEvent, ConversationMessage, Order} from "../../models";
import OrderPickingService from "../../services/OrderPickingService";
import EventPublisher from "../../services/EventPublisher";
import IdempotencyGuardService from "../../services/IdempotencyGuardService";
import TBankService from "../../services/payments/TBankService";
import CustomerBalanceService from "../../services/CustomerBalanceService";
import ConversationMessageService from "../../services/ConversationMessageService";
import {logger} from "../../services/logger";
import {authorize} from "../../services/utils";
import {localeMiddleware} from "../../middleware/localeMiddleware";
// import { debug } from 'firebase-functions/logger';
dotenv.config();

admin.initializeApp({}, "admin");

const db = admin.firestore();

console.log(">>>>>>>>>>>>", process.env.GCLOUD_PROJECT);

if (process.env.GCLOUD_PROJECT !== "test-project" && db.databaseId !== process.env.DATABASE_ID) {
  db.settings({
    databaseId: process.env.DATABASE_ID,
  });
}

const adminApi = express();


adminApi.use(cors(
  {origin: true} // allows all cross origin xhr requests
));

adminApi.use(localeMiddleware);

adminApi.use(async (req: express.Request, res: express.Response, next: express.NextFunction) => {
  const userService = new UserService(db);
  try {
    return await authorize(req, res, next, userService, "ADMIN");
  } catch (err: any) {
    logger.error(err);
    return api.error(res, err.message);
  }
});

adminApi.get("/deliveries", async (req: express.Request, res: express.Response) => {
  try {
    const deliveryService = new DeliveryService(db);

    const deliveries = await deliveryService.findAll();

    return api.send(res, deliveries);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

adminApi.get("/deliveries/:id", async (req: express.Request, res: express.Response) => {
  try {
    const {id} = req.params;
    const deliveryService = new DeliveryService(db);
    const orderService = new OrderService(db);
    const delivery = await deliveryService.find(id);

    if (!delivery) {
      return api.notFound(res, "Delivery not found");
    }

    const orders = await orderService.findOrders(delivery);

    const activeOrders = orders.filter((o) => o.status !== "CANCELED");
    const cancelledOrders = orders.filter((o) => o.status === "CANCELED");

    const deliveryOverview = {...delivery, orders, activeOrders, cancelledOrders} as DeliveryOverview;


    const allItems = activeOrders.flatMap((o) => o.items);

    const stats = allItems.reduce((s, i) => {
      if (!s[i.item_id]) {
        s[i.item_id] = {total: 0, quantity: 0, fraction: 0, name: i.name, group: i.group};
      }
      s[i.item_id].total += i.price * i.quantity;
      s[i.item_id].fraction += i.fraction;
      s[i.item_id].quantity += i.quantity;


      return s;
    }, {} as { [key: string]: Stats & { group: string } });

    deliveryOverview.stats = Object.keys(stats).map((key) => stats[key]);

    return api.send(res, deliveryOverview);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

adminApi.get("/deliveries/:id/stats/:format", async (req: express.Request, res: express.Response) => {
  try {
    const {id, format} = req.params;
    const {status} = req.query;

    // Validate format parameter
    if (format !== "CSV") {
      return api.badRequest(res, "Invalid format. Only CSV is supported.");
    }
    const validStatuses = [
      "PENDING", "PAYMENT_IN_PROGRESS", "PAYMENT_FAILED", "PAID",
      "RESOLVING", "CONCILIATION_PAYMENT_IN_PROGRESS", "CONCILIATED", "CANCELED",
    ];
    if (!validStatuses.includes(status as string)) {
      return api.badRequest(res, "Wrong status provided.");
    }

    const deliveryService = new DeliveryService(db);
    const orderService = new OrderService(db);
    const delivery = await deliveryService.find(id);

    if (!delivery) {
      return api.notFound(res, "Delivery not found");
    }

    const orders = await orderService.findOrders(delivery);

    const allItems = orders.filter((o) => o.status !== status).flatMap((o) => o.items);

    const stats = allItems.reduce((s, i) => {
      if (!s[i.item_id]) {
        s[i.item_id] = {total: 0, quantity: 0, fraction: 0, name: i.name};
      }
      s[i.item_id].total += i.price * i.quantity;
      s[i.item_id].fraction += i.fraction;
      s[i.item_id].quantity += i.quantity;
      return s;
    }, {} as { [key: string]: Stats });

    // Convert stats to CSV
    const csvRows = [];
    // Header row
    csvRows.push(["item_id", "name", "total", "fraction", "quantity"].join(","));

    // Data rows
    Object.entries(stats).forEach(([itemId, stat]) => {
      // Escape quotes and handle commas in names
      const escapedName = stat.name.includes(",") || stat.name.includes("\"") ?
        `"${stat.name.replace(/"/g, "\"\"")}"` :
        stat.name;
      csvRows.push([itemId, escapedName, stat.total, stat.fraction, stat.quantity].join(","));
    });

    const csvContent = csvRows.join("\n");

    // Set headers for file download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader("Content-Disposition", `attachment; filename="delivery-stats-${id}.csv"`);

    return res.status(200).send(csvContent);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

adminApi.get("/orders/:id", async (req: express.Request, res: express.Response) => {
  try {
    const {id} = req.params;
    const orderService = new OrderService(db);

    const order = (await orderService.find(id));

    if (!order) {
      return api.notFound(res, "Order not found");
    }

    const customerService = new CustomerService(db);
    const pickingService = new OrderPickingService(db);
    const customerBalanceService = new CustomerBalanceService(db);

    const picking = await pickingService.find(id);
    const customer = await customerService.require(order.owner!.id) as CustomerOverview;
    const balance = await customerBalanceService.obtainForCustomer(customer.id);
    customer.balance = balance;


    return api.send(res, {...order, picking, customer});
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

adminApi.patch("/orders/:id", async (req: express.Request, res: express.Response) => {
  try {
    const {id} = req.params;
    const {name} = req.body;

    const orderService = new OrderService(db);
    const order = await orderService.find(id);

    if (!order) {
      return api.notFound(res, "Order not found");
    }

    // Validate that order can be edited (similar to other order update endpoints)
    if (order.status !== "PENDING" && order.status !== "PAID") {
      return api.badRequest(res, "Order is not editable");
    }

    // Update only the name field if provided
    const updateData: Partial<Order> = {};
    if (name !== undefined) {
      updateData.name = name;
    }

    // If no fields to update, return the order as is
    if (Object.keys(updateData).length === 0) {
      return api.send(res, order);
    }

    await orderService.update(order, updateData);

    // Fetch the updated order
    const updatedOrder = await orderService.find(id);
    return api.send(res, updatedOrder);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

adminApi.patch("/order-pickings/:id", async (req: express.Request, res: express.Response) => {
  try {
    const {id} = req.params;
    const {items} = req.body;

    if (!items || !Array.isArray(items)) {
      return api.error(res, "Items array is required");
    }

    const orderService = new OrderService(db);
    const order = await orderService.find(id);


    if (!order) {
      return api.notFound(res, "Order not found");
    }
    if (order.status !== "PENDING" && order.status !== "PAID") {
      return api.badRequest(res, "Order is not editable");
    }

    const pickingService = new OrderPickingService(db);
    const updatedPicking = await pickingService.updateItems(id, items);

    return api.send(res, updatedPicking);
  } catch (err: any) {
    functions.logger.error(err);
    if (err.message.includes("not found")) {
      return api.notFound(res, "Order picking not found");
    }
    return api.error(res, err.message || "Internal server error");
  }
});

adminApi.post("/orders/:id/order-picking", async (req: express.Request, res: express.Response) => {
  try {
    const {id} = req.params;

    const orderService = new OrderService(db);
    const order = await orderService.find(id);

    if (!order) {
      return api.notFound(res, "Order not found");
    }

    const pickingService = new OrderPickingService(db);
    const picking = await pickingService.findOrCreateFromOrder(id, order);

    return api.send(res, picking);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

adminApi.post("/order-pickings/:pickingId/items/:itemId/collect", async (req: express.Request, res: express.Response) => {
  try {
    const {pickingId, itemId} = req.params;

    const orderService = new OrderService(db);
    const order = await orderService.find(pickingId);

    if (!order) {
      return api.notFound(res, "Order not found");
    }
    if (order.status !== "PENDING" && order.status !== "PAID") {
      return api.badRequest(res, "Order is not editable");
    }


    const pickingService = new OrderPickingService(db);
    await pickingService.toggleOrderItemCollection(pickingId, itemId);
    return res.status(204).send();
  } catch (err: any) {
    functions.logger.error(err);
    if (err.message.includes("not found")) {
      return api.notFound(res, err.message);
    }
    return api.error(res, err.message || "Internal server error");
  }
});

adminApi.post("/orders/:id/consolidate", async (req: express.Request, res: express.Response) => {
  try {
    const {id} = req.params;

    const orderService = new OrderService(db);
    const order = await orderService.find(id);

    if (!order) {
      return api.notFound(res, "Order not found");
    }
    if (order.status !== "PENDING" && order.status !== "PAID") {
      return api.badRequest(res, "Order is not editable");
    }

    const pickingService = new OrderPickingService(db);

    const picking = await pickingService.find(id);

    if (!picking || !picking.items.every((i) => i.status === "COLLECTED")) {
      return api.badRequest(res, "Order is not compiled");
    }


    await orderService.updateTransactionally(order, {status: "RESOLVING"});

    const eventPublisher = new EventPublisher<OrderResolvedEvent>(db);

    const event: OrderResolvedEvent = {
      id: "", // will be set by OutboxEventService
      idempotent_key: order.id,
      created_at: new Date(),
      processed_at: new Date(),
      processed: false,
      retries: 0,
      type: CONSTANTS.EVENTS.ORDER_RESOLVED,
      payload: {order_id: order.id},

    };

    await eventPublisher.publish(event);

    return api.send(res, {});
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

adminApi.put("/orders/:id/cancel", async (req: express.Request, res: express.Response) => {
  try {
    const {id} = req.params;

    const orderService = new OrderService(db);
    const order = await orderService.find(id);

    if (!order) {
      return api.notFound(res, "Order not found");
    }

    const cancellableStatuses = ["PENDING", "PAYMENT_IN_PROGRESS", "PAYMENT_FAILED", "PAID"];
    if (!cancellableStatuses.includes(order.status)) {
      return api.badRequest(res, `Order cannot be cancelled in current status: ${order.status}`);
    }

    // Update order status to CANCELED
    await orderService.updateTransactionally(order, {status: "CANCELED"});

    // Emit OrderCancelledEvent
    const eventPublisher = new EventPublisher<OrderCancelledEvent>(db);

    const event: OrderCancelledEvent = {
      id: "", // will be set by OutboxEventService
      idempotent_key: `order-cancelled-${order.id}`,
      created_at: new Date(),
      processed_at: new Date(),
      processed: false,
      retries: 0,
      type: CONSTANTS.EVENTS.ORDER_CANCELED,
      payload: {order_id: order.id},
    };

    await eventPublisher.publish(event);

    return res.status(204).send();
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

adminApi.get("/orders/:id/conciliation", async (req: express.Request, res: express.Response) => {
  try {
    const {id} = req.params;
    const orderService = new OrderService(db);

    const conciliationOrder = await orderService.findConciliationOrder(id);

    return api.send(res, conciliationOrder);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

adminApi.get("/orders/:orderId/payments", async (req: express.Request, res: express.Response) => {
  try {
    const {orderId} = req.params;
    const orderService = new OrderService(db);
    const paymentService = new PaymentService(db);

    // First, get the main order to verify it exists
    const order = await orderService.find(orderId);
    if (!order) {
      return api.notFound(res, "Order not found");
    }

    // Get payments for the main order
    const mainOrderPayments = await paymentService.findByOrderId(orderId);

    // Get conciliation order if it exists
    const conciliationOrder = await orderService.findConciliationOrder(orderId);
    let conciliationOrderPayments: Payment[] = [];

    if (conciliationOrder) {
      // Get payments for the conciliation order
      conciliationOrderPayments = await paymentService.findByOrderId(conciliationOrder.id);
    }

    // Combine all payments
    const allPayments = [...mainOrderPayments, ...conciliationOrderPayments];

    return api.send(res, allPayments);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

adminApi.post("/orders/:orderId/payments", async (req: express.Request, res: express.Response) => {
  try {
    const {orderId} = req.params;
    const {idempotency_key} = req.body;

    if (!idempotency_key) {
      return api.badRequest(res, "idempotency_key is required");
    }

    const orderService = new OrderService(db);
    const paymentService = new PaymentService(db);
    const customerService = new CustomerService(db);
    const idempotencyGuardService = new IdempotencyGuardService(db);
    const tbankService = new TBankService();
    const telegramService = new TelegramService();

    // First, get the main order to verify it exists
    const order = await orderService.find(orderId);
    if (!order) {
      return api.notFound(res, "Order not found");
    }

    // Check if order already has a payment in status 'SENT' or 'CONFIRMED'
    const existingPayments = await paymentService.findByOrderId(orderId);
    const hasActivePayment = existingPayments.some((payment) =>
      payment.status === "SENT" || payment.status === "CONFIRMED"
    );

    if (hasActivePayment) {
      return api.badRequest(res, "Order already has a payment in status 'SENT' or 'CONFIRMED'");
    }

    const payment = await idempotencyGuardService.runIdempotentRequest(
      idempotency_key,
      async () => {
        const paymentRequest = tbankService.orderToPaymentRequest(order);
        const paymentResponse = await tbankService.initPayment(paymentRequest);

        if (!paymentResponse.Success) {
          throw new Error(`Payment initiation failed: ${paymentResponse.ErrorCode}`);
        }

        // Create payment record in Firestore
        const paymentData: Payment = {
          id: "",
          external_id: paymentResponse.PaymentId,
          terminal_key: paymentResponse.TerminalKey,
          payment_url: paymentResponse.PaymentURL,
          order_id: orderId,
          amount: order.total * 100, // Convert to kopecks
          total: order.total * 100,
          status: "SENT",
          success: false,
          created_at: new Date(),
          updated_at: new Date(),
        };

        paymentService.add(paymentData);

        // Update order status to PAYMENT_IN_PROGRESS if it's not already
        if (order.status !== "PAYMENT_IN_PROGRESS") {
          await orderService.update(order, {status: "PAYMENT_IN_PROGRESS"});
        }

        // Send Telegram notification to order owner
        try {
          // Get customer to get their chat ID
          const customer = await customerService.find(order.owner.id);
          // Format message using ORDER_PAYMENT_CREATED template
          const messageValues = {
            items: order.items.map((item) => ({
              name: item.name,
              price: item.price * item.quantity,
            })),
            delivery: order.delivery ? {
              deliveryStart: formatDate(order.delivery.delivery_start),
              deliveryEnd: formatDate(order.delivery.delivery_end),
            } : null,
            total: order.total,
            orderId: order.id,
            paymentUrl: paymentResponse.PaymentURL,
          };

          const messageText = toMessage("ORDER_PAYMENT_CREATED", messageValues);

          // Send Telegram message
          await telegramService.sendMessage(customer!.id, messageText);
        } catch (telegramError: any) {
          // Log Telegram error but don't fail the payment creation
          functions.logger.error("Failed to send Telegram notification:", telegramError);
        }

        return paymentData;
      }
    );

    return api.send(res, payment);
  } catch (err: any) {
    functions.logger.error("Error creating payment:", err);

    // Check if it's an idempotency error (duplicate request)
    if (err.message && err.message.includes("already processed")) {
      return api.badRequest(res, "Duplicate request detected");
    }

    return api.error(res, err.message || "Internal server error");
  }
});

adminApi.post("/customers/:customerId/messages", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId} = req.params;
    const {text} = req.body;

    if (!text) {
      return api.badRequest(res, "text is required");
    }

    const customerService = new CustomerService(db);
    const telegramService = new TelegramService();
    const conversationMessageService = new ConversationMessageService(db);

    // Get customer from db
    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    await telegramService.sendMessage(customer.id, text);

    const message: ConversationMessage = {
      id: "", // will be generated by Firestore
      thread_id: `admin-to-${customerId}`,
      provider: "TELEGRAM",
      recipient_id: `${customer.id}`, // rework all ids to string after NY delivery
      text,
      role: "ADMIN",
      created_at: new Date(),
    };
    const savedMessage = await conversationMessageService.add(message);
    return api.send(res, savedMessage);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

adminApi.get("/customers/:customerId/messages", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId} = req.params;

    const customerService = new CustomerService(db);
    const conversationMessageService = new ConversationMessageService(db);

    // Get customer from db to verify they exist
    const customer = await customerService.find(customerId);
    if (!customer) {
      return api.notFound(res, "Customer not found");
    }

    // Get conversation messages for this customer using efficient query
    const customerMessages = await conversationMessageService.findByRecipientId(customerId);

    return api.send(res, customerMessages);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

export default adminApi;
