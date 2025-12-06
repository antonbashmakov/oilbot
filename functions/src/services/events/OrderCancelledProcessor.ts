import {logger} from "firebase-functions/v1";
import {OrderCancelledEvent, TinkoffResult} from "../../models";
import PaymentService from "../PaymentService";
import TBankService from "../payments/TBankService";
import AbstractProcessor from "./AbstractProcessor";
import {error} from "firebase-functions/logger";

class OrderCancelledProcessor extends AbstractProcessor {
  async process(event: OrderCancelledEvent): Promise<{ cancelations: TinkoffResult[]}> {
    const paymentService = new PaymentService(this.db);
    const tbankService = new TBankService();

    const orderId = event.payload.order_id;

    // Require order by order_id
    // Find active payments for this order
    const payments = await paymentService.findByOrderId(orderId);
    const activePayments = payments.filter((payment) =>
      payment.status === "SENT" ||
      payment.status === "CONFIRMED"
    );

    if (activePayments.length === 0) {
      return {cancelations: []};
    }

    // Map promises of cancellations
    const cancellationPromises = activePayments.map(async (payment) => {
      const cancelationReqest = tbankService.paymentToCancelRequest(payment);

      // Call cancelPayment
      logger.debug("Sending canceling request: ", cancelationReqest);

      return tbankService.cancelPayment(cancelationReqest);
    });

    // Wait for all promises to finish
    const cancelations = await Promise.all(cancellationPromises);

    // Check if any cancellations failed
    const failedResults = cancelations.filter((result) => !result.Success);
    logger.debug("failedResults: ", failedResults);
    failedResults.forEach((r) => error(`Cancellation of Payment ${r.PaymentId} for order ${r.OrderId} failed. Error : ${r.ErrorCode}. Message: ${r.Message} `));

    return {cancelations};
  }
}

export default OrderCancelledProcessor;
