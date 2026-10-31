import {ChatMessage, OilAgentMessage, OilAgentResponse} from "../models";

const YEAR = /^(19|20)\d{2}$/;
const ENGINE = /^\d\.\d+l?$/i;

type MockCar = {make?: string; model?: string; year?: number; engine?: string};

/**
 * Words of a message read as car data: a four-digit year, an engine like "1.5L", or make and model
 * (the first two other words in Latin letters). A message with a question mark carries no car data.
 */
const readCar = (text: string): MockCar => {
  if (text.includes("?")) return {};

  const car: MockCar = {};
  const names: string[] = [];

  text.trim().split(/\s+/).filter(Boolean).forEach((word) => {
    if (YEAR.test(word)) car.year = Number(word);
    else if (ENGINE.test(word)) car.engine = word;
    else if (/^[A-Za-z]/.test(word)) names.push(word);
  });

  if (names.length >= 2) {
    car.make = names[0];
    car.model = names[1];
  }
  return car;
};

/**
 * Deterministic stand-in for ChatbotService in the test emulator. It combines car_tokens and the
 * message (a message with another make and model starts a new car), asks for make and model,
 * engine and year in that order, then recommends the first available oil or answers not_found.
 * While it asks for engine or year it suggests two cars with the missing parts filled in.
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

    const fromMessage = readCar(request.message || "");
    const carInMessage = Object.keys(fromMessage).length > 0;
    const fromTokens = (request.car_tokens || []).reduce((car: MockCar, token) => ({...car, ...readCar(token)}), {});
    const newCar = !!fromMessage.make && !!fromTokens.make &&
      (fromMessage.make !== fromTokens.make || fromMessage.model !== fromTokens.model);

    const known: MockCar = newCar ? fromMessage : {...fromTokens, ...fromMessage};
    const car = known.make && known.model ?
      {make: known.make, model: known.model, year: known.year ?? null, engine: known.engine ?? null} :
      undefined;
    const flags = {car_in_message: carInMessage, new_car: newCar, car};

    if (!car && request.saved_car && !carInMessage) {
      return this.recommend(request, {...flags, car: undefined});
    }
    if (!car) return {status: "need_more_info", ...flags, question: "Укажите марку и модель"} as OilAgentResponse;
    const suggested_cars = [
      {...car, year: car.year ?? 2017, engine: car.engine ?? "1.4 TSI"},
      {...car, year: car.year ?? 2020, engine: car.engine ?? "1.5 TSI"},
    ];
    if (!car.engine) return {status: "need_more_info", ...flags, suggested_cars, question: "Укажите двигатель"} as OilAgentResponse;
    if (!car.year) return {status: "need_more_info", ...flags, suggested_cars, question: "Укажите год выпуска"} as OilAgentResponse;

    return this.recommend(request, flags);
  }

  private recommend(request: Partial<OilAgentMessage>, flags: object): OilAgentResponse {
    const oils = request.available_oils || [];

    if (!oils.length) {
      return {status: "not_found", ...flags, reason: "No oils available"} as OilAgentResponse;
    }
    return {status: "success", ...flags, recommendedOilIds: [oils[0].id]} as OilAgentResponse;
  }
}

export default MockChatbotService;
