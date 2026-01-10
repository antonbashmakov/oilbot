// Import the default export and extract dailySubscriptionCheck
import dbModule from '../../controllers/db/db';
const { dailySubscriptionCheck } = dbModule;

import SubscriptionService from '../../services/SubscriptionService';
import EventPublisher from '../../services/EventPublisher';
import { logger } from '../../services/logger';
import { Subscription, ChargeSubscriptionEvent } from '../../models';

// Mock dependencies
jest.mock('../../services/SubscriptionService');
jest.mock('../../services/EventPublisher');
jest.mock('../../services/logger');



jest.mock("../../controllers/db/imports", () => {
  const firestore = {
    database: () => firestore,
    document: () => firestore,
    onCreate: () => firestore,
  };  
  const pubsub = {
    schedule: () => pubsub,
    timeZone: () => pubsub,
    onRun: () => pubsub,
  }
  const functions = {
    pubsub,
    firestore,
  };  
  return {
    functions,
    admin: {
      firestore: () => ({
        databaseId: "",
        settings: jest.fn(),
      }),
      auth: jest.fn(),
      initializeApp: jest.fn(),
    },
  }
});
// Mock moment
jest.mock('moment-timezone', () => {
  // Create a mock moment function
  const any = jest.fn() as jest.Mock & { utc: jest.Mock };

  // Mock utc function that returns a chainable object
  const createany = (): any => {
    const mock: any = {
      clone: jest.fn(() => mock),
      startOf: jest.fn(() => mock),
      subtract: jest.fn(() => mock),
      isSame: jest.fn(() => false),
      isSameOrBefore: jest.fn(() => false),
      toDate: jest.fn(() => new Date('2024-01-10T00:00:00Z')),
    };
    return mock;
  };

  const mockUtc = jest.fn(createany);

  // Make the mock function have the utc property
  any.utc = mockUtc;

  return any;
});

