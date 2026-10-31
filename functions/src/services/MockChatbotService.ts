import {ChatMessage, OilAgentMessage, OilAgentResponse} from "../models";

/**
 * Deterministic stand-in for ChatbotService in the test emulator: recommends the first available
 * oil from the last message, or answers not_found when there is none.
 */
class MockChatbotService {
  async createConversationMessage(messages: ChatMessage[]): Promise<OilAgentResponse> {
    const last = messages[messages.length - 1];
    let request: Partial<OilAgentMessage> = {};

    try {
      request = JSON.parse(last?.content || "{}");
    } catch (e) {
      request = {};
    }

    const oils = request.available_oils || [];

    if (!oils.length) {
      return {status: "not_found", reason: "No oils available"} as OilAgentResponse;
    }

    return {status: "success", recommendedOilIds: [oils[0].id]} as OilAgentResponse;
  }
}

export default MockChatbotService;
