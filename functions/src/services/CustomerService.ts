import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';
import { Customer } from '../models';


class CustomerService extends AbstractService<Customer> {

    getCollectionName(): string { return COLLECTIONS.CUSTOMERS; }
    getExcludedFields(): string[] { return ['createdAt']; }
}

export default CustomerService;
