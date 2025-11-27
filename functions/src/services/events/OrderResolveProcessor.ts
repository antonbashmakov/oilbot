import { OrderResolvedEvent, Payment } from "../../models";
import OrderService from "../OrderService";
import TBankService from "../payments/TBankService";
import PaymentService from "../PaymentService";
import AbstractProcessor from "./AbstractProcessor";

class OrderResolveProcessor extends AbstractProcessor {

  async process(event: OrderResolvedEvent): Promise<void> {
    const orderService = new OrderService(this.db);
    const tbankService = new TBankService();

    const order = await orderService.find(event.payload.order_id);

    if (!order) {
      throw new Error(`Order with id ${event.payload.orderId} not found`);
    }

    const paymentRequest = tbankService.orderToPaymentRequest(order);

    
    const paymentResponse = await tbankService.initPayment(paymentRequest);
    
    const paymentData: Payment = {
      payment_url: paymentResponse.PaymentURL,
      error_code: paymentResponse.ErrorCode,
      id: '',
      external_payment_id: paymentResponse.PaymentId,
      terminal_key: paymentResponse.TerminalKey,
      order_id: paymentResponse.OrderId,
      amount: paymentResponse.Amount,
      success: paymentResponse.Success,
      created_at: new Date()
    };

    const paymentService = new PaymentService(this.db);


    console.log('ADDIng ===========', paymentData)
    await paymentService.add(paymentData);
  }
}

export default OrderResolveProcessor;
