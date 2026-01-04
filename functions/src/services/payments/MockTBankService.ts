import * as dotenv from "dotenv";

import {TinkoffPaymentCancelationRequest, TinkoffPaymentPayload, TinkoffResult} from "../../models";
import TBankService from "./TBankService";
dotenv.config();


class MockTBankService extends TBankService{

  async initPayment(paymentRequest: TinkoffPaymentPayload): Promise<TinkoffResult> {
    // Mock successful payment initialization
    const mockPaymentId = `mock-payment-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
    
    return {
      Success: true,
      ErrorCode: "0",
      TerminalKey: paymentRequest.TerminalKey || "",
      OrderId: paymentRequest.OrderId,
      Status: "NEW",
      PaymentURL: "https://securepay.tinkoff.ru/p/MOCK_PAYMENT",
      OriginalAmount: paymentRequest.Amount,
      NewAmount: paymentRequest.Amount,
      PaymentId: mockPaymentId,
      Message: "Mock payment initialized successfully",
      Details: "This is a mock response from MockTBankService",
      ExternalRequestId: `ext-req-${Date.now()}`,
    };
  }
  
  async cancelPayment(paymentRequest: TinkoffPaymentCancelationRequest): Promise<TinkoffResult> {
    // Mock successful payment cancellation
    return {
      Success: true,
      ErrorCode: "0",
      TerminalKey: paymentRequest.TerminalKey || "",
      OrderId: "", // Not available in cancel request
      Status: "CANCELED",
      OriginalAmount: 0, // Not available in cancel request
      NewAmount: 0, // Not available in cancel request
      PaymentId: paymentRequest.PaymentId || "",
      Message: "Mock payment cancelled successfully",
      Details: "This is a mock response from MockTBankService",
      ExternalRequestId: `ext-req-${Date.now()}`,
    };
  }

}

export default MockTBankService;
