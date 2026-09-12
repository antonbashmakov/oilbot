import AbstractService from "./AbstractService";
import {COLLECTIONS} from "../constants";
import {ChatMessage} from "../models";

class ChatService extends AbstractService<ChatMessage> {

  async fetchMessages(owner: { id: string }, limit: number, startAfterId?: string | undefined): Promise<ChatMessage[]> {
    let query = this.getCollection().where("owner.id", "==", owner.id).orderBy("created_at", "desc").limit(limit);

    if (startAfterId) {
      // Fetch the document to use as startAfter
      const startAfterDoc = await this.getCollection().doc(startAfterId).get();
      if (startAfterDoc.exists) {
        query = query.startAfter(startAfterDoc);
      }
    }

    const snapshot = await query.get();
    return snapshot.docs.map((doc) => {
      const data = doc.data();
      return {
        ...data,
        id: doc.id,
        created_at: data.created_at?.toDate()
      } as ChatMessage;
    });
  }

  toPOJO(id: any, o: any): ChatMessage | undefined {
    if (!o) return;

    const ret = {...o, id: `${id}`} as ChatMessage; 

    if (o.created_at) {
      ret.created_at = o.created_at?.toDate();
    }

    return ret;
  }


  getCollectionName(): string {
    return COLLECTIONS.CHAT_MESSAGES;
  }
  getExcludedFields(): string[] {
    return ["created_at"];
  }
}

export default ChatService;