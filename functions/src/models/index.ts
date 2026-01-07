import {components} from "../openapi/api";
import {components as models} from "../openapi/models";

export type Customer = components["schemas"]["Customer"];
export type CustomerStats = components["schemas"]["CustomerStats"];
export type CustomerAccounting = components["schemas"]["CustomerAccounting"];
export type Item = components["schemas"]["Item"];
export type PickingItem = components["schemas"]["PickingItem"];
export type AddToCartItem = components["schemas"]["AddToCartItem"];
export type RemoveFromCartItem = components["schemas"]["RemoveFromCartItem"];

export type BaseSubscription = components["schemas"]["Subscription"];
type BaseDeliveryOverviewItemStats = components["schemas"]["DeliveryOverviewItemStats"];
type BaseStats = components["schemas"]["Stats"];
type BaseDeliveryOverview = components["schemas"]["DeliveryOverview"];
type BaseDeliveryAgentOverview = components["schemas"]["DeliveryAgentOverview"];
type BaseOrder = components["schemas"]["Order"];
type BaseItemOverview = components["schemas"]["ItemOverview"];
type BaseDelivery = components["schemas"]["Delivery"];
type BaseDeliveryRef = components["schemas"]["DeliveryRef"];
type BaseCartItem = components["schemas"]["CartItem"];
type BaseOrderPicking = components["schemas"]["OrderPicking"];
type BasePayment = components["schemas"]["Payment"];
type BaseCustomerBalance = components["schemas"]["CustomerBalance"];
type BaseCustomerOverview = components["schemas"]["CustomerOverview"];
type BaseUser = components["schemas"]["User"];
type BaseComment = components["schemas"]["Comment"];

export type TinkoffPaymentPayload = models["schemas"]["TinkoffPaymentPayload"];
export type TinkoffPaymentCancelationRequest = models["schemas"]["TinkoffPaymentCancelationRequest"];
export type TinkoffReceipt = models["schemas"]["TinkoffReceipt"];
export type TinkoffPaymentItem = models["schemas"]["TinkoffPaymentItem"];
export type TinkoffResult = models["schemas"]["TinkoffResult"];


export type BaseOutboxEvent = models["schemas"]["BaseOutboxEvent"];
export type BaseConversationMessage = components["schemas"]["ConversationMessage"];

export type Payment = Omit<BasePayment, "created_at" | "updated_at"> & {
  created_at: Date;
  updated_at: Date;
  confirmed_at?: Date;
};
export type CustomerBalance = Omit<BaseCustomerBalance, "created_at" | "updated_at"> & {
  created_at: Date;
  updated_at: Date;
};
export type CustomerOverview = Omit<BaseCustomerOverview, "balance"> & {
  balance: CustomerBalance;
};
export type OrderPicking = Omit<BaseOrderPicking, "created_at"> & {
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
export type Comment = Omit<BaseComment, "created_at"> & {
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
    rebill_id?: string;
  }
};
export type OrderCreatedEvent = OutboxEvent & {
  payload: {
    order_id: string;
  }
};

export type OrderPaymentFailedEvent = OutboxEvent & {
  payload: {
    order_id: string;
    external_id: number;
    status: string;
  }
};
export type Delivery = BaseDelivery & {
  order_deadline: Date;
  delivery_start: Date;
  delivery_end: Date;
};
export type Subscription = Omit<BaseSubscription, "created_at" | "next_payment_at" | "canceled_at"> & {
  created_at: Date;
  next_payment_at: Date;
  canceled_at?: Date;
};

export type DeliveryRef = BaseDeliveryRef & {
  order_deadline: Date;
  delivery_start: Date;
  delivery_end: Date;
};
export type ItemOverview = BaseItemOverview & {
  deliveries: DeliveryRef[];
};
export type CartItem = Omit<BaseCartItem, "created_at"> & {
  created_at: Date;
};
export type Order = Omit<BaseOrder, "items" | "created_at" | "updated_at"> & {
  items: CartItem[];
  created_at: Date;
  updated_at: Date;
};
export type DeliveryOverviewItemStats = Omit<BaseDeliveryOverviewItemStats, "orders"> & {
  orders: Order[];
};
export type Stats = Omit<BaseStats, "items"> & {
  items?: CartItem[];
};
export type DeliveryAgentOverview = Omit<BaseDeliveryAgentOverview, "pickups" | "deliveries"> & {
  pickups: Order[];
  deliveries: Order[];
};
export type DeliveryOverview = Omit<BaseDeliveryOverview, "stats" | "orders" | "activeOrders" | "cancelledOrders" | "removedOrders"> & {
  orders: Order[];
  activeOrders: Order[];
  cancelledOrders: Order[];
  removedOrders?: Order[];
  stats?: DeliveryOverviewItemStats[];
};

export interface IdempotentObject<T = any> {
  id: string;
  created_at: Date;
  data: T;
}
