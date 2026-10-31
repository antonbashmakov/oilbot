import {
  functions,
  cors,
  admin,
  express,
  api,
  authorizeCustomer,
  ChatService,
  ChatbotService,
  CustomerService,
  OilAgentMessage,
  ProductService,
} from './imports';

import * as dotenv from 'dotenv';
import * as cookieParser from 'cookie-parser';
import initialMessage from '../../prompts/initialMessage';
import oilBotMessage from '../../prompts/oilagent';
import saveCarQuestion from "../../prompts/saveCarQuestion";
import savedCarGreeting from "../../prompts/savedCarGreeting";
import {ActionRequest, ActionType, Car, ChatMessage} from "../../models";
// import { logger } from 'firebase-functions/v1';

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
const productService = new ProductService(db);
const customerService = new CustomerService(db);

const isCar = (car: any): car is Car =>
  !!car && typeof car.make === "string" && car.make.trim() !== "" &&
  typeof car.model === "string" && car.model.trim() !== "";

type ActionOutcome = "done" | "invalid_params" | "customer_not_found";
type ActionHandler = (customerId: string, params: Car[]) => Promise<ActionOutcome>;

/**
 * Actions a customer confirms with a QuestionAction button, by type.
 */
const actions = new Map<ActionType, ActionHandler>([
  ["save_car", async (customerId, params) => {
    const car = Array.isArray(params) ? params[0] : undefined;
    if (!isCar(car)) return "invalid_params";

    const customer = await customerService.saveCar(customerId, car);
    return customer ? "done" : "customer_not_found";
  }],
]);

const privateApi = express();

privateApi.use(cors(
  { origin: true } // allows all cross origin xhr requests
));

privateApi.use(cookieParser());

privateApi.use("/customers/:customerId", authorizeCustomer);

privateApi.get('/customers/:customerId/chats/:chatId/messages', async (req: express.Request, res: express.Response) => {
  try {
    const { customerId, chatId } = req.params;
    const { oldestMessage } = req.query;

    const messages = await chatService.fetchMessages({ id: customerId }, 10, oldestMessage as string | undefined);

    if (messages.length === 0) {
      const customer = await customerService.find(customerId);
      const greeting = customer?.car ? savedCarGreeting(customer.car) : initialMessage;

      const ret = await chatService.add({
        id: 'tmp',
        role: 'assistant',
        content: greeting.content,
        created_at: new Date(),
        owner: { id: customerId },
        chat_id: chatId,
      });
      return api.send(res, [ret]);
    }


    return api.send(res, messages);
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

    if (messages.length === 0) {
      return api.error(res, 'No messages found for this chat. Please start a conversation first.');
    }

    const allProducts = await productService.findAll();
    const customer = await customerService.find(customerId);
    const carTokens = customer ? customerService.carDraftTokens(customer) : [];


    const m = {
      role: "assistant",
      content: oilBotMessage.content,
      owner: { id: customerId },
      created_at: new Date()
    } as ChatMessage;

    const oilMessage = {
      message: content,
      car_tokens: carTokens,
      ...(customer?.car ? {saved_car: customer.car} : {}),
      available_oils: allProducts.map((p) => ({
        id: p.id,
        name: p.name,
        sae: p.features?.sae ?? "",
        api: p.features?.api ?? [],
        acea: p.features?.acea ?? [],
        oem_approvals: p.features?.oem_approvals,
      })),
    } as OilAgentMessage;

    const m2 = {
      role: "user",
      content: JSON.stringify(oilMessage),
      owner: { id: customerId },
      created_at: new Date()
    } as ChatMessage;

    let message = await chatService.addMessageForUser({ id: customerId }, chatId, content);

    const ret = [{ ...message }];

    messages.push(m);
    messages.push(m2);

    const aiAnswer = await chatbotService.createConversationMessage(messages);

    message.chat_id = chatId;
    message.owner = { id: customerId };

    if (aiAnswer.status == 'not_found') {
      message.content = aiAnswer.reason || '';
    } else if (aiAnswer.status == 'need_more_info') {
      message.content = aiAnswer.question || '';
    } else if (aiAnswer.status == 'success') {
      const products = await productService.findByIds(aiAnswer.recommendedOilIds || []);
      message.products = products;
    }

    message.role = 'assistant';

    // A car told over several messages: keep its messages while the AI needs more information,
    // offer to save it once the identification ends.
    const tokens = [...(aiAnswer.new_car ? [] : carTokens), ...(aiAnswer.car_in_message ? [content] : [])];
    const identified = aiAnswer.status !== "need_more_info";

    if (customer && !identified && aiAnswer.car_in_message) {
      await customerService.setCarDraft(customer, tokens);
    } else if (customer && identified && customer.car_draft) {
      await customerService.clearCarDraft(customer);
    }

    if (identified && aiAnswer.car_in_message && isCar(aiAnswer.car) && !customer?.car) {
      message.question = {
        text: saveCarQuestion.content,
        type: "save_car",
        params: [{...aiAnswer.car, description: tokens.join(", ")}],
      };
    }

    const answer = await chatService.add(message);

    return api.send(res, [...ret, answer]);
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || 'Internal server error');
  }
});


privateApi.post("/customers/:customerId/actions", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId} = req.params;
    const {type, params, message_id: messageId} = req.body as ActionRequest;

    const action = actions.get(type);
    if (!action) return api.badRequest(res, `Unknown action type: ${type}`, "UNKNOWN_ACTION");

    const outcome = await action(customerId, params);
    if (outcome === "invalid_params") return api.badRequest(res, "Invalid action params", "INVALID_PARAMS");
    if (outcome === "customer_not_found") return api.notFound(res, "Customer not found");

    if (messageId) await chatService.markQuestionAnswered({id: customerId}, messageId);

    return api.send(res, {type, status: "done"});
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

export default privateApi;
