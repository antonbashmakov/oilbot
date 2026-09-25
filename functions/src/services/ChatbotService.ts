import { ChatMessage, OilAgentResponse } from "../models";

import OpenAI from "openai";

class ChatbotService {

  private bot: OpenAI;

  constructor() {

    this.bot = new OpenAI({
      baseURL: 'https://api.deepseek.com',
      apiKey: process.env.DEEPSEEK_API_KEY,
    });
  }

  async createConversationMessage(messages: ChatMessage[]): Promise<OilAgentResponse> {
    
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

    const content = completion.choices[0].message.content || completion.choices[0].message.refusal || "";

    if (!content) {
      throw new Error("No content returned from the chatbot.");
    }

    return  JSON.parse(content) as OilAgentResponse;
  }  
}

export default ChatbotService;
