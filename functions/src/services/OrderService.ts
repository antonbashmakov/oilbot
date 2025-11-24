import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';
import { Order, Customer, CartItem, Delivery } from '../models/models';

class OrderService extends AbstractService<Order> {
    constructor(firebase: any) {
        super(firebase);
    }

    findOrders(delivery: Delivery): Promise<Order[]> {
        return this.getCollection().where('delivery.id', '==', delivery.id)
            .get().then((result: any) => result.docs.map((doc: any) => this.toPOJO(doc.id, doc.data()) as Order));
    }

    async createOrderFromCart(customer: Customer, cartItems: CartItem[]): Promise<Order> {

        const orderRef = this.getCollection().doc();

        const order: Order = {
            id: orderRef.id,
            name: customer.first_name,
            orderDate: new Date().toISOString(),
            items: cartItems,
            status: 'PENDING',
            numberOfItems: cartItems.length,
            total: cartItems.reduce((acc, item) => acc + item.price * item.quantity, 0),
            owner: {
                id: customer.id,
            }
        };

        const batch = this.firebase.firestore().batch();
        batch.set(orderRef, order);

        cartItems.forEach(item => {
            const itemRef = this.getCollectionByName(COLLECTIONS.CART_ITEMS).doc(item.id);
            batch.delete(itemRef);
        });

        await batch.commit();
        return order;
    }

    getCollectionName(): string { return COLLECTIONS.ORDERS; }
    getExcludedFields(): string[] { return ['createdAt']; }
}

export default OrderService;
