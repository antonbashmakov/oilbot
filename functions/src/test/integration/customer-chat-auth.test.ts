import db from "../setup";
import {emulatorEnv} from "../emulatorEnv";
import * as request from "supertest";
import * as crypto from "crypto";
import * as jwt from "jsonwebtoken";
import CustomerService from "../../services/CustomerService";
import ProductService from "../../services/ProductService";
import ChatService from "../../services/ChatService";
import {Product} from "../../models";

// Same values as the functions emulator loads (see emulatorEnv).
const JWT_SECRET = emulatorEnv.JWT_SECRET;
const TELEGRAM_BOT_TOKEN = emulatorEnv.TELEGRAM_BOT_TOKEN;

const FUNCTIONS_ORIGIN = process.env.FUNCTIONS_EMULATOR_ORIGIN || "http://127.0.0.1:5001";
const PUBLIC_URL = `${FUNCTIONS_ORIGIN}/test-project/us-central1/public`;
const PRIVATE_URL = `${FUNCTIONS_ORIGIN}/test-project/us-central1/private`;

/**
 * Init data signed the way Telegram signs it for a Mini App (core.telegram.org/bots/webapps).
 */
const signTelegramInitData = (user: object, authDate = Math.floor(Date.now() / 1000)): string => {
  const fields: Record<string, string> = {
    auth_date: `${authDate}`,
    query_id: "AAHdF6IQAAAAAN0XohDhrOrc",
    signature: "test-signature",
    user: JSON.stringify(user),
  };
  const dataCheckString = Object.keys(fields).sort().map((key) => `${key}=${fields[key]}`).join("\n");
  const secret = crypto.createHmac("sha256", "WebAppData").update(TELEGRAM_BOT_TOKEN).digest();
  const hash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  return new URLSearchParams({...fields, hash}).toString();
};

/**
 * Telegram Login Widget data signed the way Telegram signs it (core.telegram.org/widgets/login-legacy).
 */
const signTelegramLogin = (user: Record<string, string | number>, authDate = Math.floor(Date.now() / 1000)) => {
  const fields: Record<string, string | number> = {...user, auth_date: authDate};
  const dataCheckString = Object.keys(fields).sort().map((key) => `${key}=${fields[key]}`).join("\n");
  const secret = crypto.createHash("sha256").update(TELEGRAM_BOT_TOKEN).digest();
  const hash = crypto.createHmac("sha256", secret).update(dataCheckString).digest("hex");

  return {...fields, hash};
};

const customerToken = (customerId: string) => jwt.sign({customerId}, JWT_SECRET, {expiresIn: "1h"});

