import { testApp } from '../setup';
import { Order, OrderConciliatedEvent } from '../../models';
import OrderConciliatedProcessor from '../../services/events/OrderConciliatedProcessor';
import OrderService from '../../services/OrderService';
import CustomerService from '../../services/CustomerService';
import ConversationMessageService from '../../services/ConversationMessageService';

import * as dotenv from 'dotenv';
dotenv.config();

xdescribe('OrderConciliatedProcessor Integration Test (Real Telegram)', () => {
  let processor: OrderConciliatedProcessor;
  let orderService: OrderService;
  let customerService: CustomerService;
  let conversationMessageService: ConversationMessageService;

  let createdOrder: Order;
  let createdCustomer: any;

  beforeEach(async () => {
    const unauthContext = testApp.unauthenticatedContext();
    const db = unauthContext.firestore();

    processor = new OrderConciliatedProcessor(db as any);
    orderService = new OrderService(db as any);
    customerService = new CustomerService(db as any);
    conversationMessageService = new ConversationMessageService(db as any);

    // Create test customer
    createdCustomer = {
      created_at: new Date(),
      id: 'test-customer-id-conciliated',
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test@example.com',
      phone: '+1234567890'
    } as any;

    // Create test order
    createdOrder = {
      id: 'test-order-id-conciliated-real',
      name: 'Test Order Conciliated Real',
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
      status: 'CONCILIATED',
      numberOfItems: 1,
      total: 150,
      owner: {
        id: '270053857' // This will be used as Telegram chat ID
      }
    } as Order;

    // Create test data in Firestore
    await customerService.set(createdCustomer);
    await orderService.set(createdOrder);
  });

  it('should process ORDER_CONCILIATED event with real Telegram service', async () => {
    // Skip test if Telegram bot token is not configured
    if (!process.env.TELEGRAM_BOT_TOKEN) {
      console.warn('TELEGRAM_BOT_TOKEN not configured, skipping real Telegram test');
      return;
    }

    // Create test event
    const testEvent: OrderConciliatedEvent = {
      id: 'test-event-id-conciliated-real',
      type: 'ORDER_CONCILIATED',
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: createdOrder.id
      }
    };

    // Process the event
    await processor.process(testEvent);

    // Verify that a conversation message was created
    const messages = await conversationMessageService.findAll();
    
    expect(messages).toHaveLength(1);
    expect(messages[0].provider).toBe('TELEGRAM');
    expect(messages[0].recipient_id).toBe('270053857');
    expect(messages[0].thread_id).toBe(createdOrder.id);
    expect(messages[0].text).toContain('✅ Ваш заказ собран');
    expect(messages[0].text).toContain('Номер заказ test-order-id-conciliated-real');
  });

  it('should throw error when order is not found', async () => {
    // Create test event with non-existent order ID
    const testEvent: OrderConciliatedEvent = {
      id: 'test-event-id-conciliated-real',
      type: 'ORDER_CONCILIATED',
      created_at: new Date(),
      processed: false,
      retries: 0,
      payload: {
        order_id: 'non-existent-order-id-real'
      }
    };

    // Verify that processing throws an error
    await expect(processor.process(testEvent))
      .rejects
      .toThrow('Object ORDERS/non-existent-order-id-real is not found');

    // Verify no conversation message was created
    const messages = await conversationMessageService.findAll();
    expect(messages).toHaveLength(0);
  });
});