describe('dailySubscriptionCheck', () => {
  let mockSubscriptionService: jest.Mocked<SubscriptionService>;
  let mockEventPublisher: jest.Mocked<EventPublisher<ChargeSubscriptionEvent>>;
  let mockLogger: jest.Mocked<typeof logger>;
  let any: jest.Mock & { utc: jest.Mock };
  let anyUtc: jest.Mock;

  beforeEach(() => {
    jest.clearAllMocks();

    // Get the mocked moment
    any = require('moment-timezone') as jest.Mock & { utc: jest.Mock };
    anyUtc = any.utc;

    mockSubscriptionService = {
      findActiveSubscriptionsNotOlderThen: jest.fn(),
      runTransactionally: jest.fn(),
      getObjectRef: jest.fn(),
    } as any;

    mockEventPublisher = {
      publish: jest.fn(),
    } as any;

    mockLogger = logger as jest.Mocked<typeof logger>;
    mockLogger.info = jest.fn();
    mockLogger.error = jest.fn();

    (SubscriptionService as jest.MockedClass<typeof SubscriptionService>).mockImplementation(() => mockSubscriptionService);
    (EventPublisher as jest.MockedClass<typeof EventPublisher>).mockImplementation(() => mockEventPublisher);
  });

  it('should process subscriptions correctly - cancel overdue and charge due', async () => {
    // Create mock moment objects
    const mockNow: any = {
      clone: jest.fn(() => mockNow),
      startOf: jest.fn(() => mockTodayStart),
      subtract: jest.fn(() => mockFourDaysAgo),
      isSame: jest.fn(() => false),
      isSameOrBefore: jest.fn(() => false),
      toDate: jest.fn(() => new Date()),
    };

    const mockTodayStart: any = {
      clone: jest.fn(() => mockTodayStart),
      startOf: jest.fn(() => mockTodayStart),
      subtract: jest.fn(() => mockFourDaysAgo),
      isSame: jest.fn(() => false),
      isSameOrBefore: jest.fn(() => false),
      toDate: jest.fn(() => new Date()),
    };

    const mockFourDaysAgo: any = {
      clone: jest.fn(() => mockFourDaysAgo),
      startOf: jest.fn(() => mockFourDaysAgo),
      subtract: jest.fn(() => mockFourDaysAgo),
      isSame: jest.fn(() => false),
      isSameOrBefore: jest.fn(() => false),
      toDate: jest.fn(() => new Date('2024-01-06T00:00:00Z')),
    };

    // Mock moment.utc() calls
    anyUtc
      .mockReturnValueOnce(mockNow) // First call: const now = moment.utc()
      .mockReturnValueOnce({ // For sub1 next_payment_at
        startOf: jest.fn(() => ({
          isSame: jest.fn(() => true), // Matches fourDaysAgo
          isSameOrBefore: jest.fn(() => false)
        }))
      })
      .mockReturnValueOnce({ // For sub2 next_payment_at
        startOf: jest.fn(() => ({
          isSame: jest.fn(() => false),
          isSameOrBefore: jest.fn(() => true) // Is before today
        }))
      })
      .mockReturnValueOnce({ // For sub3 next_payment_at
        startOf: jest.fn(() => ({
          isSame: jest.fn(() => false),
          isSameOrBefore: jest.fn(() => false) // In future
        }))
      })
      .mockReturnValueOnce({ // For sub4 next_payment_at
        startOf: jest.fn(() => ({
          isSame: jest.fn(() => false),
          isSameOrBefore: jest.fn(() => true) // Is today
        }))
      });

    // Mock subscriptions
    const subscriptions: Subscription[] = [
      {
        id: 'sub1',
        created_at: new Date('2023-12-01T00:00:00Z'),
        next_payment_at: new Date('2024-01-06T00:00:00Z'), // 4 days ago - should cancel
        status: 'ACTIVE',
        fee: 300,
      } as Subscription,
      {
        id: 'sub2',
        created_at: new Date('2023-12-01T00:00:00Z'),
        next_payment_at: new Date('2024-01-09T00:00:00Z'), // yesterday - should charge
        status: 'ACTIVE',
        fee: 300,
      } as Subscription,
      {
        id: 'sub3',
        created_at: new Date('2023-12-01T00:00:00Z'),
        next_payment_at: new Date('2024-01-11T00:00:00Z'), // tomorrow - should skip
        status: 'ACTIVE',
        fee: 300,
      } as Subscription,
      {
        id: 'sub4',
        created_at: new Date('2023-12-01T00:00:00Z'),
        next_payment_at: new Date('2024-01-10T00:00:00Z'), // today - should charge
        status: 'ACTIVE',
        fee: 300,
      } as Subscription,
    ];

    mockSubscriptionService.findActiveSubscriptionsNotOlderThen.mockResolvedValue(subscriptions);

    let transactionUpdates: Array<{ ref: any, data: any }> = [];
    mockSubscriptionService.runTransactionally.mockImplementation(async (callback) => {
      const mockTransaction = {
        update: jest.fn((ref, data) => {
          transactionUpdates.push({ ref, data });
        }),
      };
      await callback(mockTransaction);
    });

    mockSubscriptionService.getObjectRef.mockImplementation((id) => ({ id, path: `subscriptions/${id}` } as any));

    // Create a mock event to resolve with
    const mockEvent: ChargeSubscriptionEvent = {
      id: 'mock-id',
      created_at: new Date(),
      processed_at: new Date(),
      processed: false,
      retries: 0,
      type: 'CHARGE_SUBSCRIPTION',
      payload: { subscription_id: 'test' }
    };
    mockEventPublisher.publish.mockResolvedValue(mockEvent);

    // Call the function
    const mockContext = {};
    const result = await dailySubscriptionCheck(mockContext);


    console.log('>>>>>><<<<<<<<<<<', result)
    // Verify subscription service was called with correct date
    expect(mockSubscriptionService.findActiveSubscriptionsNotOlderThen).toHaveBeenCalledWith(mockFourDaysAgo.toDate());

    // Verify transaction was called for cancellation
    expect(mockSubscriptionService.runTransactionally).toHaveBeenCalledTimes(1);

    // Verify subscription sub1 was canceled
    expect(transactionUpdates).toHaveLength(1);
    expect(transactionUpdates[0].ref).toEqual({ id: 'sub1', path: 'subscriptions/sub1' });
    expect(transactionUpdates[0].data).toEqual({
      status: 'CANCELED_PAYMENT_OVERDUE',
      canceled_at: expect.any(Date),
    });

    // Verify event publisher was called for sub2 and sub4
    expect(mockEventPublisher.publish).toHaveBeenCalledTimes(2);

    // Check that publish was called with correct subscription IDs
    const publishCalls = mockEventPublisher.publish.mock.calls;
    expect(publishCalls[0][0].payload.subscription_id).toBe('sub2');
    expect(publishCalls[1][0].payload.subscription_id).toBe('sub4');

    // Verify result is null
    expect(result).toBeNull();
  });

  it('should handle empty subscriptions', async () => {
    // Setup simple mocks
    const mockNow: any = {
      clone: jest.fn(() => mockNow),
      startOf: jest.fn(() => mockTodayStart),
      subtract: jest.fn(() => mockFourDaysAgo),
      isSame: jest.fn(() => false),
      isSameOrBefore: jest.fn(() => false),
      toDate: jest.fn(() => new Date()),
    };

    const mockTodayStart: any = {
      clone: jest.fn(() => mockTodayStart),
      startOf: jest.fn(() => mockTodayStart),
      subtract: jest.fn(() => mockFourDaysAgo),
      isSame: jest.fn(() => false),
      isSameOrBefore: jest.fn(() => false),
      toDate: jest.fn(() => new Date()),
    };

    const mockFourDaysAgo: any = {
      clone: jest.fn(() => mockFourDaysAgo),
      startOf: jest.fn(() => mockFourDaysAgo),
      subtract: jest.fn(() => mockFourDaysAgo),
      isSame: jest.fn(() => false),
      isSameOrBefore: jest.fn(() => false),
      toDate: jest.fn(() => new Date('2024-01-06T00:00:00Z')),
    };

    anyUtc.mockReturnValue(mockNow);
    mockSubscriptionService.findActiveSubscriptionsNotOlderThen.mockResolvedValue([]);

    const mockContext = {};
    const result = await dailySubscriptionCheck(mockContext);

    expect(mockSubscriptionService.findActiveSubscriptionsNotOlderThen).toHaveBeenCalledWith(mockFourDaysAgo.toDate());
    expect(mockSubscriptionService.runTransactionally).not.toHaveBeenCalled();
    expect(mockEventPublisher.publish).not.toHaveBeenCalled();
    expect(result).toBeNull();
  });

  it('should handle errors gracefully', async () => {
    // Setup simple mocks
    const mockNow: any = {
      clone: jest.fn(() => mockNow),
      startOf: jest.fn(() => mockTodayStart),
      subtract: jest.fn(() => mockFourDaysAgo),
      isSame: jest.fn(() => false),
      isSameOrBefore: jest.fn(() => false),
      toDate: jest.fn(() => new Date()),
    };

    const mockTodayStart: any = {
      clone: jest.fn(() => mockTodayStart),
      startOf: jest.fn(() => mockTodayStart),
      subtract: jest.fn(() => mockFourDaysAgo),
      isSame: jest.fn(() => false),
      isSameOrBefore: jest.fn(() => false),
      toDate: jest.fn(() => new Date()),
    };

    const mockFourDaysAgo: any = {
      clone: jest.fn(() => mockFourDaysAgo),
      startOf: jest.fn(() => mockFourDaysAgo),
      subtract: jest.fn(() => mockFourDaysAgo),
      isSame: jest.fn(() => false),
      isSameOrBefore: jest.fn(() => false),
      toDate: jest.fn(() => new Date('2024-01-06T00:00:00Z')),
    };

    anyUtc.mockReturnValue(mockNow);

    // Mock error
    mockSubscriptionService.findActiveSubscriptionsNotOlderThen.mockRejectedValue(new Error('Database error'));

    const mockContext = {};

    await expect(dailySubscriptionCheck(mockContext)).rejects.toThrow('Database error');

    expect(mockSubscriptionService.findActiveSubscriptionsNotOlderThen).toHaveBeenCalledWith(mockFourDaysAgo.toDate());
  });
});
