import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';
import { OrderPicking } from '../models/models';


class OrderPickingService extends AbstractService<OrderPicking> {

    constructor(firebase: any) {
        super(firebase);
    }
    getCollectionName(): string { return COLLECTIONS.PICKINGS; }
    getExcludedFields(): string[] { return ['createdAt']; }
}

export default OrderPickingService;
