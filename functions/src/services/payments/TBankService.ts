import axios from "axios";
import * as dotenv from "dotenv";
import * as functions from "firebase-functions";
import * as crypto from "crypto";
import * as moment from "moment";

import { TINKOFF_SUPPORT } from "../../constants";

import {Order, Payment, Subscription, TinkoffPaymentCancelationRequest, TinkoffPaymentItem, TinkoffPaymentPayload, TinkoffReceipt, TinkoffResult} from "../../models";
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
  subscriptionToPaymentRequest(subscription: Subscription): TinkoffPaymentPayload {

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

    const body = {
      Token: "",
      Recurrent: "Y", 
      CustomerKey: subscription.id,
      TerminalKey: terminal,
      Amount: subscription.fee * 100,
      OrderId: subscription.id,
      Description: "Оплата подписки в магазине По Себестоимости",
      DATA: {
        Phone: process.env.SUPPORT_PHONE,
        Email: process.env.SUPPORT_EMAIL,
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

  generateToken(object: any): string {
    const sortedValues = Object.keys(object).sort().map((k) => object[k]).join("");
    return crypto.createHash("sha256").update(sortedValues).digest("hex");
  }
}

export default TBankService;
