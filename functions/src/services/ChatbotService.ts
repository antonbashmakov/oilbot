import { ChatMessage } from "../models";

import OpenAI from "openai";

class ChatbotService {

  private bot: OpenAI;

  constructor() {

    this.bot = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }

  async createConversationMessage(messages: ChatMessage[]): Promise<ChatMessage> {
    const completion = await this.bot.chat.completions.create({
      messages: [
        ...messages.map((message) => ({
          role: message.role,
          content: message.content,
        })),
      ],
      model: "deepseek-flash",
      reasoning_effort: "high",
      stream: false,
    });

    return {
      id: `msg_${Date.now()}`,
      role: "assistant",
      content: completion.choices[0].message.content || completion.choices[0].message.refusal || "",
      created_at: new Date(),
      owner: { id: "" },
      chat_id: messages[0].chat_id,

    }
  }  
}

export default ChatbotService;
