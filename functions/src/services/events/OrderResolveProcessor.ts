import {CONSTANTS} from "../../controllers/admin/imports";
import {Order, OrderResolvedEvent, Payment, BalanceChangedEvent, PaymentCreatedEvent, OrderConciliatedEvent} from "../../models";
import EventPublisher from "../EventPublisher";
import IdempotencyGuardService from "../IdempotencyGuardService";
import OrderPickingService from "../OrderPickingService";
import OrderService from "../OrderService";
import TBankService from "../payments/TBankService";
import PaymentService from "../PaymentService";
import AbstractProcessor from "./AbstractProcessor";
import {v4 as uuidv4} from "uuid";

class OrderResolveProcessor extends AbstractProcessor {
  async process(event: OrderResolvedEvent): Promise<void> {
    if (!event.idempotent_key) {
      throw new Error("Idempotent key is missing on OrderResolvedEvent");
    }

    const orderService = new OrderService(this.db);
    const pickingService = new OrderPickingService(this.db);
    const tbankService = new TBankService();

    const order = await orderService.require(event.payload.order_id);
    const picking = await pickingService.require(event.payload.order_id);

    const guard = new IdempotencyGuardService(this.db);

    await guard.runIdempotentRequest(event.idempotent_key, async () => {
      const diff = picking.total - order.total;

      if (diff === 0) {
        await orderService.update(order, {status: "CONCILIATED"});

        const publisher = new EventPublisher<OrderConciliatedEvent>(this.db);
        const event: OrderConciliatedEvent = {
          id: "",
          processed: false,
          retries: 0,
          type: CONSTANTS.EVENTS.ORDER_CONCILIATED,
          created_at: new Date(),
          processed_at: new Date(),
          payload: {
            order_id: order.id,
          },
        };
        await publisher.publish(event);
        return {};
      }

      if (diff < 0) {
        const publisher = new EventPublisher<BalanceChangedEvent>(this.db);
        const event: BalanceChangedEvent = {
          id: "",
          idempotent_key: uuidv4(),
          processed: false,
          retries: 0,
          type: CONSTANTS.EVENTS.BALANCE_CHANGED,
          created_at: new Date(),
          processed_at: new Date(),
          payload: {
            customer_id: `${order.owner.id}`,
            change: diff,
          },
        };
        await publisher.publish(event);

        return {};
      }

      const reconciliation: Order = {
        id: "",
        type: "CONCILIATION",
        owner: order.owner,
        status: "PAYMENT_IN_PROGRESS",
        total: diff,
        reconciliated_order_id: order.id,
        name: `Order ${order.id} reconciliation`,
        items: [{
          fraction: 1,
          group: order.items[0].group,
          id: "",
          item_id: "",
          name: "Финальный расчёт заказа",
          owner: order.items[0].owner,
          price: diff,
          quantity: 1,
          price_for_unit: diff,
          created_at: new Date(),
        }],
      };

      await orderService.update(order, {status: "CONCILIATION_PAYMENT_IN_PROGRESS"});

      const saved = await orderService.add(reconciliation);
      const paymentRequest = tbankService.orderToPaymentRequest(saved);
      const paymentResponse = await tbankService.initPayment(paymentRequest);

      const paymentData: Payment = {
        payment_url: paymentResponse.PaymentURL,
        error_code: paymentResponse.ErrorCode,
        id: "",
        status: "SENT",
        external_id: `${paymentResponse.PaymentId}`, // make sure we store it as string
        terminal_key: paymentResponse.TerminalKey,
        order_id: paymentResponse.OrderId,
        amount: paymentResponse.Amount,
        total: paymentResponse.Amount,
        success: paymentResponse.Success,
        created_at: new Date(),
        updated_at: new Date(),
      };


      const paymentService = new PaymentService(this.db);
      const payment = await paymentService.add(paymentData);

      const publisher = new EventPublisher<PaymentCreatedEvent>(this.db);
      const event: PaymentCreatedEvent = {
        id: "",
        processed: false,
        retries: 0,
        type: CONSTANTS.EVENTS.ORDER_PAYMENT_CREATED,
        created_at: new Date(),
        processed_at: new Date(),
        payload: {
          payment_id: payment.id,
        },
      };
      await publisher.publish(event);

      return payment;
    });
  }
}

export default OrderResolveProcessor;
