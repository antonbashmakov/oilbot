import { COLLECTIONS } from '../constants';

import AbstractService from './AbstractService';

import { jsonify } from './utils';

// Interface for User entity
interface UserEntity {
  id: string;
  email: string;
  roles: string[];
  createdAt?: Date;
  label?: {
    expiration: number;
  };
}

class UserService extends AbstractService<UserEntity> {

    constructor(firebase: any) {
        super(firebase);
    }

    createUser(user: UserEntity): Promise<any> {
        const createdAt = user.createdAt;

        const userToSave = jsonify(user);

        userToSave.createdAt = createdAt;
        const ref = this.getCollection().doc(userToSave.id);
        return ref.set(userToSave);
    }

    getCollectionName(): string { return COLLECTIONS.USERS; }
    getExcludedFields(): string[] { return ['createdAt']; }

    clearUser(user: UserEntity): void {
        delete (user as any).createdAt;
        delete (user as any).roles;
        delete (user as any).email;
    }

}


export default UserService;
