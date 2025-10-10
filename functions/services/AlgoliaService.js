import  algoliasearch from 'algoliasearch';
//todo replace keys to .env file
const client = algoliasearch('VHMS5IMG9H', '5dc53d8e4b18e61f86e3145a7abfd341');
const index = client.initIndex('INVOICES');

class AlgoliaService {

  constructor() {
  }
  async save(messages) {
    const toSave = messages.map(message => Object.assign(
      {
        objectID: message.id,
        date_timestamp: message.timestamp
      }, message));
    index.saveObjects(toSave);
  }

  find(messageId) {
    return index.getObject(messageId);
  }

  updatePartially(objectID, fields) {
    const object = Object.assign({ objectID }, fields);
    return index.partialUpdateObject(object);
  }

  fetchMessagesForUser(user) {
    const { id } = user;
    const hits = index.search(id, { restrictSearchableAttributes: ['owner.id'] });
    return hits;
  }
}

export default  AlgoliaService;