describe("Customer sign-in and chat authorization", () => {
  let customerService: CustomerService;
  let productService: ProductService;
  let chatService: ChatService;

  beforeEach(() => {
    customerService = new CustomerService(db as any);
    productService = new ProductService(db as any);
    chatService = new ChatService(db as any);
  });

  describe("POST /auth", () => {
    it("signs a new Telegram customer in and returns a customer token", async () => {
      const response = await request(PUBLIC_URL)
        .post("/auth")
        .send({initData: signTelegramInitData({id: 270053857, first_name: "Test", last_name: "Customer"})})
        .expect(200);

      expect(response.body).toHaveProperty("external_id", "270053857");
      expect(response.body).toHaveProperty("origin", "TELEGRAM");
      expect(response.body.token).toEqual(expect.any(String));

      const decoded = jwt.verify(response.body.token, JWT_SECRET) as { customerId: string };
      expect(decoded.customerId).toBe(response.body.id);

      const cookies = response.headers["set-cookie"] as unknown as string[];
      expect(cookies).toEqual(expect.arrayContaining([expect.stringContaining(`__session=${response.body.token}`)]));

      const customer = await customerService.findByExternalId("270053857");
      expect(customer?.id).toBe(response.body.id);
    });

    it("creates one customer for parallel sign-ins of the same user", async () => {
      const initData = signTelegramInitData({id: 270053858, first_name: "Parallel"});

      const responses = await Promise.all([1, 2, 3].map(() => request(PUBLIC_URL).post("/auth").send({initData}).expect(200)));

      const ids = new Set(responses.map((response) => response.body.id));
      expect(ids).toEqual(new Set(["TELEGRAM_270053858"]));

      const snapshot = await db.collection("CUSTOMERS").where("external_id", "==", "270053858").get();
      expect(snapshot.size).toBe(1);
    });

    it("rejects init data signed with another bot token", async () => {
      const initData = signTelegramInitData({id: 270053857, first_name: "Test"});
      const forged = initData.replace(/hash=[0-9a-f]+/, `hash=${"0".repeat(64)}`);

      await request(PUBLIC_URL).post("/auth").send({initData: forged}).expect(403);
    });

    it("rejects init data older than one hour", async () => {
      const initData = signTelegramInitData({id: 270053857, first_name: "Test"}, Math.floor(Date.now() / 1000) - 7200);

      await request(PUBLIC_URL).post("/auth").send({initData}).expect(403);
    });
  });

  describe("POST /auth/telegram-login", () => {
    const user = {id: 270053859, first_name: "Browser", last_name: "Tester", username: "browser_tester", photo_url: "https://t.me/i/userpic/320/x.jpg"};

    it("signs in the same customer as the Mini App for the same Telegram id", async () => {
      const miniApp = await request(PUBLIC_URL).post("/auth")
        .send({initData: signTelegramInitData({id: user.id, first_name: "Browser"})}).expect(200);

      const response = await request(PUBLIC_URL).post("/auth/telegram-login").send(signTelegramLogin(user)).expect(200);

      expect(response.body.id).toBe(miniApp.body.id);
      expect(response.body).toHaveProperty("origin", "TELEGRAM");
      const decoded = jwt.verify(response.body.token, JWT_SECRET) as { customerId: string };
      expect(decoded.customerId).toBe(miniApp.body.id);
    });

    it("creates the customer on the first browser login", async () => {
      const response = await request(PUBLIC_URL).post("/auth/telegram-login").send(signTelegramLogin({...user, id: 270053860})).expect(200);

      expect(response.body).toMatchObject({id: "TELEGRAM_270053860", external_id: "270053860", first_name: "Browser", last_name: "Tester"});
    });

    it("rejects a wrong hash, changed data and an old auth_date", async () => {
      const signed = signTelegramLogin(user);

      await request(PUBLIC_URL).post("/auth/telegram-login").send({...signed, hash: "0".repeat(64)}).expect(403);
      await request(PUBLIC_URL).post("/auth/telegram-login").send({...signed, id: 1}).expect(403);
      await request(PUBLIC_URL).post("/auth/telegram-login")
        .send(signTelegramLogin(user, Math.floor(Date.now() / 1000) - 2 * 24 * 60 * 60)).expect(403);
    });

    it("answers 400 when fields are missing", async () => {
      await request(PUBLIC_URL).post("/auth/telegram-login").send({id: user.id}).expect(400);
    });
  });

  describe("chat endpoints", () => {
    const path = (customerId: string) => `/customers/${customerId}/chats/latest/messages`;

    it("answers 401 without a token", async () => {
      await request(PRIVATE_URL).get(path("customer-a")).expect(401);
      await request(PRIVATE_URL).post(path("customer-a")).send({content: "VW Golf 2015 1.4 TSI"}).expect(401);
    });

    it("answers 401 for a staff token", async () => {
      const staffToken = jwt.sign({id: "user-1"}, JWT_SECRET, {expiresIn: "1h"});

      await request(PRIVATE_URL).get(path("customer-a")).set("Authorization", `Bearer ${staffToken}`).expect(401);
    });

    it("answers 403 for another customer's token", async () => {
      await request(PRIVATE_URL).get(path("customer-a")).set("Authorization", `Bearer ${customerToken("customer-b")}`).expect(403);
    });

    it("accepts the token from the __session cookie", async () => {
      await request(PRIVATE_URL).get(path("customer-a")).set("Cookie", `__session=${customerToken("customer-a")}`).expect(200);
    });

    it("starts the chat and answers with the mock AI recommendation", async () => {
      const product = await productService.add({name: "Test Oil 5W-30", features: {sae: "5W-30", api: ["SP"], acea: ["C3"]}} as unknown as Product);
      const auth = `Bearer ${customerToken("customer-a")}`;

      const first = await request(PRIVATE_URL).get(path("customer-a")).set("Authorization", auth).expect(200);
      expect(first.body).toHaveLength(1);
      expect(first.body[0].role).toBe("assistant");

      const answer = await request(PRIVATE_URL).post(path("customer-a")).set("Authorization", auth)
        .send({content: "VW Golf 2015 1.4 TSI"}).expect(200);

      expect(answer.body).toHaveLength(2);
      expect(answer.body[0]).toMatchObject({role: "user", content: "VW Golf 2015 1.4 TSI"});
      expect(answer.body[1].role).toBe("assistant");
      expect(answer.body[1].products.map((p: Product) => p.id)).toEqual([product.id]);
    });

    it("returns the latest 10 messages oldest first", async () => {
      const start = Date.now() - 60_000;
      for (let i = 0; i < 12; i++) {
        await db.collection("CHAT_MESSAGES").add({
          role: "user",
          content: `message ${i}`,
          owner: {id: "customer-a"},
          chat_id: "latest",
          created_at: new Date(start + i * 1000),
        });
      }

      const messages = await chatService.fetchMessages({id: "customer-a"}, 10);
      expect(messages.map((m) => m.content)).toEqual(Array.from({length: 10}, (_, i) => `message ${i + 2}`));

      const response = await request(PRIVATE_URL).get(path("customer-a"))
        .set("Authorization", `Bearer ${customerToken("customer-a")}`).expect(200);
      expect(response.body.map((m: { content: string }) => m.content)).toEqual(messages.map((m) => m.content));
    });
  });
});
