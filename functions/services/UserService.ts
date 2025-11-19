import {COLLECTIONS} from '../constants.js';

import User from '../models/User.js';

import {jsonify}  from './utils.js';

import { AbstractService } from './AbstractService.js';

class UserService extends AbstractService {
    constructor(firebase: any) {
        super(firebase);
    }

    createUser(user: any) {
        const createdAt = user.createdAt;

        const userToSave = jsonify(user);

        userToSave.createdAt = createdAt;
        const ref = this.getCollection().doc(userToSave.id);
        return ref.set(userToSave);
    }

    findByEmail(email: string) {
        return super.getCollection().where('email', '==', email).get()
            .then((result: any) => result.docs.map((doc: any) => doc.data()))
            .then((docs: any[]) => {
                const user = docs.length ? docs[0] : null;
                if (!user) return;
                let ret = new User(user.id, user.email, user.createdAt);
                return Object.assign(ret, user);
            });
    }

    findWhereWatchWillExpiredInDays(days: number) {
        // Note: dayjs is not imported, this function may need additional dependencies
        // const now = dayjs();
        // return super.getCollection().where('label.expiration', '<=', now.add(days, 'days').valueOf()).get()
        //     .then((result: any) => result.docs.map((doc: any) => doc.data()));
        throw new Error('findWhereWatchWillExpiredInDays not implemented - dayjs dependency missing');
    }

    override getCollectionName() { return COLLECTIONS.USERS; }
    override getExcludedFields() { return ['createdAt']; }

    clearUser(user: any) {
        delete user.createdAt;
        delete user.roles;
        delete user.email;
    }
}

export default UserService;
