import {components} from "../openapi/api";
import {components as models} from "../openapi/models";

export type DeliveryOverview = components["schemas"]["DeliveryOverview"];
export type Stats = components["schemas"]["Stats"];
export type Order = components["schemas"]["Order"];
export type Delivery = components["schemas"]["Delivery"];
export type Customer = components["schemas"]["Customer"];
export type Item = components["schemas"]["Item"];
export type CartItem = components["schemas"]["CartItem"];
export type PickingItem = components["schemas"]["PickingItem"];
type BaseOrderPicking = components["schemas"]["OrderPicking"];
type BasePayment = components["schemas"]["Payment"];
type BaseCustomerBalance = components["schemas"]["CustomerBalance"];
type BaseCustomerOverview = components["schemas"]["CustomerOverview"];
type BaseUser = components["schemas"]["User"];

export type TinkoffPaymentPayload = models["schemas"]["TinkoffPaymentPayload"];
export type TinkoffPaymentCancelationRequest = models["schemas"]["TinkoffPaymentCancelationRequest"];
export type TinkoffReceipt = models["schemas"]["TinkoffReceipt"];
export type TinkoffPaymentItem = models["schemas"]["TinkoffPaymentItem"];
export type TinkoffResult = models["schemas"]["TinkoffResult"];

export type BaseOutboxEvent = models["schemas"]["BaseOutboxEvent"];
export type BaseConversationMessage = components["schemas"]["ConversationMessage"];

export type Payment = Omit<BasePayment, "created_at" | "updated_at" > & {
  created_at: Date;
  updated_at: Date;
  confirmed_at?: Date;
};
export type CustomerBalance = Omit<BaseCustomerBalance, "created_at" | "updated_at" > & {
  created_at: Date;
  updated_at: Date;
};
export type CustomerOverview = Omit<BaseCustomerOverview, "balance" > & {
  balance: CustomerBalance;
};
export type OrderPicking = Omit<BaseOrderPicking, "created_at" > & {
  created_at: Date;
};
export type OutboxEvent = Omit<BaseOutboxEvent, "created_at" | "processedAt"> & {
  created_at: Date;
  processed_at?: Date;
  payload?: { [key: string]: any };
};
export type ConversationMessage = Omit<BaseConversationMessage, "created_at"> & {
  created_at: Date;
};
export type User = Omit<BaseUser, "created_at"> & {
  created_at: Date;
};

export type OrderResolvedEvent = OutboxEvent & {
  payload: {
    order_id: string;
  }
};
export type OrderCancelledEvent = OutboxEvent & {
  payload: {
    order_id: string;
  }
};
export type OrderConciliatedEvent = OutboxEvent & {
  payload: {
    order_id: string;
  }
};
export type BalanceChangedEvent = OutboxEvent & {
  payload: {
    customer_id: string;
    change: number;
  }
};
export type PaymentCreatedEvent = OutboxEvent & {
  payload: {
    payment_id: string;
  }
};

export type OrderPaymentConfirmedEvent = OutboxEvent & {
  payload: {
    order_id: string;
    external_id: string;
  }
};

export type OrderPaymentFailedEvent = OutboxEvent & {
  payload: {
    order_id: string;
    external_id: number;
    status: string;
  }
};

export interface IdempotentObject<T = any> {
  id: string;
  created_at: Date;
  data: T;
}

