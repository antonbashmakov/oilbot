import TBankService from "../../services/payments/TBankService";
import { Order } from "../../models";
import * as moment from "moment";

describe("TBankService Unit Tests", () => {
  let tbankService: TBankService;
  let testOrder: Order;

  beforeEach(() => {
    tbankService = new TBankService();
    
    testOrder = {
      id: "test-order-123",
      name: "Test Order",
      created_at: new Date(),
      items: [
        {
          id: "test-item-1",
          name: "Test Item 1",
          price: 100,
          quantity: 1,
          item_id: "item-1",
          fraction: 1,
          price_for_unit: 100,
          group: "TEST_GROUP",
          owner: { id: "test-customer-id" },
        },
      ],
      status: "PENDING",
      type: "ORIGINAL",
      numberOfItems: 1,
      total: 100,
      owner: {
        id: "test-customer-id",
      },
    } as any;
  });

  describe("orderToPaymentRequest", () => {
    it("should include RedirectDueDate field in payment request", () => {
      const paymentRequest = tbankService.orderToPaymentRequest(testOrder);
      
      expect(paymentRequest).toHaveProperty("RedirectDueDate");
      expect(typeof paymentRequest.RedirectDueDate).toBe("string");
    });

    it("should format RedirectDueDate correctly", () => {
      const paymentRequest = tbankService.orderToPaymentRequest(testOrder);
      const redirectDueDate = paymentRequest.RedirectDueDate;
      
      // Check format: YYYY-MM-DDTHH:mm:ssZ
      const dateRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}[+-]\d{2}:\d{2}$/;
      expect(redirectDueDate).toMatch(dateRegex);
    });

    it("should set RedirectDueDate to one month ahead", () => {
      const paymentRequest = tbankService.orderToPaymentRequest(testOrder);
      const redirectDueDate = moment(paymentRequest.RedirectDueDate);
      
      // Check that the date is approximately one month ahead
      // Allow for small differences due to timezone handling
      const expectedDate = moment().add(1, 'month');
      const diffInDays = Math.abs(redirectDueDate.diff(expectedDate, 'days'));
      
      expect(diffInDays).toBeLessThanOrEqual(1); // Allow 1 day difference for edge cases
    });

    it("should include all required fields in payment request", () => {
      const paymentRequest = tbankService.orderToPaymentRequest(testOrder);
      
      expect(paymentRequest).toHaveProperty("TerminalKey");
      expect(paymentRequest).toHaveProperty("Amount");
      expect(paymentRequest.Amount).toBe(testOrder.total * 100); // Convert to kopecks
      expect(paymentRequest).toHaveProperty("OrderId", testOrder.id);
      expect(paymentRequest).toHaveProperty("Description");
      expect(paymentRequest).toHaveProperty("DATA");
      expect(paymentRequest).toHaveProperty("Receipt");
      expect(paymentRequest).toHaveProperty("Token");
    });

    it("should convert item prices to kopecks", () => {
      const paymentRequest = tbankService.orderToPaymentRequest(testOrder);
      
      expect(paymentRequest.Receipt.Items).toHaveLength(1);
      expect(paymentRequest.Receipt.Items[0].Price).toBe(10000); // 100 * 100
      expect(paymentRequest.Receipt.Items[0].Amount).toBe(10000); // 100 * 100
    });
  });

  describe("generateToken", () => {
    it("should generate a SHA256 hash", () => {
      const testObject = {
        TerminalKey: "test-terminal",
        Amount: 10000,
        OrderId: "test-order",
        Password: "test-password",
      };
      
      const token = tbankService["generateToken"](testObject);
      
      // SHA256 hash should be 64 characters (hex)
      expect(token).toHaveLength(64);
      expect(token).toMatch(/^[a-f0-9]{64}$/);
    });

    it("should sort object keys before generating token", () => {
      const testObject1 = { b: "2", a: "1", c: "3" };
      const testObject2 = { a: "1", b: "2", c: "3" };
      
      const token1 = tbankService["generateToken"](testObject1);
      const token2 = tbankService["generateToken"](testObject2);
      
      // Should generate same token regardless of key order
      expect(token1).toBe(token2);
    });
  });
});
