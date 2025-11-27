import * as request from 'supertest';
import { Order, OrderResolvedEvent } from '../../models';


// Import after mocking
import OrderService from '../../services/OrderService';
import OrderPickingService from '../../services/OrderPickingService';
import EventPublisher from '../../services/EventPublisher';

describe('Order Consolidation Unit Test', () => {
  let mockOrderService: jest.Mocked<OrderService>;
  let mockPickingService: jest.Mocked<OrderPickingService>;
  let mockEventPublisher: jest.Mocked<EventPublisher<OrderResolvedEvent>>;

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();

    // Get mocked instances
    mockOrderService = new OrderService({} as any) as jest.Mocked<OrderService>;
    mockPickingService = new OrderPickingService({} as any) as jest.Mocked<OrderPickingService>;
    mockEventPublisher = new EventPublisher({} as any) as jest.Mocked<EventPublisher<OrderResolvedEvent>>;
  });

  it('should consolidate order and trigger ORDER_RESOLVE_REQUESTED event', async () => {
    // Mock order data
    const mockOrder: Order = {
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
          fraction: 1,
          group: 'test-group',
          price_for_unit: 50,
          owner: { id: 123 }
        }
      ],
      status: 'PENDING',
      numberOfItems: 1,
      total: 200,
      owner: {
        id: 123
      }
    };

    // Mock picking data with all items collected
    const mockPicking = {
      id: 'test-order-id',
      order_id: 'test-order-id',
      items: [
        {
          id: 'test-item-1',
          name: 'Test Item 1',
          status: 'COLLECTED',
          quantity: 2,
          price: 100
        }
      ]
    };

    // Setup mocks
    mockOrderService.find.mockResolvedValue(mockOrder);
    mockPickingService.find.mockResolvedValue(mockPicking as any);
    mockOrderService.updateTransactionally.mockResolvedValue(undefined as any);
    mockEventPublisher.publish.mockResolvedValue({} as any);

    // Call the consolidate endpoint
    const response = await request('http://localhost:5001/test-project/us-central1/admin')
      .post('/orders/test-order-id/consolidate')
      .expect(200);

    // Verify the response
    expect(response.body).toEqual({});

    // Verify service calls
    expect(mockOrderService.find).toHaveBeenCalledWith('test-order-id');
    expect(mockPickingService.find).toHaveBeenCalledWith('test-order-id');
    expect(mockOrderService.updateTransactionally).toHaveBeenCalledWith(
      mockOrder,
      { status: 'RESOLVING' }
    );

    // Verify that EventPublisher.publish was called with the correct event
    expect(mockEventPublisher.publish).toHaveBeenCalledTimes(1);
    
    const publishedEvent = mockEventPublisher.publish.mock.calls[0][0] as OrderResolvedEvent;
    expect(publishedEvent.type).toBe('ORDER_RESOLVE_REQUESTED');
    expect(publishedEvent.payload.orderId).toBe('test-order-id');
    expect(publishedEvent.processed).toBe(false);
    expect(publishedEvent.retries).toBe(0);
  });

  it('should return 400 if order is not compiled', async () => {
    // Mock order data
    const mockOrder: Order = {
      id: 'test-order-id',
      name: 'Test Order',
      orderDate: new Date().toISOString(),
      items: [],
      status: 'PENDING',
      numberOfItems: 0,
      total: 0,
      owner: {
        id: 123
      }
    };

    // Mock picking data with uncollected items
    const mockPicking = {
      id: 'test-order-id',
      order_id: 'test-order-id',
      items: [
        {
          id: 'test-item-1',
          name: 'Test Item 1',
          status: 'PENDING',
          quantity: 2,
          price: 100
        }
      ]
    };

    // Setup mocks
    mockOrderService.find.mockResolvedValue(mockOrder);
    mockPickingService.find.mockResolvedValue(mockPicking as any);

    // Call the consolidate endpoint
    const response = await request('http://localhost:5001/test-project/us-central1/admin')
      .post('/orders/test-order-id/consolidate')
      .expect(400);

    // Verify the error response
    expect(response.body.error).toBe('Order is not compiled');

    // Verify service calls
    expect(mockOrderService.find).toHaveBeenCalledWith('test-order-id');
    expect(mockPickingService.find).toHaveBeenCalledWith('test-order-id');
    
    // Verify that EventPublisher.publish was NOT called
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  });

  it('should return 404 if order does not exist', async () => {
    // Setup mocks
    mockOrderService.find.mockResolvedValue(undefined);

    // Call the consolidate endpoint with non-existent order ID
    const response = await request('http://localhost:5001/test-project/us-central1/admin')
      .post('/orders/non-existent-order-id/consolidate')
      .expect(404);

    // Verify the error response
    expect(response.body.error).toBe('Order not found');

    // Verify service calls
    expect(mockOrderService.find).toHaveBeenCalledWith('non-existent-order-id');
    
    // Verify that EventPublisher.publish was NOT called
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
  })});
