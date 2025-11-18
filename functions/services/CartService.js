
import {COLLECTIONS} from '../constants.js';

import AbstractService from './AbstractService.js';

class CartService  extends AbstractService {
    constructor(firebase) {
        super(firebase);
    }

    getCollectionName() { return COLLECTIONS.CARTS }
    getExcludedFields() { return ['createdAt'] }

}

export default CartService;
