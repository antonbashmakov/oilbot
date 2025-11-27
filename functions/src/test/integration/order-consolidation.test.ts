import * as request from 'supertest';
import { testApp } from '../setup';
import { Order, OrderResolvedEvent } from '../../models';
import OrderService from '../../services/OrderService';
import CustomerService from '../../services/CustomerService';
import EventPublisher from '../../services/EventPublisher';
import TBankService from '../../services/payments/TBankService';

describe('Order Consolidation Integration Test', () => {
  let orderService: OrderService;
  let customerService: CustomerService;

  let createdOrder: Order;
  let createdCustomer: any;
  let createdPicking: any;

  let orderResolvedPublisher: EventPublisher<OrderResolvedEvent>;

  beforeEach(async () => {
    const unauthContext = testApp.unauthenticatedContext();

    const db = unauthContext.firestore();

    orderService = new OrderService(db as any);
    customerService = new CustomerService(db as any);
    orderResolvedPublisher = new EventPublisher<OrderResolvedEvent>(db as any)

    createdCustomer = {
      createdAt: new Date(),
      id: 'test-customer-id',
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test@example.com',
      phone: '+1234567890'
    } as any;

    createdOrder = {
      id: 'test-order-id',
      name: 'Test Order',
      createdAt: new Date(),
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
    } as any;

    createdPicking = { ...createdOrder };

    createdPicking.items[0].status = 'COLLECTED';

    // Create a test customer
    await customerService.set(createdCustomer);

    // Create a test order
    await orderService.set(createdOrder);

    // Create order picking with all items collected
    //await pickingService.set(createdPicking);
  })

  xit('when order resolved issued should create payment', async () => {
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

  it('should return 400 if order is not compiled', async () => {
    // Call the consolidate endpoint

    let response = await request('http://127.0.0.1:5001/test-project/us-central1/admin')
      .get(`/orders/${createdOrder.id}`)
      .expect(200);

    response = await request('http://127.0.0.1:5001/test-project/us-central1/admin')
      .post(`/orders/${createdOrder.id}/consolidate`)
      .expect(400);

    // Verify the error response
    expect(response.body.error.message).toBe('Order is not compiled');

    response = await request('http://127.0.0.1:5001/test-project/us-central1/admin')
      .post(`/orders/${createdOrder.id}/order-picking`)
      .expect(200);
    response = await request('http://127.0.0.1:5001/test-project/us-central1/admin')
      .post(`/orders/${createdOrder.id}/order-picking`)
      .expect(200);

    expect(response.body.total).toBe(0);

    response = await request('http://127.0.0.1:5001/test-project/us-central1/admin')
      .post(`/order-pickings/${createdOrder.id}/items/test-item-1/collect`)
      .expect(204);
    response = await request('http://127.0.0.1:5001/test-project/us-central1/admin')
      .post(`/orders/${createdOrder.id}/consolidate`)
      .expect(200);

  });
});


