import OrderService from "../../services/OrderService";
import { Customer, CartItem, DeliveryRef } from "../../models";
import * as admin from "firebase-admin";

// Mock Firebase
jest.mock("firebase-admin", () => {
  const mockFirestore = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        id: "mock-order-id-123",
        set: jest.fn(() => Promise.resolve()),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      where: jest.fn(() => ({
        get: jest.fn(),
        limit: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
      get: jest.fn(),
    })),
    batch: jest.fn(() => ({
      set: jest.fn(),
      delete: jest.fn(),
      commit: jest.fn(() => Promise.resolve()),
    })),
    settings: jest.fn(),
    terminate: jest.fn(),
    runTransaction: jest.fn(),
  };

  return {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => mockFirestore),
  };
});

describe("OrderService Unit Tests", () => {
  let orderService: OrderService;
  let mockFirestore: any;
  let mockCollection: any;
  let mockBatch: jest.Mock;
  let mockBatchInstance: any;
  let mockBatchCommit: jest.Mock;
  let mockBatchSet: jest.Mock;
  let mockBatchDelete: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock firestore
    mockFirestore = (admin as any).firestore();
    mockCollection = mockFirestore.collection;
    
    // Create batch instance with mock methods
    mockBatchCommit = jest.fn(() => Promise.resolve());
    mockBatchSet = jest.fn();
    mockBatchDelete = jest.fn();
    
    mockBatchInstance = {
      set: mockBatchSet,
      delete: mockBatchDelete,
      commit: mockBatchCommit,
    };
    
    mockBatch = mockFirestore.batch;
    mockBatch.mockReturnValue(mockBatchInstance);

    // Mock collection to return doc with id
    const mockDocRef = {
      id: "mock-order-id-123",
      set: jest.fn(() => Promise.resolve()),
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    
    mockCollection.mockReturnValue({
      doc: jest.fn(() => mockDocRef),
      where: jest.fn(() => ({
        get: jest.fn(),
        limit: jest.fn(() => ({
          get: jest.fn(),
        })),
      })),
      get: jest.fn(),
    });

    // Create service instance
    orderService = new OrderService(mockFirestore as any);
  });

  describe("createOrderFromCart", () => {
    it("should create order with correct total calculation for member", async () => {
      // Arrange
      const mockCustomer: Customer = {
        id: "customer-456",
        first_name: "John",
      } as any;

      const mockCartItems: CartItem[] = [
        {
          id: "cart-item-1",
          name: "Item 1",
          price: 100, // member price
          non_member_price: 120,
          quantity: 2,
        } as any,
        {
          id: "cart-item-2",
          name: "Item 2",
          price: 50, // member price
          non_member_price: 60,
          quantity: 3,
        } as any,
      ];

      const mockDelivery: DeliveryRef = {
        id: "delivery-789",
        order_deadline: new Date(),
        delivery_start: new Date(),
        delivery_end: new Date(),
      } as any;

      const isMember = true;

      // Act
      const result = await orderService.createOrderFromCart(
        mockCustomer,
        mockCartItems,
        mockDelivery,
        isMember
      );

      // Assert
      expect(mockCollection).toHaveBeenCalledWith("ORDERS");
      expect(mockBatch).toHaveBeenCalled();
      expect(mockBatchCommit).toHaveBeenCalled();

      // Check that batch.set was called with order data
      expect(mockBatchSet).toHaveBeenCalled();

      // Verify order properties
      expect(result.id).toBe("mock-order-id-123");
      expect(result.name).toBe("John");
      expect(result.items).toHaveLength(2);
      expect(result.status).toBe("PENDING");
      expect(result.type).toBe("ORIGINAL");
      expect(result.number_of_items).toBe(2);
      expect(result.owner).toEqual({ id: "customer-456" });
      expect(result.created_at).toBeInstanceOf(Date);
      expect(result.updated_at).toBeInstanceOf(Date);
      expect(result.delivery).toEqual({
        id: "delivery-789",
        order_deadline: mockDelivery.order_deadline,
        delivery_start: mockDelivery.delivery_start,
        delivery_end: mockDelivery.delivery_end,
      });

      // Test the main requirement: sum of items prices equals total
      // For member: price = item.price (not non_member_price)
      // Item 1: 100 * 2 = 200
      // Item 2: 50 * 3 = 150
      // Total: 200 + 150 = 350
      const expectedTotal = (100 * 2) + (50 * 3);
      expect(result.total).toBe(expectedTotal);

      // Verify items were updated with correct prices for member
      expect(result.items[0].price).toBe(100); // member price
      expect(result.items[1].price).toBe(50); // member price
    });

    it("should create order with correct total calculation for non-member", async () => {
      // Arrange
      const mockCustomer: Customer = {
        id: "customer-456",
        first_name: "Jane",
      } as any;

      const mockCartItems: CartItem[] = [
        {
          id: "cart-item-1",
          name: "Item 1",
          price: 100, // member price
          non_member_price: 120,
          quantity: 1,
        } as any,
        {
          id: "cart-item-2",
          name: "Item 2",
          price: 50, // member price
          non_member_price: 60,
          quantity: 2,
        } as any,
      ];

      const mockDelivery: DeliveryRef = {
        id: "delivery-789",
        order_deadline: new Date(),
        delivery_start: new Date(),
        delivery_end: new Date(),
      } as any;

      const isMember = false;

      // Act
      const result = await orderService.createOrderFromCart(
        mockCustomer,
        mockCartItems,
        mockDelivery,
        isMember
      );

      // Assert
      // For non-member: price = item.non_member_price
      // Item 1: 120 * 1 = 120
      // Item 2: 60 * 2 = 120
      // Total: 120 + 120 = 240
      const expectedTotal = (120 * 1) + (60 * 2);
      expect(result.total).toBe(expectedTotal);

      // Verify items were updated with correct prices for non-member
      expect(result.items[0].price).toBe(120); // non-member price
      expect(result.items[1].price).toBe(60); // non-member price
    });

    it("should create order without delivery when delivery is not provided", async () => {
      // Arrange
      const mockCustomer: Customer = {
        id: "customer-456",
        first_name: "Bob",
      } as any;

      const mockCartItems: CartItem[] = [
        {
          id: "cart-item-1",
          name: "Item 1",
          price: 100,
          non_member_price: 120,
          quantity: 1,
        } as any,
      ];

      const isMember = true;

      // Act
      const result = await orderService.createOrderFromCart(
        mockCustomer,
        mockCartItems,
        undefined as any, // No delivery
        isMember
      );

      // Assert
      expect(result.delivery).toBeUndefined();
      expect(result.total).toBe(100 * 1); // 100 * 1 = 100
    });

    it("should delete cart items after creating order", async () => {
      // Arrange
      const mockCustomer: Customer = {
        id: "customer-456",
        first_name: "Alice",
      } as any;

      const mockCartItems: CartItem[] = [
        {
          id: "cart-item-1",
          name: "Item 1",
          price: 100,
          non_member_price: 120,
          quantity: 2,
        } as any,
        {
          id: "cart-item-2",
          name: "Item 2",
          price: 50,
          non_member_price: 60,
          quantity: 1,
        } as any,
      ];

      const mockDelivery: DeliveryRef = {
        id: "delivery-789",
        order_deadline: new Date(),
        delivery_start: new Date(),
        delivery_end: new Date(),
      } as any;

      const isMember = true;

      // Mock CART_ITEMS collection
      const mockCartItemsCollection = {
        doc: jest.fn((id: string) => ({
          id: `cart-doc-${id}`,
        })),
      };
      mockCollection.mockImplementation((collectionName: string) => {
        if (collectionName === "CART_ITEMS") {
          return mockCartItemsCollection;
        }
        return {
          doc: jest.fn(() => ({
            id: "mock-order-id-123",
            set: jest.fn(() => Promise.resolve()),
            get: jest.fn(),
            update: jest.fn(),
            delete: jest.fn(),
          })),
          where: jest.fn(() => ({
            get: jest.fn(),
            limit: jest.fn(() => ({
              get: jest.fn(),
            })),
          })),
          get: jest.fn(),
        };
      });

      // Act
      await orderService.createOrderFromCart(
        mockCustomer,
        mockCartItems,
        mockDelivery,
        isMember
      );

      // Assert
      // Verify cart items were deleted
      expect(mockBatchDelete).toHaveBeenCalledTimes(2);
      expect(mockCollection).toHaveBeenCalledWith("CART_ITEMS");
      expect(mockCartItemsCollection.doc).toHaveBeenCalledWith("cart-item-1");
      expect(mockCartItemsCollection.doc).toHaveBeenCalledWith("cart-item-2");
    });

    it("should handle empty cart items array", async () => {
      // Arrange
      const mockCustomer: Customer = {
        id: "customer-456",
        first_name: "Empty",
      } as any;

      const mockCartItems: CartItem[] = [];

      const mockDelivery: DeliveryRef = {
        id: "delivery-789",
        order_deadline: new Date(),
        delivery_start: new Date(),
        delivery_end: new Date(),
      } as any;

      const isMember = true;

      // Act
      const result = await orderService.createOrderFromCart(
        mockCustomer,
        mockCartItems,
        mockDelivery,
        isMember
      );

      // Assert
      expect(result.items).toHaveLength(0);
      expect(result.number_of_items).toBe(0);
      expect(result.total).toBe(0);
      expect(mockBatchDelete).not.toHaveBeenCalled(); // No cart items to delete
    });

    it("should calculate total correctly with decimal prices", async () => {
      // Arrange
      const mockCustomer: Customer = {
        id: "customer-456",
        first_name: "Decimal",
      } as any;

      const mockCartItems: CartItem[] = [
        {
          id: "cart-item-1",
          name: "Item 1",
          price: 99.99,
          non_member_price: 119.99,
          quantity: 2,
        } as any,
        {
          id: "cart-item-2",
          name: "Item 2",
          price: 49.50,
          non_member_price: 59.50,
          quantity: 3,
        } as any,
      ];

      const mockDelivery: DeliveryRef = {
        id: "delivery-789",
        order_deadline: new Date(),
        delivery_start: new Date(),
        delivery_end: new Date(),
      } as any;

      const isMember = true;

      // Act
      const result = await orderService.createOrderFromCart(
        mockCustomer,
        mockCartItems,
        mockDelivery,
        isMember
      );

      // Assert
      // For member: price = item.price
      // Item 1: 99.99 * 2 = 199.98
      // Item 2: 49.50 * 3 = 148.50
      // Total: 199.98 + 148.50 = 348.48
      const expectedTotal = (99.99 * 2) + (49.50 * 3);
      expect(result.total).toBeCloseTo(expectedTotal, 2);
    });

    it("should convert customer id to string in owner field", async () => {
      // Arrange
      const mockCustomer: Customer = {
        id: 12345 as any, // Numeric ID
        first_name: "Numeric",
      } as any;

      const mockCartItems: CartItem[] = [
        {
          id: "cart-item-1",
          name: "Item 1",
          price: 100,
          non_member_price: 120,
          quantity: 1,
        } as any,
      ];

      const isMember = true;

      // Act
      const result = await orderService.createOrderFromCart(
        mockCustomer,
        mockCartItems,
        undefined as any,
        isMember
      );

      // Assert
      expect(result.owner.id).toBe("12345"); // Should be converted to string
    });
  });

});