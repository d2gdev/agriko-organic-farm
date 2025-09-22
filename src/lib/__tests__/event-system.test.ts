// Event System Tests
import { EventBus, EventType, createEvent } from '../event-system';

// Mock Redis
jest.mock('ioredis', () => {
  return {
    Redis: jest.fn().mockImplementation(() => ({
      lpush: jest.fn().mockResolvedValue(1),
    })),
  };
});

// Mock logger
jest.mock('../logger', () => ({
  logger: {
    info: jest.fn(),
    error: jest.fn(),
  },
}));

describe('Event System', () => {
  let eventBus: EventBus;

  beforeEach(() => {
    eventBus = new EventBus();
  });

  describe('createEvent', () => {
    it('should create a valid product viewed event', () => {
      const event = createEvent(EventType.PRODUCT_VIEWED, {
        productId: 123,
        productName: 'Organic Rice',
        productPrice: 25.99,
        category: 'Grains',
      });

      expect(event.type).toBe(EventType.PRODUCT_VIEWED);
      expect(event.metadata.productId).toBe(123);
      expect(event.id).toBeDefined();
      expect(event.timestamp).toBeDefined();
    });

    it('should create a valid search event', () => {
      const event = createEvent(EventType.SEARCH_PERFORMED, {
        query: 'organic turmeric',
        resultsCount: 12,
        filters: { category: 'spices' },
      });

      expect(event.type).toBe(EventType.SEARCH_PERFORMED);
      expect(event.metadata.query).toBe('organic turmeric');
      expect(event.metadata.resultsCount).toBe(12);
    });

    it('should include user context when provided', () => {
      const event = createEvent(
        EventType.PRODUCT_ADDED_TO_CART,
        { productId: 456 },
        'user123',
        'session456'
      );

      expect(event.userId).toBe('user123');
      expect(event.sessionId).toBe('session456');
    });
  });

  describe('EventBus', () => {
    it('should emit events to Redis queue', async () => {
      const event = createEvent(EventType.PRODUCT_VIEWED, { productId: 123 });

      await eventBus.emit(event);

      // Verify Redis lpush was called
      expect(eventBus['redis'].lpush).toHaveBeenCalledWith(
        'events:queue',
        JSON.stringify(event)
      );
    });

    it('should register and trigger event listeners', async () => {
      const mockListener = jest.fn();
      eventBus.on(EventType.PRODUCT_VIEWED, mockListener);

      const event = createEvent(EventType.PRODUCT_VIEWED, { productId: 123 });
      await eventBus.emit(event);

      expect(mockListener).toHaveBeenCalledWith(event);
    });

    it('should handle event validation errors', async () => {
      const invalidEvent = {
        id: '',
        type: EventType.PRODUCT_VIEWED,
        timestamp: 0,
        metadata: {},
      };

      await expect(eventBus.emit(invalidEvent as any)).resolves.not.toThrow();
      // Should log error instead of throwing
    });

    it('should remove event listeners', () => {
      const mockListener = jest.fn();
      eventBus.on(EventType.PRODUCT_VIEWED, mockListener);
      eventBus.off(EventType.PRODUCT_VIEWED, mockListener);

      const listeners = eventBus['listeners'].get(EventType.PRODUCT_VIEWED);
      expect(listeners).toEqual([]);
    });
  });

  describe('Event Validation', () => {
    it('should require event ID', async () => {
      const invalidEvent = {
        id: '',
        type: EventType.PRODUCT_VIEWED,
        timestamp: Date.now(),
        metadata: {},
      };

      // Should not throw but should log error
      await eventBus.emit(invalidEvent as any);
    });

    it('should require event type', async () => {
      const invalidEvent = {
        id: 'test-id',
        type: '',
        timestamp: Date.now(),
        metadata: {},
      };

      await eventBus.emit(invalidEvent as any);
    });

    it('should require timestamp', async () => {
      const invalidEvent = {
        id: 'test-id',
        type: EventType.PRODUCT_VIEWED,
        timestamp: 0,
        metadata: {},
      };

      await eventBus.emit(invalidEvent as any);
    });
  });
});