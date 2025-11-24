import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';
import { CartItem, Item, Customer } from '../models/models';

class CartItemService extends AbstractService<CartItem> {
    constructor(firebase: any) {
        super(firebase);
    }

    async addToCart(item: Item, customer: Customer): Promise<CartItem> {
        const cartItem: CartItem = {
            id: '',  // Will be set in add()
            item_id: item.id,
            name: item.name,
            price: item.price_out,
            quantity: 1,
            fraction: item.fraction,
            group: item.group,
            owner: {
                id: customer.id,
            }
        };
        return this.add(cartItem);
    }

    getCollectionName(): string { return COLLECTIONS.CART_ITEMS; }
    getExcludedFields(): string[] { return ['createdAt']; }
}

export default CartItemService;
