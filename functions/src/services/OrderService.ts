import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';
import { Delivery } from './DeliveryService';

// Interface for Order entity based on the example provided
export interface Order {
  id: string;
  delivery: {
    id: string;
  };
  items: Array<{
    fraction: number;
    group: string;
    id: string;
    name: string;
    owner: {
      id: number;
      price: number;
      quantity: number;
    };
    status: "PENDING" | "PAID" | "CONSOLIDATED" | "FULFILLED";
    total: number;
  }>;
  owner?: { id: string };
}

class OrderService extends AbstractService<Order> {

    constructor(firebase: any) {
        super(firebase);
    }

    findOrders(delivery: Delivery): Promise<Order[]> {
        return this.getCollection().where('delivery.id', '==', delivery.id)
        .get().then((result : any) => result.docs.map((doc: any) => doc.data() as Order));  
    }

    getCollectionName(): string { return COLLECTIONS.ORDERS; }
    getExcludedFields(): string[] { return ['createdAt']; }
}

export default OrderService;
