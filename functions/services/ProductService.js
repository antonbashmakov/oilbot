
import {COLLECTIONS} from '../constants.js';


import AbstractService from './AbstractService.js';

class UserService  extends AbstractService {
    constructor(firebase) {
        super(firebase);
    }

    getCollectionName() { return COLLECTIONS.PRODUCTS }
    getExcludedFields() { return ['createdAt'] }


    clearUser(user) {
        delete user.createdAt;
        delete user.roles;
        delete user.email;
    }
}

export default UserService;
