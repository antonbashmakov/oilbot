import { jsonify } from './utils';

// Interface for entities that have an ID
interface Entity {
  id: string | number;
  createdAt?: Date;
  owner?: { id: string | number };
}

type IdOf<T extends Entity> = T["id"];

// Simplified Firebase Admin SDK interface
interface FirebaseAdmin {
  firestore(): any;
}

abstract class AbstractService<T extends Entity> {
  protected firebase: FirebaseAdmin;

  constructor(firebase: FirebaseAdmin) {
    this.firebase = firebase;
  }

  find(id: IdOf<T>): Promise<T | undefined> {
    return this.getCollection().doc(`${id}`).get().then((doc: any) => this.toPOJO(doc.id as IdOf<T>, doc.data()));
  }

  update(entity: T, object: Partial<T>): Promise<any> {
    return this.getCollection().doc(entity.id).update(object);
  }

  findAll(): Promise<T[]> {
    return this.getCollection().get().then((result: any) => result.docs.map((doc: any) => this.toPOJO(doc.id as IdOf<T>, doc.data())));
  }

  addAll(objects: T[]): void {
    objects.forEach(object => this.add(object));
  }

  setAll(objects: T[]): void {
    objects.forEach(object => this.set(object));
  }

  addForOwner(user: { id: string }, object: Omit<T, 'owner'>): Promise<T> {
    const objectWithOwner = { ...object, owner: { id: user.id } } as T;
    return this.add(objectWithOwner);
  }

  fetchForOwner(owner: { id: string }): Promise<T[]> {
    return this.getCollection().where('owner.id', '==', owner.id)
      .get().then((result: any) => result.docs.map((doc: any) => this.toPOJO(doc.id, doc.data())));
  }

  add(object: T): Promise<T> {
    object.createdAt = new Date();

    const fields = this.getExcludedFields();

    const fieldsToSave: Record<string, any> = {};

    fields.forEach(field => fieldsToSave[field] = object[field as keyof T]);

    const objectToSave = Object.assign(jsonify(object), fieldsToSave);

    const ref = this.getCollection().doc();
    objectToSave.id = ref.id;

    return ref.set(objectToSave).then(() => objectToSave as T);
  }

  set(object: T): Promise<any> {
    const objectToSet = JSON.parse(JSON.stringify(object));
    objectToSet.createdAt = new Date();
    return this.getCollection().doc(objectToSet.id).set(objectToSet);
  }

  delete(object: T): Promise<any> {
    return this.firebase.firestore().collection(this.getCollectionName()).doc(object.id).delete();    
  }


  getCollection() {
    return this.firebase.firestore().collection(this.getCollectionName());
  }

  getCollectionByName(collection: string) {
    return this.firebase.firestore().collection(collection);
  }

  toPOJO(id:any, o: any): T | undefined {
    if(!o) return;
    return { id, ...o } as T;
  }
  abstract getCollectionName(): string;
  abstract getExcludedFields(): string[];
}

export default AbstractService;
