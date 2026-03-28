import AbstractService from "./AbstractService";
import {COLLECTIONS} from "../constants";
import {ConversationMessage, MessageFilter} from "../models";

class ConversationMessageService extends AbstractService<ConversationMessage> {
  toPOJO(id: any, o: any): ConversationMessage | undefined {
    if (!o) return;

    const message = {id, ...o} as ConversationMessage;

    message.created_at = o.created_at.toDate();

    return message;
  }

  getCollectionName(): string {
    return COLLECTIONS.CONVERSATION_MESSAGES;
  }

  async findByRecipientId(recipientId: string): Promise<ConversationMessage[]> {
    const result = await this.getCollection()
      .where("recipient_id", "==", recipientId)
      .get();

    if (result.empty) {
      return [];
    }

    return result.docs.map((doc) => this.toPOJO(doc.id, doc.data()) as ConversationMessage);
  }
  async findByFilter(filter: MessageFilter): Promise<ConversationMessage[]> {

    let q = this.getCollection()
      .where("recipient_id", "==", filter.recipient);

    if(filter.threadId) q = q.where("thread_id", "==", filter.threadId);

    const result = await q.get();

    if (result.empty) {
      return [];
    }

    return result.docs.map((doc) => this.toPOJO(doc.id, doc.data()) as ConversationMessage);
  }

  getExcludedFields(): string[] {
    return ["created_at"];
  }
}

export default ConversationMessageService;
