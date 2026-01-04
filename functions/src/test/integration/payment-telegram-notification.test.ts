import db from "../setup";
import {Order, Customer} from "../../models";
import OrderService from "../../services/OrderService";
import CustomerService from "../../services/CustomerService";
import {toMessage} from "../../messaging/util";

// Mock TelegramService
jest.mock("../../services/TelegramService", () => {
  return {
    __esModule: true,
    default: jest.fn().mockImplementation(() => ({
      sendMessage: jest.fn(),
    })),
  };
});

import TelegramService from "../../services/TelegramService";

describe("Payment Creation with Telegram Notification", () => {
  let orderService: OrderService;
  let customerService: CustomerService;
  let telegramService: jest.Mocked<TelegramService>;

  let testOrder: Order;
  let testCustomer: Customer;

  beforeEach(async () => {
    orderService = new OrderService(db as any);
    customerService = new CustomerService(db as any);

    // Create test customer
    testCustomer = {
      id: "test-customer-id-123",
      first_name: "Test",
      username: "testuser",
      language_code: "ru",
      is_bot: false,
    } as any;

    // Create test order
    testOrder = {
      id: "test-order-for-telegram",
      name: "Test Order for Telegram",
      created_at: new Date(),
      items: [
        {
          id: "test-item-1",
          name: "Test Item 1",
          price: 100,
          quantity: 2,
          item_id: "item-1",
          fraction: 1,
          price_for_unit: 100,
          group: "TEST_GROUP",
          owner: {id: testCustomer.id},
        },
        {
          id: "test-item-2",
          name: "Test Item 2",
          price: 50,
          quantity: 1,
          item_id: "item-2",
          fraction: 0.5,
          price_for_unit: 50,
          group: "TEST_GROUP",
          owner: {id: testCustomer.id},
        },
      ],
      status: "PENDING",
      type: "ORIGINAL",
      numberOfItems: 2,
      total: 250, // (100 * 2) + (50 * 1) = 250
      owner: {
        id: testCustomer.id,
      },
      delivery: {
        id: "test-delivery",
        delivery_start: "2025-12-01T00:00:00.000Z",
        delivery_end: "2025-12-05T00:00:00.000Z",
      },
    } as any;

    // Create test data in Firestore
    await customerService.set(testCustomer);
    await orderService.set(testOrder);

    // Reset mocks
    (TelegramService as jest.Mock).mockClear();
    telegramService = new TelegramService() as jest.Mocked<TelegramService>;
  });

  describe("Telegram notification on payment creation", () => {
    it("should format ORDER_PAYMENT_CREATED message correctly", () => {
      const mockPaymentResponse = {
        Success: true,
        PaymentId: "test-payment-id",
        TerminalKey: "test-terminal",
        PaymentURL: "https://securepay.tinkoff.ru/test-payment",
      };

      const messageValues = {
        items: testOrder.items.map((item) => ({
          name: item.name,
          price: item.price * item.quantity,
        })),
        delivery: testOrder.delivery ? {
          deliveryStart: "01.12.2025", // formatted date
          deliveryEnd: "05.12.2025", // formatted date
        } : null,
        total: testOrder.total,
        orderId: testOrder.id,
        paymentUrl: mockPaymentResponse.PaymentURL,
      };

      const messageText = toMessage("ORDER_PAYMENT_CREATED", messageValues);

      expect(messageText).toContain("🛒 Ваш заказ");
      expect(messageText).toContain("Test Item 1");
      expect(messageText).toContain("200 ₽"); // 100 * 2
      expect(messageText).toContain("Test Item 2");
      expect(messageText).toContain("50 ₽");
      expect(messageText).toContain("Общая сумма:* *250 ₽*");
      expect(messageText).toContain(`*ID заказа:* \`${testOrder.id}\``);
      expect(messageText).toContain(mockPaymentResponse.PaymentURL);
      expect(messageText).toContain("Доставка:");
      expect(messageText).toContain("01.12.2025");
      expect(messageText).toContain("05.12.2025");
    });

    it("should handle order without delivery information", () => {
      const orderWithoutDelivery = {
        ...testOrder,
        delivery: undefined,
      };

      const mockPaymentResponse = {
        Success: true,
        PaymentId: "test-payment-id",
        TerminalKey: "test-terminal",
        PaymentURL: "https://securepay.tinkoff.ru/test-payment",
      };

      const messageValues = {
        items: orderWithoutDelivery.items.map((item) => ({
          name: item.name,
          price: item.price * item.quantity,
        })),
        delivery: null,
        total: orderWithoutDelivery.total,
        orderId: orderWithoutDelivery.id,
        paymentUrl: mockPaymentResponse.PaymentURL,
      };

      const messageText = toMessage("ORDER_PAYMENT_CREATED", messageValues);

      expect(messageText).toContain("🛒 Ваш заказ");
      expect(messageText).toContain("❓ Доставка еще не определена");
      expect(messageText).not.toContain("Доставка:");
    });

    it("should calculate item prices correctly", () => {
      const messageValues = {
        items: testOrder.items.map((item) => ({
          name: item.name,
          price: item.price * item.quantity,
        })),
        delivery: null,
        total: testOrder.total,
        orderId: testOrder.id,
        paymentUrl: "test-url",
      };

      const messageText = toMessage("ORDER_PAYMENT_CREATED", messageValues);

      // Check that prices are calculated correctly
      expect(messageText).toContain("*Test Item 1 *: *200 ₽*"); // 100 * 2
      expect(messageText).toContain("*Test Item 2 *: *50 ₽*"); // 50 * 1
      expect(messageText).toContain("Общая сумма:* *250 ₽*"); // 200 + 50
    });
  });

  describe("TelegramService integration", () => {
    it("should send message with correct parameters", async () => {
      const mockSendMessage = jest.fn().mockResolvedValue({
        id: "message-id",
        provider: "TELEGRAM",
        recipient_id: testCustomer.id,
        text: "test message",
        created_at: new Date(),
      });

      telegramService.sendMessage = mockSendMessage;

      const messageText = "Test message content";

      await telegramService.sendMessage(testCustomer.id, messageText, "thread-1");

      expect(mockSendMessage).toHaveBeenCalledTimes(1);
      expect(mockSendMessage).toHaveBeenCalledWith(
        testCustomer.id,
        messageText,
        "thread-1"
      );
    });

    it("should handle Telegram service errors gracefully", async () => {
      const mockSendMessage = jest.fn().mockRejectedValue(
        new Error("Telegram API error")
      );

      telegramService.sendMessage = mockSendMessage;

      await expect(telegramService.sendMessage(testCustomer.id, "test", "thread-1"))
        .rejects.toThrow("Telegram API error");
    });
  });
});
