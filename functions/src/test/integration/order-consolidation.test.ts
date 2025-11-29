import * as request from 'supertest';
import { testApp } from '../setup';
import { Order, OrderResolvedEvent } from '../../models';
import OrderService from '../../services/OrderService';
import CustomerService from '../../services/CustomerService';
import PaymentService from '../../services/PaymentService';
import OutboxEventService from '../../services/OutboxEventService';
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

describe('Order Consolidation Integration Test', () => {
  let orderService: OrderService;
  let customerService: CustomerService;
  let paymentService: PaymentService;
  let outboxEventService: OutboxEventService<OrderResolvedEvent>;

  let createdOrder: Order;
  let createdCustomer: any;
  let createdPicking: any;

  beforeEach(async () => {
    const unauthContext = testApp.unauthenticatedContext();

    const db = unauthContext.firestore();

    orderService = new OrderService(db as any);
    customerService = new CustomerService(db as any);
    paymentService = new PaymentService(db as any);
    outboxEventService = new OutboxEventService(db as any);

    createdCustomer = {
      created_at: new Date(),
      id: 'test-customer-id',
      first_name: 'Test',
      last_name: 'Customer',
      email: 'test@example.com',
      phone: '+1234567890'
    } as any;

    createdOrder = {
      id: 'test-order-id',
      name: 'Test Order',
      created_at: new Date(),
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

  it('order flow', async () => {
    // Call the consolidate endpoint

    let payments = await paymentService.findAll();
    expect(payments.length).toBe(0);

    let events = await outboxEventService.findAll();
    expect(events.length).toBe(0);


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

    const order = await orderService.find(createdOrder.id);

    expect(order?.status).toBe('RESOLVING');

    events = await outboxEventService.findAll();
    expect(events.length).toBe(1);

  });
});
