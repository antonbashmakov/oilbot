import db from "../setup";
import * as request from "supertest";
import * as crypto from "crypto";
import CustomerService from "../../services/CustomerService";
import { Customer } from "../../models";

// Test tokens and keys
const TEST_TELEGRAM_BOT_TOKEN = "test-telegram-bot-token-123456";
const TEST_VK_SECRET_KEY = "test-vk-secret-key-789012";
const TEST_JWT_SECRET = "test-jwt-secret";

// Set environment variables for tests
process.env.TELEGRAM_BOT_TOKEN = TEST_TELEGRAM_BOT_TOKEN;
process.env.VK_SECRET_KEY = TEST_VK_SECRET_KEY;
process.env.JWT_SECRET = TEST_JWT_SECRET;

const URL = "http://127.0.0.1:5001/test-project/us-central1/public";

// Mock the verification functions
// We'll create init data that will pass verification by mocking
const generateTelegramInitData = (userData: any): string => {
  const authDate = 1768229840;
  const userJson = JSON.stringify(userData);
  
  // Create init data with signature parameter (Telegram looks for "signature" parameter)
  const params = new URLSearchParams();
  params.append('user', userJson);
  params.append('auth_date', authDate.toString());
  params.append('signature', 'mock_signature_for_test');
  
  return params.toString();
};


