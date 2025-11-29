import AbstractService from './AbstractService';
import { COLLECTIONS } from '../constants';
import { ConversationMessage } from '../models';

class ConversationMessageService extends AbstractService<ConversationMessage> {

    toPOJO(id: any, o: any): ConversationMessage | undefined {
        if (!o) return;

        const message = { id, ...o } as ConversationMessage;

        message.created_at = o.created_at.toDate();

        return message;
    }

    getCollectionName(): string { return COLLECTIONS.CONVERSATION_MESSAGES; }
    getExcludedFields(): string[] { return ['created_at']; }
}

export default ConversationMessageService;
