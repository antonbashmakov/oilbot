import {FieldValue, Firestore} from "firebase-admin/firestore";
import {jsonify} from "./utils";

// Interface for entities that have an ID
interface Entity {
  id: string;
  created_at?: Date | string;
  owner?: { id: string | number };
}

type IdOf<T extends Entity> = T["id"];

// Simplified Firebase Admin SDK interface
/*
export interface Firestore {
  firestore(): any;
}
*/

abstract class AbstractService<T extends Entity> {
  protected db: Firestore;

  constructor(firebase: Firestore) {
    this.db = firebase;
  }

  find(id: IdOf<T>): Promise<T | undefined> {
    return this.getCollection().doc(`${id}`).get().then((doc: any) => this.toPOJO(doc.id as IdOf<T>, doc.data()));
  }

  require(id: IdOf<T>): Promise<T> {
    return this.getCollection().doc(`${id}`).get().then((doc) => {
      if (!doc.exists) throw new Error(`Object ${this.getCollectionName()}/${id} is not found`);
      return doc;
    }).then((doc: any) => this.toPOJO(doc.id as IdOf<T>, doc.data()) as T);
  }

  update(entity: T, object: Partial<T>): Promise<any> {
    return this.getCollection().doc(entity.id).update(object);
  }

  findAll(): Promise<T[]> {
    return this.getCollection().get().then((result: any) => result.docs.map((doc: any) => this.toPOJO(doc.id as IdOf<T>, doc.data())));
  }

  addAll(objects: T[]): void {
    objects.forEach((object) => this.add(object));
  }

  incrementField(object: T, field: string, value: number): Promise<FirebaseFirestore.WriteResult> {
    const keys = Object.keys(object);

    if (!keys.includes(field)) throw Error(`Field ${field} is not in object type. Known fields are : ${keys.join()}`);

    const ref = this.getCollection().doc(object.id);

    return ref.update({[field]: FieldValue.increment(value)});
  }

  setAll(objects: T[]): void {
    objects.forEach((object) => this.set(object));
  }

  addForOwner(user: { id: string }, object: T): Promise<T> {
    const objectWithOwner = {...object, owner: {id: user.id}} as T;
    return this.add(objectWithOwner);
  }

  fetchForOwner(owner: { id: string }): Promise<T[]> {
    return this.getCollection().where("owner.id", "in", [owner.id, Number(owner.id)]) // have to do this because owner.id was numeric in some older records
      .get().then((result: any) => result.docs.map((doc: any) => this.toPOJO(doc.id, doc.data())));
  }

  add(object: T): Promise<T> {
    object.created_at = new Date();

    const fields = this.getExcludedFields();

    const fieldsToSave: Record<string, any> = {};

    fields.forEach((field) => {
      const value = object[field as keyof T];
      if (value !== undefined) {
        fieldsToSave[field] = value;
      }
    });

    const objectToSave = Object.assign(jsonify(object), fieldsToSave);

    const ref = this.getCollection().doc();
    objectToSave.id = ref.id;

    return ref.set(objectToSave).then(() => objectToSave as T);
  }

  set(object: T): Promise<any> {
    const fields = this.getExcludedFields();

    const fieldsToSave: Record<string, any> = {};

    fields.forEach((field) => {
      const value = object[field as keyof T];
      if (value !== undefined) {
        fieldsToSave[field] = value;
      }
    });

    const objectToSet = Object.assign(jsonify(object), fieldsToSave);

    return this.getCollection().doc(objectToSet.id).set(objectToSet);
  }

  delete(object: T): Promise<any> {
    return this.db.collection(this.getCollectionName()).doc(object.id).delete();
  }

  updateTransactionally(entity: T, object: Partial<T>): Promise<any> {
    return this.runTransactionally(async (transaction: any) => {
      const docRef = this.getCollection().doc(`${entity.id}`);
      transaction.update(docRef, object);
    });
  }
  deleteTransactionally(entities: T[]): Promise<any> {
    return this.runTransactionally(async (transaction: any) => {
      entities.forEach((entity) => {
        const docRef = this.getCollection().doc(`${entity.id}`);
        transaction.delete(docRef);
      });
    });
  }

  runTransactionally<T>(method: (transaction: any) => Promise<T>): Promise<T> {
    return this.db.runTransaction(method);
  }
  getCollection() {
    return this.db.collection(this.getCollectionName());
  }

  getCollectionByName(collection: string) {
    return this.db.collection(collection);
  }

  toPOJO(id: any, o: any): T | undefined {
    if (!o) return;

    const ret = {...o, id: `${id}`} as T; // convert all ids to string

    if (o.created_at) {
      ret.created_at = o.created_at.toDate();
    }


    return ret;
  }
  abstract getCollectionName(): string;
  abstract getExcludedFields(): string[];
}

export default AbstractService;
