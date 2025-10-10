
import {COLLECTIONS} from '../constants.js';


import User from '../models/User.js';

import {jsonify}  from './utils.js';

import AbstractService from './AbstractService.js';

class UserService  extends AbstractService {
    constructor(firebase) {
        super(firebase);
    }

    createUser(user) {
        const createdAt = user.createdAt;

        const userToSave = jsonify(user);

        userToSave.createdAt = createdAt;
        const ref = this.getCollection().doc(userToSave.id);
        return ref.set(userToSave);
    }

    findByEmail(email) {
        return super.getCollection().where('email', '==', email).get()
            .then(result => result.docs.map(doc => doc.data()))
            .then(docs => {
                const user = docs.length ? docs[0] : null;
                if (!user) return;
                let ret = new User();
                return Object.assign(ret, user);
            });
    }

    findWhereWatchWillExpiredInDays(days) {
        const now = dayjs();
        return super.getCollection().where('label.expiration', '<=', now.add(days, 'days').valueOf()).get()
            .then(result => result.docs.map(doc => doc.data()));
    }

    getCollectionName() { return COLLECTIONS.USERS }
    getExcludedFields() { return ['createdAt'] }


    clearUser(user) {
        delete user.createdAt;
        delete user.roles;
        delete user.email;
    }
}

export default UserService;
