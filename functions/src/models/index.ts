import { components } from "../openapi/api";
import { components as models } from "../openapi/models";
import User from "./User";

export type DeliveryOverview = components["schemas"]["DeliveryOverview"];
export type Stats = components["schemas"]["Stats"];
export type Order = components["schemas"]["Order"];
export type BaseOrderPicking = components["schemas"]["OrderPicking"];
export type Delivery = components["schemas"]["Delivery"];
export type Customer = components["schemas"]["Customer"];
export type Item = components["schemas"]["Item"];
export type CartItem = components["schemas"]["CartItem"];
export type PickingItem = components["schemas"]["PickingItem"];

export type TinkoffPaymentPayload = models["schemas"]["TinkoffPaymentPayload"];
export type TinkoffReceipt = models["schemas"]["TinkoffReceipt"];
export type TinkoffPaymentItem = models["schemas"]["TinkoffPaymentItem"];

export type BaseOutboxEvent = models["schemas"]["BaseOutboxEvent"];

export type OrderPicking = Omit<BaseOrderPicking, "createdAt" > &  {
  createdAt: Date;
};
export type OutboxEvent = Omit<BaseOutboxEvent, "createdAt" | "processedAt"> &  {
  createdAt: Date;
  processedAt?: Date;
  payload?: { [key: string]: any };
};

export type OrderResolvedEvent = OutboxEvent & {
  payload: {
    orderId: string;
  }
};

export interface IdempotentObject<T = any> {
  id: string;
  createdAt: Date;
  data: T;
}


export { User };

