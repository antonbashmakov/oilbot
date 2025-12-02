import axios from "axios";
import * as dotenv from "dotenv";
import * as functions from "firebase-functions";
import * as crypto from "crypto";
import * as moment from "moment";

import {Order, TinkoffPaymentItem, TinkoffPaymentPayload, TinkoffReceipt} from "../../models";
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
      Email: "info@posebestoimosti.ru",
      Phone: "+79022394130",
      Taxation: "osn",
      Items,
    };

    // Calculate RedirectDueDate: one month ahead from current date
    // Format: YYYY-MM-DDTHH24:MI:SS+GMT
    // Using moment.js to handle date manipulation and formatting
    const redirectDueDate = moment().add(1, 'month');
    
    // Format according to Tinkoff API requirements
    // The format should be like: 2025-12-02T14:30:00+03:00
    // Using format() with specific pattern
    const RedirectDueDate = redirectDueDate.format('YYYY-MM-DDTHH:mm:ssZ');

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

  async initPayment(paymentRequest: TinkoffPaymentPayload) {

    const response = await axios.post("https://securepay.tinkoff.ru/v2/Init", paymentRequest, {
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
