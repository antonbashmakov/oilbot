import * as request from 'supertest';
import { testApp } from '../setup';
//import { Order, OrderResolvedEvent } from '../../models';
import { Order, OrderResolvedEvent } from '../../models';
import OrderService from '../../services/OrderService';
import OrderPickingService from '../../services/OrderPickingService';
import CustomerService from '../../services/CustomerService';
import EventPublisher from '../../services/EventPublisher';
import TBankService from '../../services/payments/TBankService';

// Mock the TBankService
jest.mock('../../services/payments/TBankService');

// Mock the EventPublisher to track calls

describe('Order Consolidation Integration Test', () => {
  let orderService: OrderService;
  let pickingService: OrderPickingService;
  let customerService: CustomerService;
  let createdOrder: Order;
  let createdCustomer: any;

  let orderResolvedPublisher: EventPublisher<OrderResolvedEvent>;

  beforeEach(async () => {
    // Initialize services
    const unauthContext = testApp.unauthenticatedContext();

    const db = unauthContext.firestore();

    orderService = new OrderService(db as any);
    pickingService = new OrderPickingService(db as any);
    customerService = new CustomerService(db as any);
    orderResolvedPublisher = new EventPublisher<OrderResolvedEvent>(db as any)

    // Create a test customer
    createdCustomer = await customerService.add({
      id: 'test-customer-id',
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test@example.com',
      phone: '+1234567890'
    } as any);

    // Create a test order
    createdOrder = await orderService.add({
      id: 'test-order-id',
      name: 'Test Order',
      orderDate: new Date().toISOString(),
      items: [
        {
          id: 'test-item-1',
          name: 'Test Item 1',
          price: 100,
          quantity: 2,
          item_id: 'item-1',
          fraction: 1
        }
      ],
      status: 'PENDING',
      numberOfItems: 1,
      total: 200,
      owner: {
        id: createdCustomer.id
      }
    } as any);

    // Create order picking with all items collected
    await pickingService.add({
      id: createdOrder.id,
      order_id: createdOrder.id,
      items: [
        {
          id: 'test-item-1',
          name: 'Test Item 1',
          status: 'COLLECTED',
          quantity: 2,
          price: 100
        }
      ]
    } as any);
  });

  it('when order resolved issued should create payment', async () => {
    // Mock the TBankService initPayment method
    const mockInitPayment = jest.fn().mockResolvedValue({
      Success: true,
      Status: 'NEW',
      PaymentId: 'mock-payment-id',
      PaymentURL: 'https://securepay.tinkoff.ru/mock-payment-url'
    });

    (TBankService as jest.MockedClass<typeof TBankService>).prototype.initPayment = mockInitPayment;


    orderResolvedPublisher.publish({
      id: 'test-order-id',
      type: 'ORDER_RESOLVE_REQUESTED',
      processed: false,
      retries: 0,
      createdAt: new Date,
      processedAt: new Date,
      payload: {
        orderId: 'some-order'
      }
    })

    // Verify that initPayment was called
    expect(mockInitPayment).toHaveBeenCalledTimes(1);

    // Verify the payment request structure
    const paymentRequest = mockInitPayment.mock.calls[0][0];
    expect(paymentRequest).toMatchObject({
      TerminalKey: expect.any(String),
      Amount: 20000, // 200 * 100 (in kopecks)
      OrderId: 'test-order-id',
      Description: 'Оплата заказа в магазине По Себестоимости'
    });
  });



  xit('should return 400 if order is not compiled', async () => {
    // Update picking to have uncollected items
    await pickingService.updateItems(createdOrder.id, [
      {
        id: 'test-item-1',
        name: 'Test Item 1',
        status: 'PENDING',
        quantity: 2,
        price: 100
      }
    ]);

    // Call the consolidate endpoint
    const response = await request('http://localhost:5001/test-project/us-central1/admin')
      .post(`/orders/${createdOrder.id}/consolidate`)
      .expect(400);

    // Verify the error response
    expect(response.body.error).toBe('Order is not compiled');
  });



});
