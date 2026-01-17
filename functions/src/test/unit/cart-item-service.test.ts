import CartItemService from "../../services/CartItemService";
import { Item, Customer } from "../../models";
import * as admin from "firebase-admin";

// Mock Firebase
jest.mock("firebase-admin", () => {
  const mockFirestore = {
    collection: jest.fn(() => ({
      doc: jest.fn(() => ({
        set: jest.fn(() => Promise.resolve()),
        get: jest.fn(),
        update: jest.fn(),
        delete: jest.fn(),
      })),
      get: jest.fn(),
      where: jest.fn(),
    })),
    recursiveDelete: jest.fn(),
    settings: jest.fn(),
    terminate: jest.fn(),
    runTransaction: jest.fn(),
  };

  return {
    initializeApp: jest.fn(),
    firestore: jest.fn(() => mockFirestore),
  };
});

describe("CartItemService Unit Tests", () => {
  let cartItemService: CartItemService;
  let mockFirestore: any;
  let mockCollection: any;
  let mockDoc: any;
  let mockSet: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Setup mock firestore
    mockFirestore = (admin as any).firestore();
    mockCollection = mockFirestore.collection;
    mockDoc = {
      set: jest.fn(() => Promise.resolve()),
      get: jest.fn(),
      update: jest.fn(),
      delete: jest.fn(),
    };
    mockSet = mockDoc.set;

    // Mock collection to return doc with id
    const mockDocRef = {
      id: "mock-doc-id-123",
      ...mockDoc,
    };
    
    mockCollection.mockReturnValue({
      doc: jest.fn(() => mockDocRef),
      get: jest.fn(),
      where: jest.fn(),
    });

    // Create service instance
    cartItemService = new CartItemService(mockFirestore as any);
  });

  describe("addToCart", () => {
    it("should create cart item with price set to item.fraction_price_out", async () => {
      // Arrange
      const mockItem: Item = {
        id: "item-123",
        name: "Test Item",
        fraction_price_out: 150.75,
        price_out: 200.50,
        fraction: 0.75,
        category: "test-category",
        group: "test-group",
      } as any;

      const mockCustomer: Customer = {
        id: "customer-456",
      } as any;

      // Mock the set method to capture what was saved and return data with id
      let savedData: any = null;
      mockSet.mockImplementation((data) => {
        savedData = { ...data, id: "mock-doc-id-123" };
        return Promise.resolve();
      });

      // Act
      const result = await cartItemService.addToCart(mockItem, mockCustomer);

      // Assert
      expect(mockCollection).toHaveBeenCalledWith("CART_ITEMS");
      expect(mockSet).toHaveBeenCalled();

      // Check that price is set to fraction_price_out
      expect(savedData).toBeDefined();
      expect(savedData.price).toBe(mockItem.fraction_price_out);

      // Verify other fields
      expect(savedData.item_id).toBe(mockItem.id);
      expect(savedData.name).toBe(mockItem.name);
      expect(savedData.quantity).toBe(1);
      expect(savedData.fraction).toBe(mockItem.fraction);
      expect(savedData.price_for_unit).toBe(mockItem.price_out);
      expect(savedData.category).toBe(mockItem.category);
      expect(savedData.group).toBe(mockItem.group);
      expect(savedData.owner).toEqual({ id: "customer-456" });
      expect(savedData.created_at).toBeInstanceOf(Date);

      // The result should have an id (set by the add method)
      expect(result.id).toBeDefined();
    });

    it("should handle different fraction_price_out values correctly", async () => {
      // Arrange
      const testCases = [
        { fraction_price_out: 0, price_out: 100 },
        { fraction_price_out: 99.99, price_out: 199.99 },
        { fraction_price_out: 1000, price_out: 1500 },
        { fraction_price_out: -50, price_out: 100 }, // Negative price edge case
      ];

      for (const testCase of testCases) {
        jest.clearAllMocks();

        const mockItem: Item = {
          id: "item-test",
          name: "Test Item",
          fraction_price_out: testCase.fraction_price_out,
          price_out: testCase.price_out,
          fraction: 1,
          category: "test",
          group: "test",
        } as any;

        const mockCustomer: Customer = {
          id: "customer-test",
        } as any;

        let savedData: any = null;
        mockSet.mockImplementation((data) => {
          savedData = { ...data, id: "mock-doc-id-123" };
          return Promise.resolve();
        });

        // Act
        await cartItemService.addToCart(mockItem, mockCustomer);

        // Assert
        expect(savedData.price).toBe(testCase.fraction_price_out);
        expect(savedData.price_for_unit).toBe(testCase.price_out);
      }
    });

    it("should convert customer id to string in owner field", async () => {
      // Arrange
      const mockItem: Item = {
        id: "item-123",
        name: "Test Item",
        fraction_price_out: 100,
        price_out: 150,
        fraction: 1,
        category: "test",
        group: "test",
      } as any;

      // Test with numeric customer id
      const mockCustomer: Customer = {
        id: 789 as any, // Numeric ID
      } as any;

      let savedData: any = null;
      mockSet.mockImplementation((data) => {
        savedData = { ...data, id: "mock-doc-id-123" };
        return Promise.resolve();
      });

      // Act
      await cartItemService.addToCart(mockItem, mockCustomer);

      // Assert
      expect(savedData.owner.id).toBe("789"); // Should be converted to string
    });
  });

  describe("getCollectionName", () => {
    it("should return 'CART_ITEMS'", () => {
      expect(cartItemService.getCollectionName()).toBe("CART_ITEMS");
    });
  });

  describe("getExcludedFields", () => {
    it("should return ['created_at']", () => {
      expect(cartItemService.getExcludedFields()).toEqual(["created_at"]);
    });
  });
});
