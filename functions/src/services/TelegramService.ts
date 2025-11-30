import axios from "axios";
import {ConversationMessage} from "../models";

class TelegramService {
  private botToken: string;
  private baseUrl: string;

  constructor() {
    this.botToken = process.env.TELEGRAM_BOT_TOKEN || "";
    this.baseUrl = `https://api.telegram.org/bot${this.botToken}`;
  }

  async sendMessage(chatId: string, text: string): Promise<ConversationMessage | undefined> {
    if (!this.botToken) {
      console.warn("TELEGRAM_BOT_TOKEN not configured, skipping Telegram message");
      return;
    }

    try {
      const ret = await axios.post(`${this.baseUrl}/sendMessage`, {
        chat_id: chatId,
        text: text,
        parse_mode: "Markdown",
      });

      return {
        id: ret.data.result.id,
        provider: "TELEGRAM",
        recipient_id: chatId,
        text: ret.data.result.text,
        created_at: new Date(),
      };
    } catch (error) {
      console.error("Failed to send Telegram message:", error);
      throw new Error(`Failed to send Telegram message: ${error}`);
    }
  }
}

export default TelegramService;
