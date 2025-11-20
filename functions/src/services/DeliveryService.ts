import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';

// Interface for Delivery entity based on the example provided
interface Delivery {
  id: string;
  delivery_start: Date;
  delivery_end: Date;
  description: string;
  fulfilled: boolean;
  group: string;
  number: number;
  createdAt?: Date;
  status: 'PENDING' | 'IN_TRANSIT' | 'FULFILLED' | 'CANCELLED';
  owner?: { id: string };
}

class DeliveryService extends AbstractService<Delivery> {

    constructor(firebase: any) {
        super(firebase);
    }

    findDeliveriesByStatus(status: Delivery['status']): Promise<Delivery[]> {
        return this.getCollection().where('status', '==', status).orderBy('delivery_start', 'desc')
        .get().then((result : any) => result.docs.length ?  result.docs[0].data().message : null);  
    }

    getCollectionName(): string { return COLLECTIONS.DELIVERIES; }
    getExcludedFields(): string[] { return ['createdAt']; }
}

export default DeliveryService;
