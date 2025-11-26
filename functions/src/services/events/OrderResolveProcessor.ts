import { OrderResolvedEvent } from "../../models";
import OrderService from "../OrderService";
import TBankService from "../payments/TBankService";
import AbstractProcessor from "./AbstractProcessor";

class OrderResolveProcessor extends AbstractProcessor {

  async process(event: OrderResolvedEvent): Promise<void> {
    const orderService = new OrderService(this.firebase);
    const tbankService = new TBankService();

    const order = await orderService.find(event.payload.orderId);

    if (!order) {
      throw new Error(`Order with id ${event.payload.orderId} not found`);
    }

    const paymentRequest = tbankService.orderToPaymentRequest(order);
    const paymentResponse = await tbankService.initPayment(paymentRequest);

    const paymentData = {
      payment_url: paymentResponse.PaymentURL,
      error_code: paymentResponse.ErrorCode,
      payment_id: this.firebase.firestore().collection('PAYMENTS').doc().id,
      external_payment_id: paymentResponse.PaymentId,
      terminal_key: paymentResponse.TerminalKey,
      order_id: paymentResponse.OrderId,
      amount: paymentResponse.Amount,
      success: paymentResponse.Success,
      token: paymentRequest.Token,
      created_at: new Date().toISOString()
    };

    await this.firebase.firestore().collection('PAYMENTS').doc(paymentData.payment_id).set(paymentData);
  }
}

export default OrderResolveProcessor;
