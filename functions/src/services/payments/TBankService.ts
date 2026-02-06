import axios from "axios";
import * as dotenv from "dotenv";
import * as functions from "firebase-functions";
import * as crypto from "crypto";
import * as moment from "moment";

import {TINKOFF_SUPPORT} from "../../constants";

import {Bank, Order, Payment, Subscription, TinkoffBanksListRequest, TinkoffChargeRequest, TinkoffPaymentCancelationRequest, TinkoffPaymentItem, TinkoffPaymentPayload, TinkoffReceipt, TinkoffResult, TinkoffSbpPaymentRequest, } from "../../models";
dotenv.config();

const terminal = process.env.TINKOFF_TERMINAL_ID || functions.config().tinkoff.TINKOFF_TERMINAL_ID;
const password = process.env.TINKOFF_TERMINAL_PASSWORD || functions.config().tinkoff.TINKOFF_TERMINAL_PASSWORD;

class TBankService {
  orderToPaymentRequest(order: Order): TinkoffPaymentPayload {
    const Items: TinkoffPaymentItem[] = order.items.map((i) => ({
      Name: i.name,
      Price: i.price * 100,
      Quantity: 1,
      Amount: i.price * 100,
      Tax: "vat0",
    }));

    const Receipt: TinkoffReceipt = {
      ...TINKOFF_SUPPORT,
      Items,
    };

    const redirectDueDate = moment().add(1, "month");
    const RedirectDueDate = redirectDueDate.format("YYYY-MM-DDTHH:mm:ssZ");

    const body = {
      Token: "",
      TerminalKey: terminal,
      Amount: order.total * 100,
      OrderId: order.id,
      Description: "Оплата заказа в магазине По Себестоимости",
      DATA: {
        Phone: process.env.SUPPORT_PHONE,
        Email: process.env.SUPPORT_EMAIL,
        OrderType: "ORDER",
      },
      Receipt,
      RedirectDueDate,
    };

    const rootFields = {...body, Password: password} as any;

    delete rootFields.DATA;
    delete rootFields.Receipt;

    body.Token = this.generateToken(rootFields);

    return body;
  }
  subscriptionToInitCardPaymentRequest(subscription: Subscription, isRecurrentPayment = false): TinkoffPaymentPayload {
    const to = moment(subscription.next_payment_at);
    const from = to.add(-1, "month");

    const Items: TinkoffPaymentItem[] = [{
      Name: `Подписка По Себестоимости за период ${from.format("DD.MM.YYYY")} - ${to.format("DD.MM.YYYY")}`,
      Price: subscription.fee * 100,
      Quantity: 1,
      Amount: subscription.fee * 100,
      Tax: "vat0",
    }];

    const Receipt: TinkoffReceipt = {
      ...TINKOFF_SUPPORT,
      Items,
    };

    const redirectDueDate = moment().add(1, "month");
    const RedirectDueDate = redirectDueDate.format("YYYY-MM-DDTHH:mm:ssZ");

    const now = new Date();

    const body = {
      Token: "",
      Recurrent: "Y",
      CustomerKey: subscription.id,
      OperationInitiatorType: !isRecurrentPayment ? "1" : "R",
      TerminalKey: terminal,
      Amount: subscription.fee * 100,
      OrderId: `${subscription.id}-${now.getFullYear()}-${now.getMonth()}-${now.getDay()}-${crypto.randomUUID().substring(0, 5)}`,
      Description: "Оплата подписки в магазине По Себестоимости",
      DATA: {
        Phone: process.env.SUPPORT_PHONE,
        Email: process.env.SUPPORT_EMAIL,
        OrderType: "SUBSCRIPTION",
        SubscriptionId: subscription.id,
      },
      Receipt,
      RedirectDueDate,
    };

    const rootFields = {...body, Password: password} as any;

    delete rootFields.DATA;
    delete rootFields.Receipt;

    body.Token = this.generateToken(rootFields);

    return body;
  }
  subscriptionToInitQRPaymentRequest(subscription: Subscription): TinkoffPaymentPayload {

    const body = this.subscriptionToPayment(subscription);

    const qrBody: any = {...body};

    qrBody.OperationInitiatorType;
    qrBody.DATA.QR = "true";

    const rootFields = {...qrBody, Password: password} as any;

    delete rootFields.DATA;
    delete rootFields.Receipt;


    qrBody.Token = this.generateToken(rootFields);

    functions.logger.info("Generating token for QR payment with fields", qrBody);


    return qrBody;
  }

