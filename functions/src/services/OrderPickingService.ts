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

    getCollectionName(): string { return COLLECTIONS.PICKINGS; }
    getExcludedFields(): string[] { return ['createdAt']; }
}

export default OrderPickingService;
