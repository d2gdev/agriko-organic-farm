/* eslint-disable no-console */
/* eslint-disable @typescript-eslint/no-explicit-any */
import { logger, Logger, LogLevel } from '@/lib/logger';

// Mock console methods
const originalConsole = {
  log: console.log,
  warn: console.warn,
  error: console.error,
  info: console.info
};

beforeAll(() => {
  console.log = jest.fn();
  console.warn = jest.fn();
  console.error = jest.fn();
  console.info = jest.fn();
});

afterAll(() => {
  console.log = originalConsole.log;
  console.warn = originalConsole.warn;
  console.error = originalConsole.error;
  console.info = originalConsole.info;
});

describe('Logger', () => {
  beforeEach(() => {
    // Clear console mocks
    (console.log as jest.Mock).mockClear();
    (console.warn as jest.Mock).mockClear();
    (console.error as jest.Mock).mockClear();
    (console.info as jest.Mock).mockClear();
  });

  describe('logging levels', () => {
    it('should log info messages', () => {
      logger.info('Test info message');

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️ [INFO]'),
        undefined
      );
    });

    it('should log warning messages', () => {
      logger.warn('Test warning message');

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('⚠️ [WARN]'),
        undefined
      );
    });

    it('should log error messages', () => {
      logger.error('Test error message');

      expect(console.error).toHaveBeenCalledWith(
        expect.stringContaining('🚨 [ERROR]'),
        undefined
      );
    });

    it('should log debug messages', () => {
      logger.debug('Test debug message');

      expect(console.log).toHaveBeenCalledWith(
        expect.stringContaining('🐛 [DEBUG]'),
        undefined
      );
    });
  });

  describe('message formatting', () => {
    it('should include timestamp in messages', () => {
      logger.info('Test message');

      const call = (console.info as jest.Mock).mock.calls[0][0];
      expect(call).toMatch(/\d{1,2}:\d{2}:\d{2} (am|pm)/);
    });

    it('should format messages with data', () => {
      const testData = { userId: 123, action: 'login' };
      logger.info('User action', testData);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('User action'),
        testData
      );
    });

    it('should handle messages without data', () => {
      logger.info('Simple message');

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Simple message'),
        undefined
      );
    });

    it('should format timestamps correctly', () => {
      logger.info('Timestamp test');

      const call = (console.info as jest.Mock).mock.calls[0][0];
      // Should contain time format like "2:34:56 pm"
      expect(call).toMatch(/\d{1,2}:\d{2}:\d{2} (am|pm)/);
    });
  });

  describe('data handling', () => {
    it('should handle object data', () => {
      const complexData = {
        user: { id: 1, name: 'John' },
        metadata: { timestamp: Date.now() }
      };

      logger.info('Complex data test', complexData);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Complex data test'),
        complexData
      );
    });

    it('should handle array data', () => {
      const arrayData = [1, 2, 3, 'test'];
      logger.warn('Array data test', arrayData);

      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Array data test'),
        arrayData
      );
    });

    it('should handle null and undefined data', () => {
      logger.info('Null test', null);
      logger.info('Undefined test', undefined);

      expect(console.info).toHaveBeenNthCalledWith(1,
        expect.stringContaining('Null test'),
        null
      );
      expect(console.info).toHaveBeenNthCalledWith(2,
        expect.stringContaining('Undefined test'),
        undefined
      );
    });

    it('should handle circular references in data', () => {
      const circular: any = { name: 'test' };
      circular.self = circular;

      // Should not throw error
      expect(() => {
        logger.info('Circular reference test', circular);
      }).not.toThrow();

      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('Logger class instantiation', () => {
    it('should create new logger instances', () => {
      const customLogger = new Logger();

      customLogger.info('Custom logger test');

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Custom logger test'),
        undefined
      );
    });

    it('should allow multiple logger instances', () => {
      const logger1 = new Logger();
      const logger2 = new Logger();

      logger1.info('Logger 1');
      logger2.warn('Logger 2');

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Logger 1'),
        undefined
      );
      expect(console.warn).toHaveBeenCalledWith(
        expect.stringContaining('Logger 2'),
        undefined
      );
    });
  });

  describe('log level filtering', () => {
    it('should respect log level configuration', () => {
      const customLogger = new Logger();

      // All levels should work by default
      customLogger.debug('Debug message');
      customLogger.info('Info message');
      customLogger.warn('Warn message');
      customLogger.error('Error message');

      expect(console.log).toHaveBeenCalled(); // debug
      expect(console.info).toHaveBeenCalled(); // info
      expect(console.warn).toHaveBeenCalled(); // warn
      expect(console.error).toHaveBeenCalled(); // error
    });
  });

  describe('performance and memory', () => {
    it('should handle rapid logging without issues', () => {
      const start = Date.now();

      for (let i = 0; i < 1000; i++) {
        logger.info(`Message ${i}`, { iteration: i });
      }

      const duration = Date.now() - start;
      expect(duration).toBeLessThan(5000); // Should complete in under 5 seconds
    });

    it('should handle large data objects', () => {
      const largeData = {
        array: new Array(1000).fill(0).map((_, i) => ({ id: i, data: `item${i}` })),
        text: 'A'.repeat(10000)
      };

      expect(() => {
        logger.info('Large data test', largeData);
      }).not.toThrow();

      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('edge cases', () => {
    it('should handle empty string messages', () => {
      logger.info('');

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('ℹ️ [INFO]'),
        undefined
      );
    });

    it('should handle very long messages', () => {
      const longMessage = 'A'.repeat(10000);

      expect(() => {
        logger.info(longMessage);
      }).not.toThrow();

      expect(console.info).toHaveBeenCalled();
    });

    it('should handle special characters in messages', () => {
      const specialMessage = '🎉 Special chars: àáâãäå çñé 中文 한글 🚀';

      logger.info(specialMessage);

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining(specialMessage),
        undefined
      );
    });

    it('should handle function objects as data', () => {
      const fnData = () => 'test function';

      expect(() => {
        logger.info('Function data test', fnData);
      }).not.toThrow();

      expect(console.info).toHaveBeenCalled();
    });

    it('should handle symbol and bigint data', () => {
      const symbolData = Symbol('test');
      const bigintData = BigInt(123456789012345678901234567890n);

      expect(() => {
        logger.info('Symbol test', symbolData);
        logger.info('BigInt test', bigintData);
      }).not.toThrow();

      expect(console.info).toHaveBeenCalledTimes(2);
    });
  });

  describe('error scenarios', () => {
    it('should handle console method failures gracefully', () => {
      // Mock console.info to throw
      const originalInfo = console.info;
      (console.info as jest.Mock).mockImplementationOnce(() => {
        throw new Error('Console error');
      });

      expect(() => {
        logger.info('This should not crash');
      }).not.toThrow();

      // Restore
      console.info = originalInfo;
    });

    it('should handle malformed data objects', () => {
      const malformedData = {
        get problematic() {
          throw new Error('Getter error');
        }
      };

      expect(() => {
        logger.info('Malformed data test', malformedData);
      }).not.toThrow();

      expect(console.info).toHaveBeenCalled();
    });
  });

  describe('singleton logger instance', () => {
    it('should use the same instance across imports', () => {
      // The exported logger should be a singleton
      expect(logger).toBeInstanceOf(Logger);

      logger.info('Singleton test');

      expect(console.info).toHaveBeenCalledWith(
        expect.stringContaining('Singleton test'),
        undefined
      );
    });

    it('should maintain state across multiple calls', () => {
      logger.info('First call');
      logger.warn('Second call');
      logger.error('Third call');

      expect(console.info).toHaveBeenCalledTimes(1);
      expect(console.warn).toHaveBeenCalledTimes(1);
      expect(console.error).toHaveBeenCalledTimes(1);
    });
  });
});