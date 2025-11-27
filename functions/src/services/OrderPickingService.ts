import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';
import { OrderPicking } from '../models';


class OrderPickingService extends AbstractService<OrderPicking> {

    async updateItems(id: string, items: OrderPicking['items']): Promise<OrderPicking> {
        const collection = this.getCollection();

        const docRef = collection.doc(id);

        // Use transaction for atomic update
        const updatedPicking = await this.db.runTransaction(async (transaction: any) => {
            // Get the current document
            const docSnapshot = await transaction.get(docRef);

            if (!docSnapshot.exists) {
                throw new Error('Order picking not found');
            }

            const currentData = docSnapshot.data() as OrderPicking;

            const updatedItems = items.map(item => {
                const i = {...item};
                i.price = Math.floor(i.price_for_unit * i.quantity * i.fraction);
                return i;
            });
            // Calculate the new total based on collected items and their new prices
            const total = updatedItems.filter(i => i.status === 'COLLECTED').reduce((a, b) => a + b.price, 0);

            // Update only the items field
            transaction.update(docRef, { items: updatedItems, total });

            // Return the updated document data
            return { ...currentData, items };
        });

        return updatedPicking;
    }

    async toggleOrderItemCollection(pickingId: string, itemId: string): Promise<void> {

        const collection = this.getCollection();
        const docRef = collection.doc(pickingId);


        // Use transaction for atomic update
        await this.db.runTransaction(async (transaction: any) => {
            // Get the current document
            const docSnapshot = await transaction.get(docRef);

            if (!docSnapshot.exists) {
                throw new Error('Order picking not found');
            }

            const picking = docSnapshot.data() as OrderPicking;
            const itemIndex = picking!.items.findIndex((item: any) => item.id === itemId);

            if (itemIndex === -1) {
                throw new Error('Item not found in order picking');
            }

            picking.items[itemIndex].status = picking.items[itemIndex].status === 'COLLECTED' ? 'PENDING' : 'COLLECTED';

            const total = picking.items.filter(i => i.status === 'COLLECTED').reduce((a, b) => a + b.price, 0);

            transaction.update(docRef, { items: picking.items, total: total });

        });

    }

    async findOrCreateFromOrder(orderId: string, order: any): Promise<OrderPicking> {
        // First check if picking already exists
        const existingPicking = await this.find(orderId);

        if (existingPicking) {
            return existingPicking;
        }

        // Convert order items to picking items
        const pickingItems = order.items.map((item: any) => ({
            ...item,
            status: 'PENDING' as const
        }));

        // Initial total is 0, will be updated as items are collected
        const total = 0;

        // Create new picking from order
        const newPicking: OrderPicking = {
            id: orderId,
            created_at: new Date,
            delivery: { ...order.delivery },
            items: pickingItems,
            owner: order.owner,
            status: 'PENDING',
            total,
            type: 'ORIGINAL' // redundant but keeps type consistent
        };

        // Save the new picking
        await this.set(newPicking);

        return newPicking;
    }

    getCollectionName(): string { return COLLECTIONS.PICKINGS; }
    getExcludedFields(): string[] { return ['created_at']; }
}

export default OrderPickingService;