  paymentToQRRequest(paymentId: string): TinkoffSbpPaymentRequest {
    const body = {
      Token: "",
      TerminalKey: terminal,
      PaymentId: paymentId,
    };
    const rootFields = {...body, Password: password} as any;

    body.Token = this.generateToken(rootFields);

    return body;

  }

  paymentToCancelRequest(payment: Payment): TinkoffPaymentCancelationRequest {
    const body = {
      Token: "",
      TerminalKey: terminal,
      PaymentId: payment.external_id,
    };

    const rootFields = {...body, Password: password} as any;

    body.Token = this.generateToken(rootFields);

    return body;
  }
  paymentToChargeRequest(payment: Payment, rebillId: string): TinkoffChargeRequest {
    const body = {
      Token: "",
      TerminalKey: payment.terminal_key,
      PaymentId: payment.external_id,
      RebillId: rebillId,
    };

    const rootFields = {...body, Password: password} as any;

    body.Token = this.generateToken(rootFields);

    return body;
  }
  createBanksListRequest(type: "mobile" | "desktop"): TinkoffBanksListRequest {
    const body = {
      Token: "",
      
      TerminalKey: terminal,
      Device: { Type: type},
    };

    const rootFields = {...body, Password: password} as any;

    delete rootFields.Device;

    body.Token = this.generateToken(rootFields);

    return body;
  }

  async initPayment(paymentRequest: TinkoffPaymentPayload): Promise<TinkoffResult> {
    const response = await axios.post("https://securepay.tinkoff.ru/v2/Init", paymentRequest, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }
  async cancelPayment(paymentRequest: TinkoffPaymentCancelationRequest): Promise<TinkoffResult> {
    const response = await axios.post("https://securepay.tinkoff.ru/v2/Cancel", paymentRequest, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }



  async requestQR(qrRequest: TinkoffSbpPaymentRequest): Promise<TinkoffResult> {
    const response = await axios.post("https://securepay.tinkoff.ru/v2/GetQr", qrRequest, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }
  async charge(chargeRequest: TinkoffChargeRequest): Promise<TinkoffResult> {
    const response = await axios.post("https://securepay.tinkoff.ru/v2/Charge", chargeRequest, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }
  async banksList(request: TinkoffBanksListRequest): Promise<Bank[]> {
    const response = await axios.post("https://securepay.tinkoff.ru/v2/GetQrBankList", request, {
      headers: {
        "Content-Type": "application/json",
      },
    });
    return response.data;
  }

  generateToken(object: any): string {
    const sortedValues = Object.keys(object).sort().map((k) => object[k]).join("");
    return crypto.createHash("sha256").update(sortedValues).digest("hex");
  }

  private subscriptionToPayment(subscription: Subscription) {
    const to = moment(subscription.next_payment_at);
    const from = moment(subscription.next_payment_at).add(-1, "month");

    const Items: TinkoffPaymentItem[] = [{
      Name: `Подписка По Себестоимости за период ${from.format("DD.MM.YYYY")} - ${to.format("DD.MM.YYYY")}`,
      Price: subscription.fee * 100,
      Quantity: 1,
      Amount: subscription.fee * 100,
      Tax: "vat0",
    }];

    const Receipt: TinkoffReceipt = {
      ...TINKOFF_SUPPORT,
      Items,
    };

    const redirectDueDate = moment().add(1, "month");
    const RedirectDueDate = redirectDueDate.format("YYYY-MM-DDTHH:mm:ssZ");

    const now = new Date();

    return {
      Token: "",
      Recurrent: "Y",
      CustomerKey: subscription.id,
      TerminalKey: terminal,
      OperationInitiatorType: "1",
      Amount: subscription.fee * 100,
      OrderId: `${subscription.id}-${now.getFullYear()}-${now.getMonth()}-${now.getDay()}-${crypto.randomUUID().substring(0, 5)}`,
      Description: "Оплата подписки в магазине По Себестоимости",
      DATA: {
        Phone: process.env.SUPPORT_PHONE,
        Email: process.env.SUPPORT_EMAIL,
        OrderType: "SUBSCRIPTION",
        SubscriptionId: subscription.id,
      },
      Receipt,
      RedirectDueDate,
    };    
  }
}

export default TBankService;