// Mock VK init data - we'll create valid signature with test key
const generateVKInitData = (userId: string = "747935290"): string => {
  const params = {
    vk_access_token_settings: "",
    vk_app_id: "54448398",
    vk_are_notifications_enabled: "0",
    vk_is_app_user: "1",
    vk_is_favorite: "0",
    vk_language: "ru",
    vk_platform: "desktop_web",
    vk_ref: "other",
    vk_ts: "1771089696",
    vk_user_id: userId
  };

  // Filter and sort vk_ parameters
  const vkParams: Array<{key: string, value: string}> = [];
  const allParams: Record<string, string> = {};
  
  for (const [key, value] of Object.entries(params)) {
    allParams[key] = value;
    if (key.startsWith('vk_')) {
      vkParams.push({ key, value });
    }
  }
  
  // Sort parameters
  vkParams.sort((a, b) => a.key.localeCompare(b.key));
  
  // Create query string for signing
  const queryString = vkParams
    .map(({ key, value }) => `${key}=${encodeURIComponent(value)}`)
    .join('&');
  
  // Calculate sign using test secret key
  const sign = crypto
    .createHmac('sha256', TEST_VK_SECRET_KEY)
    .update(queryString)
    .digest()
    .toString('base64')
    .replace(/\+/g, '-')
    .replace(/\//g, '_')
    .replace(/=$/, '');
  
  // Add sign to params
  allParams['sign'] = sign;
  
  // Build final query string
  const finalParams = [];
  for (const [key, value] of Object.entries(allParams)) {
    finalParams.push(`${key}=${encodeURIComponent(value)}`);
  }
  
  return finalParams.join('&');
};

describe("Public Auth Endpoint Integration Test", () => {
  let customerService: CustomerService;

  beforeEach(async () => {
    customerService = new CustomerService(db as any);
  });

  describe("POST /auth", () => {
    it("should authenticate with valid Telegram init data and create new customer", async () => {
      const telegramUser = {
        id: 270053857,
        first_name: "Anton",
        last_name: "Öldenberg",
        username: "antonoldenberg",
        language_code: "en",
        is_premium: true,
        allows_write_to_pm: true,
        photo_url: "https://t.me/i/userpic/320/qp4hk15qeVGYzV4WX9tt5JoE6IIf3iBpXWT80kJC5to.svg"
      };

      const initData = generateTelegramInitData(telegramUser);
      
      const response = await request(URL)
        .post("/auth")
        .send({ initData })
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("external_id", "270053857");
      expect(response.body).toHaveProperty("first_name", "Anton");
      expect(response.body).toHaveProperty("last_name", "Öldenberg");
      expect(response.body).toHaveProperty("origin", "TELEGRAM");
      expect(response.body).toHaveProperty("balance");
      expect(response.body).toHaveProperty("stats");
      expect(response.body).toHaveProperty("subscription");

      // Verify customer was created in database
      const customer = await customerService.findByExternalId("270053857");
      expect(customer).toBeDefined();
      expect(customer?.first_name).toBe("Anton");
      expect(customer?.last_name).toBe("Öldenberg");
      expect(customer?.origin).toBe("TELEGRAM");

      // Verify cookie was set
      expect(response.headers['set-cookie']).toBeDefined();
      const cookies = response.headers['set-cookie'];
      expect(cookies).toEqual(
        expect.arrayContaining([
          expect.stringContaining('__session=')
        ])
      );
    });

    xit("should authenticate with valid VK init data and create new customer", async () => {
      const initData = generateVKInitData();
      
      const response = await request(URL)
        .post("/auth")
        .send({ initData })
        .expect(200);

      // Verify response structure
      expect(response.body).toHaveProperty("id");
      expect(response.body).toHaveProperty("external_id", "747935290");
      expect(response.body).toHaveProperty("origin", "VK");
      expect(response.body).toHaveProperty("balance");
      expect(response.body).toHaveProperty("stats");
      expect(response.body).toHaveProperty("subscription");

      // Verify customer was created in database
      const customer = await customerService.findByExternalId("747935290");
      expect(customer).toBeDefined();
      expect(customer?.origin).toBe("VK");

      // Verify cookie was set
      expect(response.headers['set-cookie']).toBeDefined();
    });

    xit("should return existing customer with updated last_seen_at for Telegram", async () => {
      // First, create a customer
      const existingCustomer: Customer = {
        id: "test-customer-id",
        external_id: "270053857",
        first_name: "Existing",
        last_name: "User",
        created_at: new Date(Date.now() - 86400000), // Yesterday
        last_seen_at: new Date(Date.now() - 86400000), // Yesterday
        origin: "TELEGRAM",
      };
      await customerService.set(existingCustomer);

      const telegramUser = {
        id: 270053857,
        first_name: "Anton",
        last_name: "Öldenberg",
        username: "antonoldenberg",
        language_code: "en",
        is_premium: true,
        allows_write_to_pm: true,
        photo_url: "https://t.me/i/userpic/320/qp4hk15qeVGYzV4WX9tt5JoE6IIf3iBpXWT80kJC5to.svg"
      };

      const initData = generateTelegramInitData(telegramUser);
      
      const response = await request(URL)
        .post("/auth")
        .send({ initData })
        .expect(200);

      // Verify response contains existing customer data
      expect(response.body).toHaveProperty("id", "test-customer-id");
      expect(response.body).toHaveProperty("external_id", "270053857");
      
      // Verify last_seen_at was updated (should be more recent)
      const updatedCustomer = await customerService.findByExternalId("270053857");
      expect(updatedCustomer).toBeDefined();
      expect(updatedCustomer?.last_seen_at.getTime()).toBeGreaterThan(
        existingCustomer.last_seen_at.getTime()
      );
    });

    xit("should return 400 when initData is missing", async () => {
      const response = await request(URL)
        .post("/auth")
        .send({})
        .expect(400);

      expect(response.body.error.message).toBe("Missing initData query parameter");
    });

    xit("should return 400 when initData has invalid format", async () => {
      const response = await request(URL)
        .post("/auth")
        .send({ initData: "invalid-data-without-signature-or-sign" })
        .expect(400);

      expect(response.body.error.message).toBe("Invalid initData format");
    });

    xit("should return 403 when Telegram initData has invalid signature", async () => {
      const invalidInitData = "user=%7B%22id%22%3A270053857%7D&auth_date=1768229840&signature=invalid_signature";
      
      const response = await request(URL)
        .post("/auth")
        .send({ initData: invalidInitData })
        .expect(403);

      expect(response.body.error.message).toBe("Invalid Telegram init data");
    });

    xit("should return 403 when VK initData has invalid sign", async () => {
      const invalidInitData = "vk_user_id=747935290&vk_ts=1771089696&sign=invalid_sign";
      
      const response = await request(URL)
        .post("/auth")
        .send({ initData: invalidInitData })
        .expect(403);

      expect(response.body.error.message).toBe("Invalid Telegram init data");
    });

    xit("should include balance, stats, and subscription in response", async () => {
      const telegramUser = {
        id: 999999999,
        first_name: "Test",
        last_name: "User",
        username: "testuser",
        language_code: "en",
        is_premium: false,
        allows_write_to_pm: true,
      };

      const initData = generateTelegramInitData(telegramUser);
      
      const response = await request(URL)
        .post("/auth")
        .send({ initData })
        .expect(200);

      // Verify all required fields are present
      expect(response.body).toHaveProperty("balance");
      expect(response.body.balance).toHaveProperty("value");
      expect(response.body.balance).toHaveProperty("owner");
      
      expect(response.body).toHaveProperty("stats");
      expect(response.body.stats).toHaveProperty("number_of_orders");
      expect(response.body.stats).toHaveProperty("number_of_active_orders");
      expect(response.body.stats).toHaveProperty("number_of_free_orders");
      
      expect(response.body).toHaveProperty("subscription");
      // Subscription can be null if not exists
    });
  });
});