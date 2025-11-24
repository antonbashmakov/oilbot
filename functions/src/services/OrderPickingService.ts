import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';
import { OrderPicking } from '../models/models';


class OrderPickingService extends AbstractService<OrderPicking> {

    constructor(firebase: any) {
        super(firebase);
    }

    async updateItems(id: string, items: OrderPicking['items']): Promise<OrderPicking> {
        const collection = this.getCollection();
        const docRef = collection.doc(id);
        
        // Use transaction for atomic update
        const updatedPicking = await this.firebase.firestore().runTransaction(async (transaction: any) => {
            // Get the current document
            const docSnapshot = await transaction.get(docRef);
            
            if (!docSnapshot.exists) {
                throw new Error('Order picking not found');
            }
            
            const currentData = docSnapshot.data() as OrderPicking;
            
            // Update only the items field
            transaction.update(docRef, { items });
            
            // Return the updated document data
            return { ...currentData, items };
        });
        
        return updatedPicking;
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
        
        // Calculate total
        const total = order.items.reduce((sum: number, item: any) => {
            return sum + (item.price * item.quantity);
        }, 0);
        
        // Create new picking from order
        const newPicking: OrderPicking = {
            id: orderId,
            delivery: {
                id: order.delivery?.id || '',
                delivery_start: order.delivery?.delivery_start || new Date().toISOString(),
                delivery_end: order.delivery?.delivery_end || new Date().toISOString()
            },
            items: pickingItems,
            owner: order.owner,
            status: 'PENDING',
            total,
            type: 'ORIGINAL'
        };
        
        // Save the new picking
        await this.set(newPicking);
        
        return newPicking;
    }

    getCollectionName(): string { return COLLECTIONS.PICKINGS; }
    getExcludedFields(): string[] { return ['createdAt']; }
}

export default OrderPickingService;
