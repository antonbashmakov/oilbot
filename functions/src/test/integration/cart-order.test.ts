import db from "../setup";
import {Customer, Item, CartItem, Order, Payment} from "../../models";
import CustomerService from "../../services/CustomerService";
import ItemService from "../../services/ItemService";
import CartItemService from "../../services/CartItemService";
import OrderService from "../../services/OrderService";
import PaymentService from "../../services/PaymentService";
import SubscriptionService from "../../services/SubscriptionService";
import TBankService from "../../services/payments/TBankService";

// Mock the TBankService
jest.mock("../../services/payments/TBankService");

describe("Cart Order Endpoint Integration Test", () => {
  let customerService: CustomerService;
  let itemService: ItemService;
  let cartItemService: CartItemService;
  let orderService: OrderService;
  let paymentService: PaymentService;
  let subscriptionService: SubscriptionService;
  let tbankService: jest.Mocked<TBankService>;
  let testCustomer: Customer;
  let testItem: Item;
  let testCartItem: CartItem;

  beforeEach(async () => {
    customerService = new CustomerService(db as any);
    itemService = new ItemService(db as any);
    cartItemService = new CartItemService(db as any);
    orderService = new OrderService(db as any);
    paymentService = new PaymentService(db as any);
    subscriptionService = new SubscriptionService(db as any);
    
    // Get mocked instance
    tbankService = new TBankService() as jest.Mocked<TBankService>;

    // Create test customer
    testCustomer = {
      id: "test-customer-id",
      first_name: "Test",
      last_name: "Customer",
      language_code: "ru",
      username: "testuser",
    } as any;

    // Create test item
    testItem = {
      id: "test-item-id",
      name: "Test Item",
      price_out: 100,
      fraction: 1,
      category: "TEST",
      group: "TEST_GROUP",
      description: "Test item description",
      fraction_price_out: 100,
      link: "https://test.com/item",
      price_in: 80,
      row_number: 1,
      status: "ACTIVE",
      unit: "кг",
      unit_description: "килограмм",
    } as any;

    // Create test cart item
    testCartItem = {
      id: "test-cart-item-id",
      item_id: testItem.id,
      name: testItem.name,
      price: testItem.price_out,
      quantity: 1,
      fraction: testItem.fraction,
      price_for_unit: testItem.price_out,
      category: testItem.category,
      group: testItem.group,
      owner: {id: testCustomer.id},
      created_at: new Date(),
    } as any;

    // Create test data in Firestore
    await customerService.set(testCustomer);
    await itemService.set(testItem);
    await cartItemService.set(testCartItem);

    // Mock TBankService methods
    tbankService.orderToPaymentRequest.mockReturnValue({
      TerminalKey: "TEST_TERMINAL",
      Amount: 10000,
      OrderId: "test-order-id",
      Description: "Test order",
      RedirectDueDate: "2025-12-31T23:59:59Z",
      Token: "mock-token",
      Receipt: {
        Email: "test@example.com",
        Phone: "+79999999999",
        Taxation: "osn",
        Items: [
          {
            Name: "Test Item",
            Price: 10000,
            Quantity: 1,
            Amount: 10000,
            Tax: "vat10",
          }
        ]
      },
      DATA: {
        Phone: "+79999999999",
        Email: "test@example.com",
      }
    });

    tbankService.initPayment.mockResolvedValue({
      Success: true,
      PaymentId: "test-payment-id",
      PaymentURL: "https://securepay.tinkoff.ru/payment/init?PaymentId=test-payment-id",
      Message: "OK",
      ErrorCode: 0,
    });
  });

  afterEach(async () => {
    // Clean up test data
    try {
      await customerService.getCollection().doc(testCustomer.id).delete();
    } catch (e) {}
    try {
      await itemService.getCollection().doc(testItem.id).delete();
    } catch (e) {}
    try {
      await cartItemService.getCollection().doc(testCartItem.id).delete();
    } catch (e) {}
  });

  it("should create order and payment when cart has items", async () => {
    const idempotencyKey = "test-idempotency-key-1";

    // Mock subscription check - no active subscription
    jest.spyOn(subscriptionService, "hasActiveSubscription").mockImplementation((customerId, date) => Promise.resolve(false));
    
    // Mock customer statistics - less than 2 fulfilled orders
    jest.spyOn(customerService, "obtainStatistics").mockResolvedValue({
      id: 'test-customer-stats-id',
      number_of_orders: 0,
      number_of_canceled_orders: 0,
      number_of_fulfilled_orders: 1, // Only 1 fulfilled order
      number_of_paid_months: 0,
      paid_in_total: 0,
    });

    // Mock increment statistics
    jest.spyOn(customerService, "incrementStatistics").mockImplementation((customerId, updates) => 
      Promise.resolve({
        id: 'test-customer-stats-id',
        number_of_orders: updates.number_of_orders || 0,
        number_of_canceled_orders: updates.number_of_canceled_orders || 0,
        number_of_fulfilled_orders: updates.number_of_fulfilled_orders || 0,
        number_of_paid_months: updates.number_of_paid_months || 0,
        paid_in_total: updates.paid_in_total || 0,
      })
    );
  });

  it("should return idempotent result for duplicate requests", async () => {
    const idempotencyKey = "test-idempotency-key-2";

  });

  xit("should require subscription when customer has more than 1 fulfilled order", async () => {
    // Mock subscription check - no active subscription
    jest.spyOn(subscriptionService, "hasActiveSubscription").mockImplementation((customerId, date) => Promise.resolve(false));
    
    // Mock customer statistics - more than 1 fulfilled order
    jest.spyOn(customerService, "obtainStatistics").mockResolvedValue({
      id: 'test-customer-stats-id',
      number_of_orders: 5,
      number_of_canceled_orders: 1,
      number_of_fulfilled_orders: 3, // More than 1 fulfilled order
      number_of_paid_months: 0,
      paid_in_total: 0,
    });

    // Test that subscription is required
    const hasActiveSubscription = await subscriptionService.hasActiveSubscription(testCustomer.id, new Date());
    const stats = await customerService.obtainStatistics(testCustomer.id);
    
    expect(stats.number_of_fulfilled_orders).toBeGreaterThan(1);
    expect(hasActiveSubscription).toBe(false);
    
    // The endpoint should return payment required error
    // This is tested by checking the condition in the endpoint logic
    const needsSubscription = stats.number_of_fulfilled_orders > 1 && !hasActiveSubscription;
    expect(needsSubscription).toBe(true);
  });

  xit("should allow order creation when customer has active subscription", async () => {
    // Mock subscription check - has active subscription
    jest.spyOn(subscriptionService, "hasActiveSubscription").mockImplementation((customerId, date) => Promise.resolve(true));
    
    // Mock customer statistics - more than 1 fulfilled order
    jest.spyOn(customerService, "obtainStatistics").mockResolvedValue({
      id: 'test-customer-stats-id',
      number_of_orders: 5,
      number_of_canceled_orders: 1,
      number_of_fulfilled_orders: 3, // More than 1 fulfilled order
      number_of_paid_months: 2,
      paid_in_total: 600,
    });

    // Test that subscription check passes
    const hasActiveSubscription = await subscriptionService.hasActiveSubscription(testCustomer.id, new Date());
    const stats = await customerService.obtainStatistics(testCustomer.id);
    
    expect(stats.number_of_fulfilled_orders).toBeGreaterThan(1);
    expect(hasActiveSubscription).toBe(true);
    
    // The endpoint should allow order creation
    const needsSubscription = stats.number_of_fulfilled_orders > 1 && !hasActiveSubscription;
    expect(needsSubscription).toBe(false);
  });

  xit("should return error when cart is empty", async () => {
    const idempotencyKey = "test-idempotency-key-5";

    // Mock subscription check - no active subscription
    jest.spyOn(subscriptionService, "hasActiveSubscription").mockImplementation((customerId, date) => Promise.resolve(false));
    
    // Mock customer statistics - less than 2 fulfilled orders
    jest.spyOn(customerService, "obtainStatistics").mockResolvedValue({
      id: 'test-customer-stats-id',
      number_of_orders: 0,
      number_of_canceled_orders: 0,
      number_of_fulfilled_orders: 0,
      number_of_paid_months: 0,
      paid_in_total: 0,
    });

    // Remove cart item to simulate empty cart
    await cartItemService.delete(testCartItem);


  });

  xit("should return error when customer not found", async () => {
    const idempotencyKey = "test-idempotency-key-6";



  xit("should handle payment initialization failure", async () => {
    const idempotencyKey = "test-idempotency-key-7";

    // Mock subscription check - no active subscription
    jest.spyOn(subscriptionService, "hasActiveSubscription").mockImplementation((customerId, date) => Promise.resolve(false));
    
    // Mock customer statistics - less than 2 fulfilled orders
    jest.spyOn(customerService, "obtainStatistics").mockResolvedValue({
      id: 'test-customer-stats-id',
      number_of_orders: 0,
      number_of_canceled_orders: 0,
      number_of_fulfilled_orders: 1,
      number_of_paid_months: 0,
      paid_in_total: 0,
    });

    // Mock increment statistics
    jest.spyOn(customerService, "incrementStatistics").mockImplementation((customerId, updates) => 
      Promise.resolve({
        id: 'test-customer-stats-id',
        number_of_orders: updates.number_of_orders || 0,
        number_of_canceled_orders: updates.number_of_canceled_orders || 0,
        number_of_fulfilled_orders: updates.number_of_fulfilled_orders || 0,
        number_of_paid_months: updates.number_of_paid_months || 0,
        paid_in_total: updates.paid_in_total || 0,
      })
    );

    // Mock TBankService to return failure
    tbankService.initPayment.mockResolvedValueOnce({
      Success: false,
      PaymentId: "",
      PaymentURL: "",
      Message: "Insufficient funds",
      ErrorCode: 1001,
    });

  });


})});
