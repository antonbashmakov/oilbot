import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';
import { Payment } from '../models';


class PaymentService extends AbstractService<Payment> {

    getCollectionName(): string { return COLLECTIONS.PAYMENTS; }
    getExcludedFields(): string[] { return ['created_at']; }
}

export default PaymentService;
