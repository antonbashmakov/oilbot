import AbstractService from "./AbstractService";
import { COLLECTIONS } from "../constants";
import {ChatMessage, QuestionAction} from "../models";

// The value with object keys sorted, so equal params compare equal whatever their key order.
const canonical = (value: unknown): unknown => {
  if (Array.isArray(value)) return value.map(canonical);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.entries(value).sort(([a], [b]) => a.localeCompare(b)).map(([k, v]) => [k, canonical(v)]));
  }
  return value;
};

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
   * Marks the question of the owner's message with the same params answered; false when there is
   * no such question.
   */
  async markQuestionAnswered(owner: {id: string}, messageId: string, params: unknown): Promise<boolean> {
    const ref = this.getCollection().doc(messageId);
    const doc = await ref.get();
    const data = doc.data();

    if (!doc.exists || data?.owner?.id !== owner.id || !Array.isArray(data?.questions)) return false;

    const key = JSON.stringify(canonical(params));
    const index = data.questions.findIndex((question: QuestionAction) => JSON.stringify(canonical(question.params)) === key);
    if (index < 0) return false;

    const questions = data.questions.map((question: QuestionAction, i: number) =>
      i === index ? {...question, answered: true} : question);
    await ref.update({questions});
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