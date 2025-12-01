import { OrderPaymentFailedEvent } from "../../models";
import OrderService from "../OrderService";
import PaymentService from "../PaymentService";
import AbstractProcessor from "./AbstractProcessor";
import { error } from "firebase-functions/logger";

class OrderPaymentFailedProcessor extends AbstractProcessor {
  async process(event: OrderPaymentFailedEvent): Promise<void> {
    const orderService = new OrderService(this.db);
    const paymentService = new PaymentService(this.db);

    const orderId = event.payload.order_id;
    const externalPaymentId = event.payload.external_id;
    const paymentStatus = event.payload.status;

    const order = await orderService.require(orderId);

    const payment = await paymentService.findByExternalId(externalPaymentId);
    if (!payment) {
      throw new Error(`Payment not found ${externalPaymentId}`);
    }

    await orderService.runTransactionally(async t => {
      // Update order status to PAYMENT_FAILED
      const orderDocRef = orderService.getCollection().doc(order.id);
      t.update(orderDocRef, { status: "PAYMENT_FAILED" });

      // Update payment status with the failed status from webhook
      const paymentDocRef = paymentService.getCollection().doc(payment.id);
      t.update(paymentDocRef, { 
        success: false,
        status: paymentStatus
      });
    });

    // Log the payment failure for monitoring
    error(`Payment failed for order ${orderId}: ${paymentStatus}`, {
      orderId,
      externalPaymentId,
      paymentStatus,
      paymentId: payment.id
    });
  }
}

export default OrderPaymentFailedProcessor;
