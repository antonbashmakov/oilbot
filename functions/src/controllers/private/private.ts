import {
  functions,
  cors,
  admin,
  express,
  api,
  ChatService,
  ChatbotService,
} from './imports';

import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';
import initialMessage from '../../prompts/initialMessage';


admin.initializeApp(functions.config().firebase, 'private');
dotenv.config();

const db = admin.firestore();

if (process.env.GCLOUD_PROJECT !== 'test-project' && db.databaseId !== process.env.DATABASE_ID) {
  db.settings({
    databaseId: process.env.DATABASE_ID,
  });
}

const chatService = new ChatService(db);
const chatbotService = new ChatbotService();

const privateApi = express();

privateApi.use(cors(
  { origin: true } // allows all cross origin xhr requests
));

privateApi.use(cookieParser());

privateApi.get('/customers/:customerId/chats/:chatId/messages', async (req: express.Request, res: express.Response) => {
  try {
    const { customerId, chatId } = req.params;
    const { oldestMessage} = req.query;

    const messages = await chatService.fetchMessages({ id: customerId }, 10, oldestMessage as string | undefined);

    if(messages.length === 0) {
      const ret = await chatService.add({
        id: 'tmp',
        role: 'assistant',
        content: initialMessage.content,
        created_at: new Date(),
        owner: { id: customerId },
        chat_id: chatId,
      });
      return api.send(res, [ret]);
    }

    const message = await chatbotService.createConversationMessage(messages);
    message.chat_id = chatId;
    message.owner = { id: customerId };

    await chatService.add(message);

    return api.send(res, message);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || 'Internal server error');
  }
});
privateApi.post('/customers/:customerId/chats/:chatId/messages', async (req: express.Request, res: express.Response) => {
  try {
    const { customerId, chatId } = req.params;
    const { content } = req.body;

    let messages = await chatService.fetchMessages({ id: customerId }, 10);

    if(messages.length === 0) {
      return api.error(res, 'No messages found for this chat. Please start a conversation first.');
    }

    let message = await chatService.add(content);

    messages.push(message);

    message = await chatbotService.createConversationMessage(messages);
    message.chat_id = chatId;
    message.owner = { id: customerId };

    await chatService.add(message);

    return api.send(res, message);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || 'Internal server error');
  }
});


export default privateApi;
