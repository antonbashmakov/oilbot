import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';

// Interface for Delivery entity based on the example provided
interface Delivery {
  id: string;
  delivery_start: number;
  delivery_end: number;
  description: string;
  fullfiled: boolean;
  group: string;
  number: number;
  createdAt?: Date;
  owner?: { id: string };
}

class DeliveryService extends AbstractService<Delivery> {

    constructor(firebase: any) {
        super(firebase);
    }

    getCollectionName(): string { return COLLECTIONS.DELIVERIES; }
    getExcludedFields(): string[] { return ['createdAt']; }
}

export default DeliveryService;
