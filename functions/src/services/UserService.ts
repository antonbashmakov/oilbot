import {COLLECTIONS} from "../constants";
import { User } from "../models";

import AbstractService from "./AbstractService";

class UserService extends AbstractService<User> {
  constructor(firebase: any) {
    super(firebase);
  }

  async findByEmail(email: string): Promise<User | undefined> {
      const snapshot = await this.getCollection()
        .where("email", "==", email)
        .limit(1)
        .get();
      
      if (snapshot.empty) {
        return undefined;
      }
      
      const doc = snapshot.docs[0];
      return this.toPOJO(doc.id, doc.data());

  }

  getCollectionName(): string {
    return COLLECTIONS.USERS;
  }
  getExcludedFields(): string[] {
    return ["created_at"];
  }
}


export default UserService;
