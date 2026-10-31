import db from "../setup";
import {emulatorEnv} from "../emulatorEnv";
import * as request from "supertest";
import * as jwt from "jsonwebtoken";
import CustomerService from "../../services/CustomerService";
import ProductService from "../../services/ProductService";
import {Customer, Product} from "../../models";

// Same values as the functions emulator loads (see emulatorEnv).
const JWT_SECRET = emulatorEnv.JWT_SECRET;

const FUNCTIONS_ORIGIN = process.env.FUNCTIONS_EMULATOR_ORIGIN || "http://127.0.0.1:5001";
const PRIVATE_URL = `${FUNCTIONS_ORIGIN}/test-project/us-central1/private`;

const SAVE_CAR_QUESTION = "Хотите сохранить автомобиль в системе?";
const SUGGESTIONS_INTRO = "Возможно вам подходит какая-то из этих моделей?";

const customerToken = (customerId: string) => jwt.sign({customerId}, JWT_SECRET, {expiresIn: "1h"});

describe("Saved car: question and save_car action", () => {
  let customerService: CustomerService;
  let customer: Customer;
  let auth: string;

  const messagesPath = () => `/customers/${customer.id}/chats/latest/messages`;
  const actionsPath = () => `/customers/${customer.id}/actions`;

  const startChat = () => request(PRIVATE_URL).get(messagesPath()).set("Authorization", auth).expect(200);
  const send = (content: string) => request(PRIVATE_URL).post(messagesPath()).set("Authorization", auth).send({content}).expect(200);

  beforeEach(async () => {
    customerService = new CustomerService(db as any);
    await new ProductService(db as any).add({name: "Test Oil 5W-30", features: {sae: "5W-30", api: ["SP"], acea: ["C3"]}} as unknown as Product);

    customer = await customerService.add({
      id: "",
      external_id: "270053857",
      first_name: "Test",
      last_name: "Customer",
      origin: "TELEGRAM",
      created_at: new Date(),
      last_seen_at: new Date(),
    } as unknown as Customer);
    auth = `Bearer ${customerToken(customer.id)}`;
  });

  it("asks to save the car named in the message when the customer has none", async () => {
    await startChat();

    const response = await send("Volkswagen Golf 2015 1.4 TSI");
    const answer = response.body[1];

    expect(answer.role).toBe("assistant");
    expect(answer.questions).toEqual([{
      text: SAVE_CAR_QUESTION,
      type: "save_car",
      params: [{make: "Volkswagen", model: "Golf", year: 2015, engine: "1.4", description: "Volkswagen Golf 2015 1.4 TSI"}],
    }]);
  });

  it("builds the car over several messages and asks only once it is identified", async () => {
    await startChat();

    const first = (await send("Skoda Octavia")).body[1];
    expect(first.content).toBe("Укажите двигатель");
    expect(first.questions).toBeUndefined();
    expect((await customerService.find(customer.id))?.car_draft?.tokens).toEqual(["Skoda Octavia"]);

    const unrelated = (await send("Какое масло подходит?")).body[1];
    expect(unrelated.questions).toBeUndefined();
    expect((await customerService.find(customer.id))?.car_draft?.tokens).toEqual(["Skoda Octavia"]);

    const second = (await send("1.5L")).body[1];
    expect(second.content).toBe("Укажите год выпуска");
    expect(second.questions).toBeUndefined();
    expect((await customerService.find(customer.id))?.car_draft?.tokens).toEqual(["Skoda Octavia", "1.5L"]);

    const third = (await send("2016")).body[1];
    const car = {make: "Skoda", model: "Octavia", year: 2016, engine: "1.5L", description: "Skoda Octavia, 1.5L, 2016"};
    expect(third.questions).toEqual([{text: SAVE_CAR_QUESTION, type: "save_car", params: [car]}]);
    expect((await customerService.find(customer.id))?.car_draft).toBeUndefined();

    await request(PRIVATE_URL).post(actionsPath()).set("Authorization", auth)
      .send({type: "save_car", params: third.questions[0].params, message_id: third.id}).expect(200);
    expect((await customerService.find(customer.id))?.car).toEqual(car);
  });

  it("suggests probable cars in a second message while details are missing", async () => {
    await startChat();

    const response = await send("Skoda Octavia");
    expect(response.body).toHaveLength(3);

    const suggestions = response.body[2];
    expect(suggestions.role).toBe("assistant");
    expect(suggestions.content).toBe(SUGGESTIONS_INTRO);
    expect(suggestions.questions).toEqual([
      {text: "Skoda Octavia 2017 1.4 TSI", type: "save_car", params: [{make: "Skoda", model: "Octavia", year: 2017, engine: "1.4 TSI", description: "Skoda Octavia 2017 1.4 TSI"}]},
      {text: "Skoda Octavia 2020 1.5 TSI", type: "save_car", params: [{make: "Skoda", model: "Octavia", year: 2020, engine: "1.5 TSI", description: "Skoda Octavia 2020 1.5 TSI"}]},
    ]);
  });

  it("saves the chosen suggestion, ends the identification and marks only that option answered", async () => {
    await startChat();
    const suggestions = (await send("Skoda Octavia")).body[2];
    const chosen = suggestions.questions[1];

    await request(PRIVATE_URL).post(actionsPath()).set("Authorization", auth)
      .send({type: "save_car", params: chosen.params, message_id: suggestions.id}).expect(200);

    const saved = await customerService.find(customer.id);
    expect(saved?.car).toEqual(chosen.params[0]);
    expect(saved?.car_draft).toBeUndefined();

    const stored = (await startChat()).body.find((m: { id: string }) => m.id === suggestions.id);
    expect(stored.questions.map((q: { answered?: boolean }) => !!q.answered)).toEqual([false, true]);
  });

  it("does not suggest cars when the message names no car or the customer has a saved car", async () => {
    await startChat();
    expect((await send("Какое масло подходит?")).body).toHaveLength(2);

    await customerService.saveCar(customer.id, {make: "Skoda", model: "Octavia", year: 2018, engine: null});
    expect((await send("Skoda Octavia")).body).toHaveLength(2);
  });

  it("starts over when the customer names another car mid-way", async () => {
    await startChat();
    await send("Skoda Octavia");

    const answer = (await send("BMW X5 3.0 2020")).body[1];

    expect(answer.questions[0].params).toEqual([{make: "BMW", model: "X5", year: 2020, engine: "3.0", description: "BMW X5 3.0 2020"}]);
  });

  it("does not ask when the message names no car", async () => {
    await startChat();

    const response = await send("Какое масло подходит?");

    expect(response.body[1].questions).toBeUndefined();
  });

  it("saves the car, marks the question answered and stops asking", async () => {
    await startChat();
    const answer = (await send("Volkswagen Golf 2015 1.4 TSI")).body[1];

    const result = await request(PRIVATE_URL).post(actionsPath()).set("Authorization", auth)
      .send({type: "save_car", params: answer.questions[0].params, message_id: answer.id})
      .expect(200);
    expect(result.body).toEqual({type: "save_car", status: "done"});

    const saved = await customerService.find(customer.id);
    expect(saved?.car).toEqual({make: "Volkswagen", model: "Golf", year: 2015, engine: "1.4", description: "Volkswagen Golf 2015 1.4 TSI"});

    const messages = (await startChat()).body;
    expect(messages.find((m: { id: string }) => m.id === answer.id).questions[0].answered).toBe(true);

    const next = await send("Skoda Octavia 2018");
    expect(next.body[1].questions).toBeUndefined();
  });

  it("greets a new chat with the saved car", async () => {
    await customerService.saveCar(customer.id, {make: "Skoda", model: "Octavia", year: 2018, engine: null});

    const messages = (await startChat()).body;

    expect(messages).toHaveLength(1);
    expect(messages[0].content).toContain("Skoda Octavia 2018");
  });

  it("answers 400 for an unknown action type or invalid params", async () => {
    await request(PRIVATE_URL).post(actionsPath()).set("Authorization", auth)
      .send({type: "delete_everything", params: []}).expect(400);
    await request(PRIVATE_URL).post(actionsPath()).set("Authorization", auth)
      .send({type: "save_car", params: [{make: "Volkswagen"}]}).expect(400);
    await request(PRIVATE_URL).post(actionsPath()).set("Authorization", auth)
      .send({type: "save_car"}).expect(400);
  });

  it("answers 401 without a token and 403 for another customer", async () => {
    const params = [{make: "Volkswagen", model: "Golf"}];

    await request(PRIVATE_URL).post(actionsPath()).send({type: "save_car", params}).expect(401);
    await request(PRIVATE_URL).post(actionsPath()).set("Authorization", `Bearer ${customerToken("someone-else")}`)
      .send({type: "save_car", params}).expect(403);
  });

  it("answers 404 when the customer does not exist", async () => {
    await request(PRIVATE_URL).post("/customers/missing-customer/actions")
      .set("Authorization", `Bearer ${customerToken("missing-customer")}`)
      .send({type: "save_car", params: [{make: "Volkswagen", model: "Golf"}]}).expect(404);
  });
});
