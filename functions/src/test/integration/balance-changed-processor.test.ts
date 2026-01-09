import db from "../setup";
import {BalanceChangedEvent} from "../../models";
import BalanceChangedProcessor from "../../services/events/BalanceChangedProcessor";
import CustomerBalanceService from "../../services/CustomerBalanceService";
import CustomerService from "../../services/CustomerService";

describe("BalanceChangedProcessor Integration Test", () => {
  let processor: BalanceChangedProcessor;
  let customerBalanceService: CustomerBalanceService;
  let customerService: CustomerService;

  let createdCustomer: any;

  beforeEach(async () => {
    // const unauthContext = testApp.unauthenticatedContext();
    // const db = unauthContext.firestore();

    processor = new BalanceChangedProcessor(db as any);
    customerBalanceService = new CustomerBalanceService(db as any);
    customerService = new CustomerService(db as any);

    // Create test customer
    createdCustomer = {
      created_at: new Date(),
      id: "test-customer-id-balance",
      first_name: "Test",
      last_name: "Customer",
      email: "test@example.com",
      phone: "+1234567890",
    } as any;

    // Create test data in Firestore
    await customerService.set(createdCustomer);
  });

  it("should update customer balance after successful processing", async () => {
    // Create test event
    const testEvent: BalanceChangedEvent = {
      id: "test-event-id-balance",
      idempotent_key: "idempotent-key-balance-test",
      type: "BALANCE_CHANGED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        customer_id: createdCustomer.id,
        change: -50, // Negative change (refund)
        reason: "ORDER_RESOLVED"
      },
    };

    // Verify no balance exists initially
    let balance = await customerBalanceService.find(createdCustomer.id);
    expect(balance).toBeUndefined();

    // Process the event, emulate multiple calls (idempotency test)
    await processor.process(testEvent);
    await processor.process(testEvent);
    await processor.process(testEvent);
    await processor.process(testEvent);
    await processor.process(testEvent);

    // Verify that balance was created and updated correctly
    balance = await customerBalanceService.find(createdCustomer.id);

    expect(balance).toBeDefined();
    expect(balance!.owner.id).toBe(createdCustomer.id);
    expect(balance!.value).toBe(-50); // Should be exactly -50, not -250 (idempotency)
    expect(balance!.created_at).toBeInstanceOf(Date);
    expect(balance!.updated_at).toBeInstanceOf(Date);
  });

  it("should handle positive balance changes", async () => {
    // Create test event with positive change
    const testEvent: BalanceChangedEvent = {
      id: "test-event-id-balance-positive",
      idempotent_key: "idempotent-key-balance-positive",
      type: "BALANCE_CHANGED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        customer_id: createdCustomer.id,
        change: 100, // Positive change (credit)
        reason: "ORDER_RESOLVED"
      },
    };

    // Process the event
    await processor.process(testEvent);

    // Verify that balance was created and updated correctly
    const balance = await customerBalanceService.find(createdCustomer.id);

    expect(balance).toBeDefined();
    expect(balance?.owner.id).toBe(createdCustomer.id);
    expect(balance?.value).toBe(100);
  });

  it("should throw error when idempotent key is missing", async () => {
    // Create test event without idempotent key
    const testEvent: BalanceChangedEvent = {
      id: "test-event-id-balance-no-key",
      type: "BALANCE_CHANGED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        customer_id: createdCustomer.id,
        change: 50,
        reason: "ORDER_RESOLVED"
      },
    };

    // Verify that processing throws an error
    await expect(processor.process(testEvent))
      .rejects
      .toThrow("Idempotent key is missing on BalanceChangedEvent");

    // Verify no balance was created
    const balance = await customerBalanceService.find(createdCustomer.id);
    expect(balance).toBeUndefined();
  });

  it("should accumulate balance changes across different events", async () => {
    // Create first event
    const firstEvent: BalanceChangedEvent = {
      id: "test-event-id-balance-1",
      idempotent_key: "idempotent-key-balance-1",
      type: "BALANCE_CHANGED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        customer_id: createdCustomer.id,
        change: 100,
        reason: "ORDER_RESOLVED"
      },
    };

    // Create second event
    const secondEvent: BalanceChangedEvent = {
      id: "test-event-id-balance-2",
      idempotent_key: "idempotent-key-balance-2",
      type: "BALANCE_CHANGED",
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        customer_id: createdCustomer.id,
        change: -30,
        reason: "ORDER_RESOLVED"
      },
    };

    // Process both events
    await processor.process(firstEvent);
    await processor.process(secondEvent);

    // Verify that balance accumulated correctly
    const balance = await customerBalanceService.find(createdCustomer.id);

    expect(balance).toBeDefined();
    expect(balance?.value).toBe(70); // 100 - 30 = 70
  });
});
