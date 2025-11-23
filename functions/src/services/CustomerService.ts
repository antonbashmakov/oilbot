import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';
import { Customer } from '../models/models';


class CustomerService extends AbstractService<Customer> {

    constructor(firebase: any) {
        super(firebase);
    }
    getCollectionName(): string { return COLLECTIONS.CUSTOMERS; }
    getExcludedFields(): string[] { return ['createdAt']; }
}

export default CustomerService;
