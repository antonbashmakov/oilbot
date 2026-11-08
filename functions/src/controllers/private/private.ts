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
import savedCarGreeting, {describeCar} from "../../prompts/savedCarGreeting";
import carSuggestionsIntro from "../../prompts/carSuggestionsIntro";
import carSavedConfirmation from "../../prompts/carSavedConfirmation";
import oilSearchRequest from "../../prompts/oilSearchRequest";
import {ActionRequest, ActionType, Car, ChatMessage} from "../../models";
// import { logger } from 'firebase-functions/v1';

admin.initializeApp(functions.config().firebase, 'private');
dotenv.config();

const db = admin.firestore();

if (process.env.GCLOUD_PROJECT !== 'test-project' && process.env.DATABASE_ID && db.databaseId !== process.env.DATABASE_ID) {
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
/**
 * Asks the oil agent and stores its answer, the car draft and the save question or car suggestions.
 * `userText` is the customer's message, stored in the chat; without it (the oil search after saving
 * a car) `request` goes to the AI only.
 */
const askOilAgent = async (customerId: string, chatId: string, request: string, userText?: string) => {
  const messages = await chatService.fetchMessages({id: customerId}, 10);
  const allProducts = await productService.findAll();
  const customer = await customerService.find(customerId);
  const carTokens = customer ? customerService.carDraftTokens(customer) : [];

  const instructions = {
    role: "assistant",
    content: oilBotMessage.content,
    owner: {id: customerId},
    created_at: new Date(),
  } as ChatMessage;

  const oilMessage = {
    message: request,
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

  const agentRequest = {
    role: "user",
    content: JSON.stringify(oilMessage),
    owner: {id: customerId},
    created_at: new Date(),
  } as ChatMessage;

  const userMessage = userText === undefined ? undefined : await chatService.addMessageForUser({id: customerId}, chatId, userText);

  const aiAnswer = await chatbotService.createConversationMessage([...messages, instructions, agentRequest]);

  const message: ChatMessage = {
    id: "",
    role: "assistant",
    content: aiAnswer.status === "need_more_info" ? aiAnswer.question || "" : aiAnswer.reason || "",
    owner: {id: customerId},
    chat_id: chatId,
    created_at: new Date(),
  };

  if (aiAnswer.status === "success") {
    message.products = await productService.findByIds(aiAnswer.recommendedOilIds || []);
  }

  // A car told over several messages: keep its messages while the AI needs more information,
  // offer to save it once the identification ends.
  const carInMessage = !!aiAnswer.car_in_message && userText !== undefined;
  const tokens = [...(aiAnswer.new_car ? [] : carTokens), ...(carInMessage && userText ? [userText] : [])];
  const identified = aiAnswer.status !== "need_more_info";

  if (customer && !identified && carInMessage) {
    await customerService.setCarDraft(customer, tokens);
  } else if (customer && identified && customer.car_draft) {
    await customerService.clearCarDraft(customer);
  }

  if (identified && carInMessage && isCar(aiAnswer.car) && !customer?.car) {
    message.questions = [{
      text: saveCarQuestion.content,
      type: "save_car",
      params: [{...aiAnswer.car, description: tokens.join(", ")}],
    }];
  }

  const answer = await chatService.add(message);

  // Probable complete cars while the AI still needs details: offered as a second message.
  const suggestions = identified || customer?.car ? [] : (aiAnswer.suggested_cars || []).filter(isCar).slice(0, 3);

  const suggestionsMessage = suggestions.length === 0 ? undefined : await chatService.add({
    id: "",
    role: "assistant",
    content: carSuggestionsIntro.content,
    owner: {id: customerId},
    chat_id: chatId,
    created_at: new Date(),
    questions: suggestions.map((car) => {
      const description = describeCar({...car, year: car.year ?? null, engine: car.engine ?? null});
      return {text: description, type: "save_car", params: [{...car, description}], follow_up: "oil_search"};
    }),
  });

  return [userMessage, answer, suggestionsMessage].filter((m): m is ChatMessage => !!m);
};

privateApi.post("/customers/:customerId/chats/:chatId/messages", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId, chatId} = req.params;
    const {content} = req.body;

    const messages = await chatService.fetchMessages({id: customerId}, 1);
    if (messages.length === 0) {
      return api.error(res, "No messages found for this chat. Please start a conversation first.");
    }

    return api.send(res, await askOilAgent(customerId, chatId, content, content));
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

privateApi.post("/customers/:customerId/chats/:chatId/oil-search", async (req: express.Request, res: express.Response) => {
  try {
    const {customerId, chatId} = req.params;

    const customer = await customerService.find(customerId);
    if (!customer) return api.notFound(res, "Customer not found");
    if (!customer.car) return api.badRequest(res, "The customer has no saved car", "NO_SAVED_CAR");

    return api.send(res, await askOilAgent(customerId, chatId, oilSearchRequest.content));
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
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

    const answered = messageId ? await chatService.markQuestionAnswered({id: customerId}, messageId, params) : undefined;

    // A saved suggestion: confirm it in the chat; the client then runs the oil search.
    if (answered?.question.follow_up === "oil_search") {
      const confirmation = await chatService.add({
        id: "",
        role: "assistant",
        content: carSavedConfirmation.content,
        owner: {id: customerId},
        chat_id: answered.chatId,
        created_at: new Date(),
      });
      return api.send(res, {type, status: "done", messages: [confirmation], follow_up: "oil_search"});
    }

    return api.send(res, {type, status: "done"});
  } catch (err: any) {
    functions.logger.error(err);
    return api.error(res, err.message || "Internal server error");
  }
});

export default privateApi;
