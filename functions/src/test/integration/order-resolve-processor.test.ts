import { testApp } from '../setup';
import { Order, OrderPicking, OrderResolvedEvent } from '../../models';
import OrderResolveProcessor from '../../services/events/OrderResolveProcessor';
import OrderService from '../../services/OrderService';
import PaymentService from '../../services/PaymentService';
import CustomerService from '../../services/CustomerService';
import OrderPickingService from '../../services/OrderPickingService';

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
    const unauthContext = testApp.unauthenticatedContext();
    const db = unauthContext.firestore();

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



  it('should create a Payment object after successful processing', async () => {
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

    // Process the event, emulate multiple calls
    await orderResolveProcessor.process(testEvent);
    await orderResolveProcessor.process(testEvent);
    await orderResolveProcessor.process(testEvent);
    await orderResolveProcessor.process(testEvent);
    await orderResolveProcessor.process(testEvent);

    // Verify that only one payment object was created
    payments = await paymentService.findAll();
    expect(payments.length).toBe(1);

    const createdPayment = payments[0];
    
    // Verify payment properties
    expect(createdPayment).toBeDefined();
    expect(createdPayment.external_payment_id).toBe('external-mock-id');
    expect(createdPayment.order_id).toBeTruthy();
    expect(createdPayment.terminal_key).toBe('MOCK_TERMINAL');
    expect(createdPayment.amount).toBe(5000);
    expect(createdPayment.success).toBe(true);
    expect(createdPayment.payment_url).toBeTruthy();
    expect(createdPayment.error_code).toBe(0);
    expect(createdPayment.created_at).toBeInstanceOf(Date);
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
