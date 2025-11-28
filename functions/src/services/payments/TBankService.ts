import axios from 'axios';
import * as dotenv from 'dotenv';
import * as functions from 'firebase-functions';

import { Order, TinkoffPaymentItem, TinkoffPaymentPayload, TinkoffReceipt } from '../../models';
dotenv.config();

const terminal = process.env.TINKOFF_TERMINAL_ID || functions.config().tinkoff.TINKOFF_TERMINAL_ID;
const password = process.env.TINKOFF_TERMINAL_PASSWORD || functions.config().tinkoff.TINKOFF_TERMINAL_PASSWORD;

class TBankService {

  orderToPaymentRequest(order: Order): TinkoffPaymentPayload {

    const Items: TinkoffPaymentItem[] = order.items.map(i => ({
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

    const body = {
      Token: '',
      TerminalKey: terminal,
      Amount: order.total * 100,
      OrderId: order.id,
      Description: "Оплата заказа в магазине По Себестоимости",
      DATA: {
        Phone: process.env.SUPPORT_PHONE,
        Email: process.env.SUPPORT_EMAIL,
      },
      Receipt,
    };

    const rootFields = { ...body, Password: password } as any;

    delete rootFields.DATA;
    delete rootFields.Receipt;

    body.Token = this.generateToken(rootFields);

    return body;
  }

  async initPayment(paymentRequest: TinkoffPaymentPayload) {


    if (process.env.IS_TEST) {
      return {
        TerminalKey: "MOCK_TERMINAL",
        Success: true,
        Status: 'NEW',
        ErrorCode: 0,
        PaymentId: "external-mock-id",
        OrderId: paymentRequest.OrderId,
        Amount: paymentRequest.Amount,
        Token: "mock-token",
        PaymentURL: `https://securepay.tinkoff.ru/${paymentRequest.OrderId}`
      }
    }

    const response = await axios.post("https://securepay.tinkoff.ru/v2/Init", paymentRequest, {
      headers: {
        'Content-Type': 'application/json'
      }
    });
    return response.data;
  }

  generateToken(object: any): string {
    const sortedValues = Object.keys(object).sort().map(k => object[k]).join('');

    const crypto = require('crypto');
    return crypto.createHash('sha256').update(sortedValues).digest('hex');

  }
}

export default TBankService;
