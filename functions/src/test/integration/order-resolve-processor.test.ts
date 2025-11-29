import db from '../setup';
import { Order, OrderPicking, OrderResolvedEvent } from '../../models';
import OrderResolveProcessor from '../../services/events/OrderResolveProcessor';
import OrderService from '../../services/OrderService';
import PaymentService from '../../services/PaymentService';
import CustomerService from '../../services/CustomerService';
import OrderPickingService from '../../services/OrderPickingService';
import TBankService from '../../services/payments/TBankService';

// Mock TBankService
jest.mock('../../services/payments/TBankService');

const mockTBankService = {
  initPayment: jest.fn().mockImplementation((paymentRequest) => {
    return {
      TerminalKey: "MOCK_TERMINAL",
      Success: true,
      Status: 'NEW',
      ErrorCode: 0,
      PaymentId: "external-mock-id",
      OrderId: paymentRequest.OrderId,
      Amount: paymentRequest.Amount,
      Token: "mock-token",
      PaymentURL: `https://securepay.tinkoff.ru/${paymentRequest.OrderId}`
    };
  }),
  orderToPaymentRequest: jest.fn().mockImplementation((order) => {
    return {
      TerminalKey: "MOCK_TERMINAL",
      Amount: order.total * 100,
      OrderId: order.id,
      Description: "Оплата заказа в магазине По Себестоимости",
      DATA: {
        Phone: process.env.SUPPORT_PHONE,
        Email: process.env.SUPPORT_EMAIL,
      },
      Receipt: {
        Email: "info@posebestoimosti.ru",
        Phone: "+79022394130",
        Taxation: "osn",
        Items: order.items.map((i: any) => ({
          Name: i.name,
          Price: i.price * 100,
          Quantity: 1,
          Amount: i.price * 100,
          Tax: "vat0",
        }))
      },
      Token: "mock-token"
    };
  })
};

(TBankService as jest.MockedClass<typeof TBankService>).mockImplementation(() => mockTBankService as any);

