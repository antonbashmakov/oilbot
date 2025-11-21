import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';

// Interface for Delivery entity based on the example provided
interface Delivery {
  id: string;
  number: number;
  description: string;
  status: "PENDING" | "IN_TRANSIT" | "IN_TRANSIT_BACK" | "FULFILLED";
  order_deadline: string;
  delivery_start: string;
  delivery_end: string;
  group: string;
  orders: Array<{
    id: string;
    customerName: string;
    orderDate: string;
    status: "PENDING" | "PAID" | "CONSOLIDATED";
    numberOfItems: number;
    totalValue: number;
  }>;
  createdAt?: Date;
  owner?: { id: string };
}

class DeliveryService extends AbstractService<Delivery> {

    constructor(firebase: any) {
        super(firebase);
    }

    findDeliveriesByStatus(status: Delivery['status']): Promise<Delivery[]> {
        return this.getCollection().where('status', '==', status).orderBy('delivery_start', 'desc')
        .get().then((result : any) => result.docs.map((doc: any) => doc.data() as Delivery));  
    }

    getCollectionName(): string { return COLLECTIONS.DELIVERIES; }
    getExcludedFields(): string[] { return ['createdAt']; }
}

export default DeliveryService;
