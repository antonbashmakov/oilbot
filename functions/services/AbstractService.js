
import {jsonify} from './utils.js';

class AbstractService {
  constructor(firebase) {
    this.firebase = firebase;
  }

  find(id) {
    return this.getCollection().doc(id).get().then(doc => doc.data());
  }

  update(entity, object) {
    return this.getCollection().doc(entity.id).update(object);
  }

  findAll() {
    return this.getCollection().get().then(result => result.docs.map(doc => doc.data()));
  }

  addAll(objects) {
    objects.forEach(object => this.add(object));
  }
  setAll(objects) {
    objects.forEach(object => this.set(object));
  }

  addForOwner(user, object) {
    object.owner = { id: user.id };
    return this.add(object);
  }

  fetchForOwner(owner) {
    return this.getCollection().where('owner.id', '==', owner.id)
      .get().then(result => result.docs.map(doc => doc.data()));
  }

  add(object) {
    object.createdAt = new Date();

    const fields = this.getExcludedFields();

    const fieldsToSave = {};

    fields.forEach(field => fieldsToSave[field] = object[field]);

    const objectToSave = Object.assign(jsonify(object), fieldsToSave);

    const ref = this.getCollection().doc();
    objectToSave.id = ref.id;

    return ref.set(objectToSave).then(() => objectToSave);
  }
  set(object) {
    const objectToSet = JSON.parse(JSON.stringify(object));
    objectToSet.createdAt = new Date();
    return this.getCollection().doc(objectToSet.id).set(objectToSet);
  }

  delete(object) {
    return this.firebase.firestore().collection(this.getCollectionName()).doc(object.id).delete();    
  }

  getCollection() {
    return this.firebase.firestore().collection(this.getCollectionName());
  }
  getCollectionByName(collection) {
    return this.firebase.firestore().collection(collection);
  }

  getCollectionName() { }
  getExcludedFields() { return [] }
}

export default AbstractService;
