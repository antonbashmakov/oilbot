import OrderResolveProcessor from "./OrderResolveProcessor";
import AbstractProcessor from "./AbstractProcessor";
import { Firestore } from "firebase-admin/firestore";


type ProcessorConstructor = new (firebase: Firestore) => AbstractProcessor;

const EVENT_PROCESSORS: { [key: string]: ProcessorConstructor } = {
  'ORDER_RESOLVE_REQUESTED': OrderResolveProcessor,
};

export const toProcessor: (event: string) => ProcessorConstructor = (event: string) => {
   if(!EVENT_PROCESSORS[event]) throw new Error(`Processor for event ${event} does not exits`);

   return EVENT_PROCESSORS[event]
}