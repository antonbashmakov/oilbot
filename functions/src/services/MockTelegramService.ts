
import {ConversationMessage} from "../models";
import { logger } from "firebase-functions/v1";
import {v4 as uuidv4} from "uuid";

class TelegramService {

  constructor() {
  }

  async sendMessage(chatId: string, text: string, thread_id: string): Promise<ConversationMessage | undefined> {

    if (chatId === "MOCK_CHAT_ID" || chatId.startsWith("FAIL_CHAT_ID")) {
      logger.info("MockTelegramService: sendMessage called", {chatId, text, thread_id});
      throw new Error("MockTelegramService: Simulated sendMessage failure");
    }

    return {
      id: uuidv4(),
      provider: "TELEGRAM",
      role: "ADMIN",
      recipient_id: chatId,
      text,
      created_at: new Date(),
      thread_id,
    };
  } 
  }

export default TelegramService;
