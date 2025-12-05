import { OrderCancelledEvent } from "../../models";
import OrderService from "../OrderService";
import PaymentService from "../PaymentService";
import TBankService from "../payments/TBankService";
import AbstractProcessor from "./AbstractProcessor";
import { error } from "firebase-functions/logger";

class OrderCancelledProcessor extends AbstractProcessor {
  async process(event: OrderCancelledEvent): Promise<void> {
    const orderService = new OrderService(this.db);
    const paymentService = new PaymentService(this.db);
    const tbankService = new TBankService();

    const orderId = event.payload.order_id;

    // Require order by order_id
    const order = await orderService.require(orderId);

    // Find active payments for this order
    const payments = await paymentService.findByOrderId(orderId);

    // Filter for active payments (status SENT or CONFIRMED)
    const activePayments = payments.filter(payment =>
      payment.status === "SENT" ||
      payment.status === "CONFIRMED"
    );

    // If there is no active payment return empty object {}
    if (activePayments.length === 0) {
      return;
    }

    // Map promises of cancellations
    const cancellationPromises = activePayments.map(async (payment) => {
      const paymentRequest = tbankService.orderToPaymentRequest(order);
      paymentRequest.PaymentId = payment.external_id;
      // Call cancelPayment
      return tbankService.cancelPayment(paymentRequest);

    });

    // Wait for all promises to finish
    const results = await Promise.all(cancellationPromises);

    // Check if any cancellations failed
    const failedResults = results.filter(result => !result.Success);
    failedResults.forEach(r =>  error(`Cancellation of Payment ${r.PaymentId} for order ${r.OrderId} failed. Error : ${r.ErrorCode}. Message: ${r.Message} `));
  }
}

export default OrderCancelledProcessor;
