import OrderResolveProcessor from "./OrderResolveProcessor";
import OrderPaymentCreatedProcessor from "./OrderPaymentCreatedProcessor";
import BalanceChangedProcessor from "./BalanceChangedProcessor";
import OrderPaymentConfirmedProcessor from "./OrderPaymentConfirmedProcessor";
import AbstractProcessor from "./AbstractProcessor";
import {Firestore} from "firebase-admin/firestore";
import {CONSTANTS} from "../../controllers/admin/imports";


type ProcessorConstructor = new (firebase: Firestore) => AbstractProcessor;

const EVENT_PROCESSORS: { [key: string]: ProcessorConstructor } = {
  [CONSTANTS.EVENTS.ORDER_RESOLVED]: OrderResolveProcessor,
  [CONSTANTS.EVENTS.ORDER_PAYMENT_CREATED]: OrderPaymentCreatedProcessor,
  [CONSTANTS.EVENTS.BALANCE_CHANGED]: BalanceChangedProcessor,
  [CONSTANTS.EVENTS.ORDER_PAYMENT_CONFIRMED]: OrderPaymentConfirmedProcessor,
};

export const toProcessor: (event: string) => ProcessorConstructor = (event: string) => {
  if (!EVENT_PROCESSORS[event]) throw new Error(`Processor for event ${event} does not exits`);

  return EVENT_PROCESSORS[event];
};