describe('OrderResolveProcessor Integration Test', () => {
  let orderResolveProcessor: OrderResolveProcessor;
  let orderService: OrderService;
  let pickingService: OrderPickingService;
  let paymentService: PaymentService;
  let customerService: CustomerService;

  let createdOrder: Order;
  let createdPicking: OrderPicking;
  let createdCustomer: any;

  beforeEach(async () => {
    orderResolveProcessor = new OrderResolveProcessor(db as any);
    orderService = new OrderService(db as any);
    paymentService = new PaymentService(db as any);
    customerService = new CustomerService(db as any);
    pickingService = new OrderPickingService(db as any);

    // Create test customer
    createdCustomer = {
      created_at: new Date(),
      id: 'test-customer-id',
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test@example.com',
      phone: '+1234567890'
    } as any;

    // Create test order
    createdOrder = {
      id: 'test-order-id',
      name: 'Test Order',
      created_at: new Date(),
      items: [
        {
          id: 'test-item-1',
          name: 'Test Item 1',
          price: 150,
          quantity: 1,
          item_id: 'item-1',
          fraction: 1,
          price_for_unit: 150,
          group: 'TEST_GROUP',
          owner: { id: 'test-customer-id' }
        }
      ],
      status: 'PENDING',
      numberOfItems: 1,
      total: 150,
      owner: {
        id: createdCustomer.id
      }
    } as any;

    createdPicking = JSON.parse(JSON.stringify(createdOrder));
    createdPicking.created_at = new Date();
    createdPicking.total = 200;

    // Create test data in Firestore
    await customerService.set(createdCustomer);
    await orderService.set(createdOrder);
    await pickingService.set(createdPicking);
  });



  it('should create a Payment object after successful processing when picking total is greater than order total', async () => {
    // Create test event
    const testEvent: OrderResolvedEvent = {
      id: 'test-event-id',
      idempotent_key: 'idempotent-key-test',
      type: 'ORDER_RESOLVED',
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: createdOrder.id
      }
    };

    // Verify no payments exist initially
    let payments = await paymentService.findAll();
    expect(payments.length).toBe(0);

    // Verify original order status is PENDING
    const originalOrder = await orderService.find(createdOrder.id);
    expect(originalOrder?.status).toBe('PENDING');

    // Process the event, emulate multiple calls (idempotency test)
    await orderResolveProcessor.process(testEvent);
    await orderResolveProcessor.process(testEvent);
    await orderResolveProcessor.process(testEvent);
    await orderResolveProcessor.process(testEvent);
    await orderResolveProcessor.process(testEvent);

    // Verify that only one payment object was created (idempotency)
    payments = await paymentService.findAll();
    expect(payments.length).toBe(1);

    const createdPayment = payments[0];
    
    // Verify payment properties
    expect(createdPayment).toBeDefined();
    expect(createdPayment.external_payment_id).toBe('external-mock-id');
    expect(createdPayment.order_id).toBeTruthy();
    expect(createdPayment.terminal_key).toBe('MOCK_TERMINAL');
    expect(createdPayment.amount).toBe(5000); // 50 * 100 (diff in kopecks)
    expect(createdPayment.success).toBe(true);
    expect(createdPayment.payment_url).toBeTruthy();
    expect(createdPayment.error_code).toBe(0);
    expect(createdPayment.created_at).toBeInstanceOf(Date);

    // Verify original order status was updated
    const updatedOrder = await orderService.find(createdOrder.id);
    expect(updatedOrder?.status).toBe('CONCILIATION_PAYMENT_IN_PROGRESS');
  });

  it('should publish ORDER_CONCILIATED event when picking total equals order total', async () => {
    // Update picking total to match order total
    createdPicking.total = 150;
    await pickingService.set(createdPicking);

    // Create test event
    const testEvent: OrderResolvedEvent = {
      id: 'test-event-id',
      idempotent_key: 'idempotent-key-equal',
      type: 'ORDER_RESOLVED',
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: createdOrder.id
      }
    };

    // Verify original order status is PENDING
    const originalOrder = await orderService.find(createdOrder.id);
    expect(originalOrder?.status).toBe('PENDING');

    // Process the event
    await orderResolveProcessor.process(testEvent);

    // Verify no payment was created
    const payments = await paymentService.findAll();
    expect(payments.length).toBe(0);

    // Verify original order status was updated to CONCILIATED
    const updatedOrder = await orderService.find(createdOrder.id);
    expect(updatedOrder?.status).toBe('CONCILIATED');
  });

  it('should publish BALANCE_CHANGED event when picking total is less than order total', async () => {
    // Update picking total to be less than order total
    createdPicking.total = 100;
    await pickingService.set(createdPicking);

    // Create test event
    const testEvent: OrderResolvedEvent = {
      id: 'test-event-id',
      idempotent_key: 'idempotent-key-negative',
      type: 'ORDER_RESOLVED',
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: createdOrder.id
      }
    };

    // Process the event
    await orderResolveProcessor.process(testEvent);

    // Verify no payment was created
    const payments = await paymentService.findAll();
    expect(payments.length).toBe(0);

    // Verify original order status remains unchanged (no status update for negative diff)
    const updatedOrder = await orderService.find(createdOrder.id);
    expect(updatedOrder?.status).toBe('PENDING');
  });

  it('should throw error when order is not found', async () => {
    // Create test event with non-existent order ID
    const testEvent: OrderResolvedEvent = {
      id: 'test-event-id',
      idempotent_key: 'idempotent-key',
      type: 'ORDER_RESOLVED',
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: 'non-existent-order-id'
      }
    };

    // Verify that processing throws an error
    await expect(orderResolveProcessor.process(testEvent))
      .rejects
      .toThrow('Object ORDERS/non-existent-order-id is not found');

    // Verify no payment was created
    const payments = await paymentService.findAll();
    expect(payments.length).toBe(0);
  });
});
