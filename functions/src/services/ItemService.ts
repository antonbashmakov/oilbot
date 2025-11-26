import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';
import { Item } from '../models';


class ItemService extends AbstractService<Item> {
    constructor(firebase: any) {
        super(firebase);
    }

    findByCategory(category: string): Promise<Item[]> {
        return this.getCollection().where('category', '==', category)
        .get().then((result : any) => result.docs.map((doc: any) => this.toPOJO(doc.id, doc.data()) as Item));  
    }

    getCollectionName(): string { return COLLECTIONS.ITEMS; }
    getExcludedFields(): string[] { return ['createdAt']; }
}

export default ItemService;
