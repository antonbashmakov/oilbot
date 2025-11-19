import { jsonify } from './utils';

interface FirebaseApp {
  firestore(): any;
}

interface Entity {
  id: string;
  createdAt?: Date;
  owner?: { id: string };
}

abstract class AbstractService {
  protected firebase: FirebaseApp;

  constructor(firebase: FirebaseApp) {
    this.firebase = firebase;
  }

  find(id: string): Promise<any> {
    return this.getCollection().doc(id).get().then((doc: any) => doc.data());
  }

  update(entity: Entity, object: any): Promise<any> {
    return this.getCollection().doc(entity.id).update(object);
  }

  findAll(): Promise<any[]> {
    return this.getCollection().get().then((result: any) => result.docs.map((doc: any) => doc.data()));
  }

  addAll(objects: any[]): void {
    objects.forEach(object => this.add(object));
  }

  setAll(objects: any[]): void {
    objects.forEach(object => this.set(object));
  }

  addForOwner(user: { id: string }, object: any): Promise<any> {
    object.owner = { id: user.id };
    return this.add(object);
  }

  fetchForOwner(owner: { id: string }): Promise<any[]> {
    return this.getCollection().where('owner.id', '==', owner.id)
      .get().then((result: any) => result.docs.map((doc: any) => doc.data()));
  }

  add(object: any): Promise<any> {
    object.createdAt = new Date();

    const fields = this.getExcludedFields();

    const fieldsToSave: any = {};

    fields.forEach((field: string) => fieldsToSave[field] = object[field]);

    const objectToSave = Object.assign(jsonify(object), fieldsToSave);

    const ref = this.getCollection().doc();
    objectToSave.id = ref.id;

    return ref.set(objectToSave).then(() => objectToSave);
  }

  set(object: any): Promise<any> {
    const objectToSet = JSON.parse(JSON.stringify(object));
    objectToSet.createdAt = new Date();
    return this.getCollection().doc(objectToSet.id).set(objectToSet);
  }

  delete(object: Entity): Promise<any> {
    return this.firebase.firestore().collection(this.getCollectionName()).doc(object.id).delete();    
  }

  getCollection(): any {
    return this.firebase.firestore().collection(this.getCollectionName());
  }

  getCollectionByName(collection: string): any {
    return this.firebase.firestore().collection(collection);
  }

  abstract getCollectionName(): string;
  getExcludedFields(): string[] { return []; }
}
