import { testApp } from '../setup';
import { Order, PaymentCreatedEvent, Payment } from '../../models';
import OrderPaymentCreatedProcessor from '../../services/events/OrderPaymentCreatedProcessor';
import OrderService from '../../services/OrderService';
import PaymentService from '../../services/PaymentService';
import CustomerService from '../../services/CustomerService';
import TelegramService from '../../services/TelegramService';

// Mock TelegramService
jest.mock('../../services/TelegramService');

describe('OrderPaymentCreatedProcessor Integration Test', () => {
  let processor: OrderPaymentCreatedProcessor;
  let orderService: OrderService;
  let paymentService: PaymentService;
  let customerService: CustomerService;
  let mockTelegramService: jest.Mocked<TelegramService>;

  let createdOrder: Order;
  let createdCustomer: any;
  let createdPayment: Payment;

  beforeEach(async () => {
    const unauthContext = testApp.unauthenticatedContext();
    const db = unauthContext.firestore();

    processor = new OrderPaymentCreatedProcessor(db as any);
    orderService = new OrderService(db as any);
    paymentService = new PaymentService(db as any);
    customerService = new CustomerService(db as any);

    // Mock TelegramService
    mockTelegramService = {
      sendMessage: jest.fn().mockResolvedValue(undefined)
    } as any;
    (TelegramService as jest.MockedClass<typeof TelegramService>).mockImplementation(() => mockTelegramService);

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
      id: 'test-order-id-payment',
      name: 'Test Order Payment',
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
          owner: { id: '270053857' }
        }
      ],
      status: 'PENDING',
      numberOfItems: 1,
      total: 150,
      owner: {
        id: '270053857' // This will be used as Telegram chat ID
      }
    } as Order;

    // Create test payment
    createdPayment = {
      id: 'test-payment-id',
      external_payment_id: 'external-mock-id',
      terminal_key: 'MOCK_TERMINAL',
      order_id: createdOrder.id,
      amount: 15000,
      success: true,
      payment_url: `https://securepay.tinkoff.ru/${createdOrder.id}`,
      error_code: 0,
      created_at: new Date()
    } as Payment;

    // Create test data in Firestore
    await customerService.set(createdCustomer);
    await orderService.set(createdOrder);
    await paymentService.set(createdPayment);
  });

  it('should send Telegram message with payment URL after successful processing of ORDER_PAYMENT_CREATED', async () => {
    // Create test event
    const testEvent: PaymentCreatedEvent = {
      id: 'test-event-id-payment',
      type: 'ORDER_PAYMENT_CREATED',
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        payment_id: createdPayment.id
      }
    };

    // Process the event
    await processor.process(testEvent);

    // Verify that Telegram message was sent
    expect(mockTelegramService.sendMessage).toHaveBeenCalledTimes(1);
    
    // Verify the message was sent to the correct chat ID
    expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
      '270053857',
      expect.stringContaining('Ваш заказ')
    );

    // Verify the message contains the payment URL
    expect(mockTelegramService.sendMessage).toHaveBeenCalledWith(
      '270053857',
      expect.stringContaining(createdPayment.payment_url!)
    );
  });

  it('should throw error when payment is not found', async () => {
    // Create test event with non-existent payment ID
    const testEvent: PaymentCreatedEvent = {
      id: 'test-event-id-payment',
      type: 'ORDER_PAYMENT_CREATED',
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        payment_id: 'non-existent-payment-id'
      }
    };

    // Verify that processing throws an error
    await expect(processor.process(testEvent))
      .rejects
      .toThrow('No payment found for  non-existent-payment-id');

    // Verify no Telegram message was sent
    expect(mockTelegramService.sendMessage).not.toHaveBeenCalled();
  });
});
