import AbstractService from "./AbstractService";
import { COLLECTIONS } from "../constants";
import { ChatMessage } from "../models";

class ChatService extends AbstractService<ChatMessage> {

  /**
   * The latest `limit` messages of the owner, oldest first; with `startAfterId` the ones before that message.
   */
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
    }).reverse();
  }

  /**
   * Marks the question of the owner's message answered; false when there is no such question.
   */
  async markQuestionAnswered(owner: { id: string }, messageId: string): Promise<boolean> {
    const ref = this.getCollection().doc(messageId);
    const doc = await ref.get();
    const data = doc.data();

    if (!doc.exists || data?.owner?.id !== owner.id || !data?.question) return false;

    await ref.update({"question.answered": true});
    return true;
  }

  async addMessageForUser(owner: { id: string }, chatId: string, content: string): Promise<ChatMessage> {
    const newMessage: ChatMessage = {
      id: '',
      role: 'user',
      content,
      owner,
      created_at: new Date(),
      chat_id: chatId
    };

    const docRef = await this.getCollection().add(newMessage);
    return { ...newMessage, id: docRef.id };
  }

  toPOJO(id: any, o: any): ChatMessage | undefined {
    if (!o) return;

    const ret = { ...o, id: `${id}` } as ChatMessage;

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