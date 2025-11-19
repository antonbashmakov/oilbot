interface FirebaseApp {
    firestore(): any;
}
interface Entity {
    id: string;
    createdAt?: Date;
    owner?: {
        id: string;
    };
}
declare abstract class AbstractService {
    protected firebase: FirebaseApp;
    constructor(firebase: FirebaseApp);
    find(id: string): Promise<any>;
    update(entity: Entity, object: any): Promise<any>;
    findAll(): Promise<any[]>;
    addAll(objects: any[]): void;
    setAll(objects: any[]): void;
    addForOwner(user: {
        id: string;
    }, object: any): Promise<any>;
    fetchForOwner(owner: {
        id: string;
    }): Promise<any[]>;
    add(object: any): Promise<any>;
    set(object: any): Promise<any>;
    delete(object: Entity): Promise<any>;
    getCollection(): any;
    getCollectionByName(collection: string): any;
    abstract getCollectionName(): string;
    getExcludedFields(): string[];
}
export { AbstractService };
//# sourceMappingURL=AbstractService.d.ts.map