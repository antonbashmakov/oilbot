import {components} from "../openapi/api";
import {components as models} from "../openapi/models";
import User from "./User";

export type DeliveryOverview = components["schemas"]["DeliveryOverview"];
export type Stats = components["schemas"]["Stats"];
export type Order = components["schemas"]["Order"];
export type OrderPicking = components["schemas"]["OrderPicking"];
export type Delivery = components["schemas"]["Delivery"];
export type Customer = components["schemas"]["Customer"];
export type Item = components["schemas"]["Item"];
export type CartItem = components["schemas"]["CartItem"];
export type PickingItem = components["schemas"]["PickingItem"];

export type OutboxEvent = models["schemas"]["OutboxEvent"];
export { User };
