/**
 * Adapter layer for migrating from old EntityMetadata to new typed metadata
 * This allows gradual migration without breaking existing code
 */

import { EntityMetadata as OldEntityMetadata } from '@/types/common';
import {
  EntityMetadata as NewEntityMetadata,
  UserMetadata,
  migrateFromLegacyMetadata,
  createProductMetadata,
  createOrderMetadata,
  createSearchMetadata,
  createUserMetadata,
  createSyncMetadata,
  createPageMetadata,
  createGenericMetadata,
} from '@/types/metadata';

/**
 * Adapter class that can work with both old and new metadata formats
 */
export class MetadataAdapter {
  /**
   * Convert new metadata back to old format for backward compatibility
   */
  static toLegacy(metadata: NewEntityMetadata): OldEntityMetadata {
    const base: OldEntityMetadata = {
      timestamp: metadata.timestamp,
      correlationId: metadata.correlationId,
      requestId: metadata.requestId,
      environment: metadata.environment,
      region: metadata.region,
      tenant: metadata.tenant,
      createdAt: metadata.createdAt,
      updatedAt: metadata.updatedAt,
      createdBy: metadata.createdBy,
      updatedBy: metadata.updatedBy,
      version: metadata.version,
      tags: metadata.tags,
      source: metadata.source,
    };

    // Add type-specific fields
    switch (metadata.type) {
      case 'product':
        return {
          ...base,
          productId: metadata.productId,
        };

      case 'order':
        return {
          ...base,
          orderId: metadata.orderId,
          orderTotal: metadata.orderTotal,
          itemCount: metadata.itemCount,
          paymentMethod: metadata.paymentMethod,
          shippingMethod: metadata.shippingMethod,
        };

      case 'search':
        return {
          ...base,
          searchQuery: metadata.searchQuery,
          queryLength: metadata.queryLength,
          hasFilters: metadata.hasFilters,
          clickedResults: metadata.clickedResults,
        };

      case 'user':
        return {
          ...base,
          type: 'user',
          userId: metadata.userId,
          sessionId: metadata.sessionId,
          userAgent: metadata.userAgent,
          ipAddress: metadata.ipAddress,
        } as UserMetadata;

      case 'sync':
        return {
          ...base,
          syncSource: metadata.syncSource,
          autoSync: metadata.autoSync,
          realTimeSync: metadata.realTimeSync,
          priority: metadata.priority,
        };

      case 'page':
        return {
          ...base,
          pageUrl: metadata.pageUrl,
          entryType: metadata.entryType,
          startTime: metadata.startTime,
        };

      case 'validation':
        return {
          ...base,
          validatedAt: metadata.validatedAt,
        };

      case 'analytics':
      case 'generic':
      default:
        return {
          ...base,
          name: metadata.type === 'generic' ? metadata.name : undefined,
          value: metadata.type === 'generic' ? metadata.value : undefined,
        };
    }
  }

  /**
   * Convert old metadata to new format
   */
  static fromLegacy(metadata: OldEntityMetadata): NewEntityMetadata {
    return migrateFromLegacyMetadata(metadata);
  }

  /**
   * Check if metadata is in new format
   */
  static isNewFormat(metadata: unknown): metadata is NewEntityMetadata {
    return Boolean(metadata && typeof metadata === 'object' && 'type' in metadata);
  }

  /**
   * Check if metadata is in old format
   */
  static isOldFormat(metadata: unknown): metadata is OldEntityMetadata {
    return Boolean(metadata && typeof metadata === 'object' && !('type' in metadata));
  }

  /**
   * Normalize metadata to new format regardless of input
   */
  static normalize(metadata: OldEntityMetadata | NewEntityMetadata | unknown): NewEntityMetadata {
    if (!metadata || typeof metadata !== 'object') {
      return createGenericMetadata({});
    }

    if (this.isNewFormat(metadata)) {
      return metadata;
    }

    if (this.isOldFormat(metadata)) {
      return this.fromLegacy(metadata);
    }

    // Unknown format - treat as generic
    return createGenericMetadata(metadata as Record<string, unknown>);
  }
}

/**
 * Helper functions for working with metadata in transition period
 */

// For functions that expect old metadata
export function withLegacyMetadata<T extends unknown[], R>(
  fn: (...args: T) => R
): (...args: T) => R {
  return (...args: T): R => {
    // Convert any NewEntityMetadata arguments to OldEntityMetadata
    const convertedArgs = args.map(arg => {
      if (MetadataAdapter.isNewFormat(arg)) {
        return MetadataAdapter.toLegacy(arg);
      }
      return arg;
    }) as T;

    return fn(...convertedArgs);
  };
}

// For functions that expect new metadata
export function withNewMetadata<T extends unknown[], R>(
  fn: (...args: T) => R
): (...args: T) => R {
  return (...args: T): R => {
    // Convert any OldEntityMetadata arguments to NewEntityMetadata
    const convertedArgs = args.map(arg => {
      if (MetadataAdapter.isOldFormat(arg)) {
        return MetadataAdapter.fromLegacy(arg);
      }
      return arg;
    }) as T;

    return fn(...convertedArgs);
  };
}

/**
 * Decorator for class methods to auto-convert metadata
 */
export function AutoConvertMetadata(target: unknown, propertyKey: string, descriptor: PropertyDescriptor) {
  const originalMethod = descriptor.value;

  descriptor.value = function (...args: unknown[]) {
    // Convert metadata arguments
    const convertedArgs = args.map(arg => {
      if (MetadataAdapter.isOldFormat(arg)) {
        return MetadataAdapter.fromLegacy(arg);
      }
      return arg;
    });

    // Call original method
    const result = originalMethod.apply(this, convertedArgs);

    // Convert result if it's metadata
    if (MetadataAdapter.isNewFormat(result)) {
      return MetadataAdapter.toLegacy(result);
    }

    return result;
  };

  return descriptor;
}

/**
 * Type-safe metadata builders for common scenarios
 */
export class MetadataBuilder {
  static forProduct(productId: number, additional?: Partial<OldEntityMetadata>): NewEntityMetadata {
    return createProductMetadata({
      productId,
      timestamp: Date.now(),
      ...additional,
    });
  }

  static forOrder(orderId: string, orderTotal: number, additional?: Partial<OldEntityMetadata>): NewEntityMetadata {
    return createOrderMetadata({
      orderId,
      orderTotal,
      itemCount: 0,
      timestamp: Date.now(),
      ...additional,
    });
  }

  static forSearch(query: string, additional?: Partial<OldEntityMetadata>): NewEntityMetadata {
    return createSearchMetadata({
      searchQuery: query,
      queryLength: query.length,
      hasFilters: false,
      timestamp: Date.now(),
      ...additional,
    });
  }

  static forUser(userId?: string, sessionId?: string, additional?: Partial<OldEntityMetadata>): NewEntityMetadata {
    return createUserMetadata({
      userId,
      sessionId,
      timestamp: Date.now(),
      ...additional,
    });
  }

  static forSync(source: string, additional?: Partial<OldEntityMetadata>): NewEntityMetadata {
    return createSyncMetadata({
      syncSource: source,
      timestamp: Date.now(),
      ...additional,
    });
  }

  static forPage(url: string, additional?: Partial<OldEntityMetadata>): NewEntityMetadata {
    return createPageMetadata({
      pageUrl: url,
      timestamp: Date.now(),
      ...additional,
    });
  }
}