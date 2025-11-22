import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';
import { Delivery } from './DeliveryService';
import { Order } from '../models/models';


class OrderService extends AbstractService<Order> {

    constructor(firebase: any) {
        super(firebase);
    }

    findOrders(delivery: Delivery): Promise<Order[]> {
        return this.getCollection().where('delivery.id', '==', delivery.id)
        .get().then((result : any) => result.docs.map((doc: any) => this.toPOJO(doc.id, doc.data()) as Order));  
    }

    getCollectionName(): string { return COLLECTIONS.ORDERS; }
    getExcludedFields(): string[] { return ['createdAt']; }
}

export default OrderService;
