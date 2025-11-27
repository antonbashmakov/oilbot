import { COLLECTIONS } from '../constants';

import AbstractService from './AbstractService';

import { jsonify } from './utils';

// Interface for User entity
interface UserEntity {
  id: string;
  email: string;
  roles: string[];
  created_at?: Date;
  label?: {
    expiration: number;
  };
}

class UserService extends AbstractService<UserEntity> {

    constructor(firebase: any) {
        super(firebase);
    }

    createUser(user: UserEntity): Promise<any> {
        const created_at = user.created_at;

        const userToSave = jsonify(user);

        userToSave.created_at = created_at;
        const ref = this.getCollection().doc(userToSave.id);
        return ref.set(userToSave);
    }

    getCollectionName(): string { return COLLECTIONS.USERS; }
    getExcludedFields(): string[] { return ['created_at']; }

    clearUser(user: UserEntity): void {
        delete (user as any).created_at;
        delete (user as any).roles;
        delete (user as any).email;
    }

}


export default UserService;
