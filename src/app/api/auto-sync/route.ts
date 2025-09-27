// Automated Data Sync API Endpoints with Validation and Monitoring
import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';

// Auto-sync modules
import { autoSyncProductToMemgraph, autoSyncOrderToMemgraph, autoSyncSearchToMemgraph } from '@/lib/memgraph-auto-sync';
import { autoSyncProductToQdrant, autoSyncUserSearchToQdrant } from '@/lib/qdrant-auto-sync';
import { saveAnalyticsEvent } from '@/lib/analytics-db';
import { EventType } from '@/lib/event-system';

// Validation and monitoring
import { validateWebhookData, validateTrackingEvent, validateProductTracking, validateOrderTracking, validateSearchTracking, ValidatedProductTracking, ValidatedOrderTracking } from '@/lib/data-validation';
import { monitoring, monitorAPICall, monitorSyncEvent } from '@/lib/monitoring-observability';

// Type definitions for the auto-sync data
interface ProductSyncData {
  productId: number;
  eventType: string;
  productData?: {
    name?: string;
    price?: number;
    categories?: Array<{ name: string; id: number }>;
  };
  metadata?: Record<string, unknown>;
}

interface OrderSyncData {
  orderId: string;
  userId?: string;
  orderTotal?: number;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
  metadata?: Record<string, unknown>;
}

interface SanitizedProductData extends ValidatedProductTracking {
  userId?: string;
  anonymousId?: string;
}

interface SanitizedOrderData extends ValidatedOrderTracking {
  orderTotal?: number;
}

// Webhook endpoint for WooCommerce product updates
export async function POST(request: NextRequest) {
  const apiMonitor = monitorAPICall('/api/auto-sync', 'POST');

  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const rawBody = await request.text();

    // Extract client IP
    const clientIp = request.headers.get('x-forwarded-for') ||
                    request.headers.get('x-real-ip') ||
                    request.headers.get('cf-connecting-ip') ||
                    'unknown';

    // Enhanced security validation
    const securityResult = await validateWebhookRequest({
      headers: request.headers,
      body: rawBody,
      url: request.url,
      method: request.method
    }, clientIp);

    if (!securityResult.allowed) {
      monitoring.recordMetric('webhook.security.blocked', 1, {
        ip: clientIp,
        reason: securityResult.reason || 'unknown',
        riskLevel: securityResult.riskLevel
      });

      apiMonitor.finish(403);
      return NextResponse.json({
        error: 'Security validation failed',
        reason: securityResult.reason,
        riskLevel: securityResult.riskLevel
      }, {
        status: 403,
        headers: {
          'X-Security-Block-Reason': securityResult.reason || 'Security policy violation',
          'X-Risk-Level': securityResult.riskLevel
        }
      });
    }

    // Log security info for monitoring
    monitoring.recordMetric('webhook.security.validated', 1, {
      ip: clientIp,
      riskLevel: securityResult.riskLevel,
      payloadSize: String(securityResult.metadata.payloadSize),
      signatureValid: String(securityResult.metadata.signatureValid)
    });

    // Rate limiting check with Redis
    const rateLimitResult = await checkWebhookRateLimit(clientIp);

    if (!rateLimitResult.allowed) {
      monitoring.recordMetric('api.rate_limit_exceeded', 1, {
        ip: clientIp,
        endpoint: '/api/auto-sync',
        totalHits: String(rateLimitResult.totalHits),
        remaining: String(rateLimitResult.remaining)
      });
      apiMonitor.finish(429);
      return NextResponse.json({
        error: 'Rate limit exceeded',
        details: {
          limit: 'Too many requests',
          resetTime: rateLimitResult.resetTime,
          remaining: rateLimitResult.remaining
        }
      }, {
        status: 429,
        headers: {
          'X-RateLimit-Remaining': rateLimitResult.remaining.toString(),
          'X-RateLimit-Reset': rateLimitResult.resetTime.toString(),
          'Retry-After': Math.ceil((rateLimitResult.resetTime - Date.now()) / 1000).toString()
        }
      });
    }

    // Parse and validate JSON
    let body;
    try {
      body = JSON.parse(rawBody);
    } catch (parseError) {
      logger.warn('Invalid JSON in webhook payload:', { parseError, rawBody: rawBody.substring(0, 500) });
      apiMonitor.finish(400);
      return NextResponse.json({ error: 'Invalid JSON payload' }, { status: 400 });
    }

    // Verify webhook signature for WooCommerce webhooks
    const topic = request.headers.get('x-wc-webhook-topic');
    if (topic && !verifyWebhookSignatureFromRequest(request, rawBody)) {
      monitoring.recordMetric('webhook.signature_failures', 1, { topic });
      apiMonitor.finish(401);
      return NextResponse.json({ error: 'Invalid webhook signature' }, { status: 401 });
    }

    // Validate webhook data structure
    if (topic) {
      const validationResult = validateWebhookData(body);
      if (!validationResult.success) {
        logger.error('Webhook data validation failed:', {
          errors: validationResult.errors,
          topic,
          action
        });
        monitoring.recordMetric('webhook.validation_failures', 1, { topic: topic || 'unknown', action: action || 'unknown' });
        apiMonitor.finish(422);
        return NextResponse.json({
          error: 'Invalid webhook data',
          details: validationResult.errors
        }, { status: 422 });
      }
      // Use sanitized data
      body = validationResult.sanitized || body;
    }

    logger.info(`🔄 Auto-sync webhook triggered: ${action}`);

    switch (action) {
      case 'product_created':
      case 'product_updated':
        await handleProductSync(body);
        break;

      case 'order_created':
        await handleOrderSync(body);
        break;

      case 'user_interaction':
        await handleUserInteractionSync(body);
        break;

      case 'search_performed':
        await handleSearchSync(body);
        break;

      case 'bulk_sync':
        await handleBulkSync(body);
        break;

      default:
        return NextResponse.json({ error: 'Unknown action' }, { status: 400 });
    }

    return NextResponse.json({
      success: true,
      action,
      timestamp: Date.now(),
      message: 'Auto-sync completed successfully'
    });

  } catch (error) {
    logger.error('❌ Auto-sync webhook failed:', error as Record<string, unknown>);
    return NextResponse.json(
      {
        success: false,
        error: 'Auto-sync failed',
        details: error instanceof Error ? error.message : 'Unknown error'
      },
      { status: 500 }
    );
  }
}

// Handle product synchronization
async function handleProductSync(data: {
  productId: number;
  eventType: string;
  productData?: Record<string, unknown>;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const syncMonitor = monitorSyncEvent('product_sync');

  try {
    // Validate product tracking data
    const trackingData = {
      id: `product_sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'product.view' as const,
      timestamp: Date.now(),
      sessionId: `system_${Date.now()}`,
      productId: data.productId,
      productName: (data.productData?.name as string) || 'Unknown Product',
      productPrice: parseFloat(String(data.productData?.price || '0')),
      productCategory: (Array.isArray(data.productData?.categories) && data.productData.categories[0]?.name) || 'Uncategorized',
      metadata: data.metadata
    };

    const validationResult = validateProductTracking(trackingData);
    if (!validationResult.success) {
      logger.error('Product sync validation failed:', {
        errors: validationResult.errors,
        productId: data.productId,
        eventType: data.eventType
      });
      monitoring.recordMetric('sync.validation_failures', 1, { operation: 'product_sync' });
      syncMonitor.finish(false);
      return;
    }

    const sanitizedData = validationResult.sanitized || trackingData;
    const syncTasks = [];

    // Monitor Memgraph sync
    const memgraphMonitor = monitorSyncEvent('memgraph');
    syncTasks.push(
      autoSyncProductToMemgraph({
        eventType: data.eventType,
        productId: data.productId,
        sessionId: sanitizedData.sessionId,
        timestamp: sanitizedData.timestamp,
        metadata: sanitizedData.metadata || {}
      }).then(() => memgraphMonitor.finish(true)).catch(error => {
        memgraphMonitor.finish(false);
        throw error;
      })
    );

    // Monitor Qdrant sync
    const qdrantMonitor = monitorSyncEvent('qdrant');
    syncTasks.push(
      autoSyncProductToQdrant({
        productId: data.productId,
        eventType: data.eventType,
        metadata: sanitizedData.metadata
      }).then(() => qdrantMonitor.finish(true)).catch(error => {
        qdrantMonitor.finish(false);
        throw error;
      })
    );

    // Monitor Analytics DB sync
    if (data.productData) {
      const analyticsMonitor = monitorSyncEvent('analytics');
      syncTasks.push(
        saveAnalyticsEvent({
          id: sanitizedData.id,
          type: sanitizedData.type as import('@/lib/event-system').EventType,
          timestamp: sanitizedData.timestamp,
          sessionId: sanitizedData.sessionId,
          userId: (sanitizedData as SanitizedProductData).userId || undefined,
          anonymousId: (sanitizedData as SanitizedProductData).anonymousId || undefined,
          metadata: {
            productId: data.productId,
            syncSource: 'webhook',
            validatedAt: Date.now(),
            ...sanitizedData.metadata
          }
        }).then(() => analyticsMonitor.finish(true)).catch(error => {
          analyticsMonitor.finish(false);
          throw error;
        })
      );
    }

    await Promise.all(syncTasks);
    syncMonitor.finish(true, 1);
    monitoring.recordMetric('sync.product_success', 1, { eventType: data.eventType });
    logger.info(`✅ Product ${data.productId} synced to all databases with validation`);

  } catch (error) {
    syncMonitor.finish(false);
    monitoring.recordMetric('sync.product_failures', 1, { eventType: data.eventType });
    logger.error(`❌ Product sync failed for ${data.productId}:`, error as Record<string, unknown>);
    throw error;
  }
}

// Handle order synchronization
async function handleOrderSync(data: {
  orderId: string;
  userId?: string;
  orderTotal: number;
  items: Array<{
    productId: number;
    quantity: number;
    price: number;
  }>;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const syncMonitor = monitorSyncEvent('order_sync');

  try {
    // Validate order tracking data
    const trackingData = {
      id: `order_sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'order.created' as const,
      timestamp: Date.now(),
      sessionId: `system_${Date.now()}`,
      userId: data.userId,
      orderId: data.orderId,
      orderTotal: data.orderTotal,
      itemCount: data.items.length,
      items: data.items,
      metadata: data.metadata
    };

    const validationResult = validateOrderTracking(trackingData);
    if (!validationResult.success) {
      logger.error('Order sync validation failed:', {
        errors: validationResult.errors,
        orderId: data.orderId,
        orderTotal: data.orderTotal
      });
      monitoring.recordMetric('sync.validation_failures', 1, { operation: 'order_sync' });
      syncMonitor.finish(false);
      return;
    }

    const sanitizedData = validationResult.sanitized || trackingData;
    const syncTasks = [];

    // Monitor Memgraph sync
    const memgraphMonitor = monitorSyncEvent('memgraph_order_sync');
    syncTasks.push(
      autoSyncOrderToMemgraph({
        eventType: 'order.created',
        orderId: sanitizedData.orderId,
        userId: sanitizedData.userId,
        items: sanitizedData.items,
        orderTotal: (sanitizedData as SanitizedOrderData).orderTotal || data.orderTotal,
        timestamp: sanitizedData.timestamp
      }).then(() => memgraphMonitor.finish(true)).catch(error => {
        memgraphMonitor.finish(false);
        throw error;
      })
    );

    // Monitor Analytics DB sync
    const analyticsMonitor = monitorSyncEvent('analytics_order_sync');
    syncTasks.push(
      saveAnalyticsEvent({
        id: sanitizedData.id,
        type: EventType.ORDER_CREATED,
        timestamp: sanitizedData.timestamp,
        sessionId: sanitizedData.sessionId,
        userId: sanitizedData.userId,
        metadata: {
          orderId: sanitizedData.orderId,
          orderTotal: (sanitizedData as SanitizedOrderData).orderTotal || data.orderTotal,
          itemCount: sanitizedData.itemCount,
          syncSource: 'webhook',
          validatedAt: Date.now(),
          ...sanitizedData.metadata
        }
      } satisfies import('@/lib/event-system').BaseEvent).then(() => analyticsMonitor.finish(true)).catch(error => {
        analyticsMonitor.finish(false);
        throw error;
      })
    );

    await Promise.all(syncTasks);
    syncMonitor.finish(true, 1);
    monitoring.recordMetric('sync.order_success', 1, { itemCount: data.items.length.toString() });
    logger.info(`✅ Order ${data.orderId} synced to all databases with validation`);

  } catch (error) {
    syncMonitor.finish(false);
    monitoring.recordMetric('sync.order_failures', 1, { orderId: data.orderId });
    logger.error(`❌ Order sync failed for ${data.orderId}:`, error as Record<string, unknown>);
    throw error;
  }
}

// Handle user interaction synchronization
async function handleUserInteractionSync(data: {
  userId?: string;
  sessionId: string;
  eventType: string;
  productId?: number;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const syncMonitor = monitorSyncEvent('user_interaction_sync');

  try {
    // Validate tracking data
    const trackingData = {
      id: `interaction_sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: data.eventType as import('@/lib/event-system').EventType,
      timestamp: Date.now(),
      sessionId: data.sessionId,
      userId: data.userId,
      metadata: {
        productId: data.productId,
        syncSource: 'webhook',
        ...data.metadata
      }
    };

    const validationResult = validateTrackingEvent(trackingData);
    if (!validationResult.success) {
      logger.error('User interaction sync validation failed:', {
        errors: validationResult.errors,
        eventType: data.eventType,
        sessionId: data.sessionId
      });
      monitoring.recordMetric('sync.validation_failures', 1, { operation: 'user_interaction_sync' });
      syncMonitor.finish(false);
      return;
    }

    const sanitizedData = validationResult.sanitized || trackingData;
    const syncTasks = [];

    // Monitor Memgraph sync (only if we have both productId and userId)
    if (data.productId && data.userId) {
      const memgraphMonitor = monitorSyncEvent('memgraph_user_interaction_sync');
      syncTasks.push(
        autoSyncProductToMemgraph({
          eventType: data.eventType,
          productId: data.productId,
          userId: sanitizedData.userId,
          sessionId: sanitizedData.sessionId,
          timestamp: sanitizedData.timestamp,
          metadata: sanitizedData.metadata || {}
        }).then(() => memgraphMonitor.finish(true)).catch(error => {
          memgraphMonitor.finish(false);
          throw error;
        })
      );
    }

    // Monitor Analytics DB sync
    const analyticsMonitor = monitorSyncEvent('analytics_user_interaction_sync');
    syncTasks.push(
      saveAnalyticsEvent({
        id: sanitizedData.id,
        type: sanitizedData.type as import('@/lib/event-system').EventType,
        timestamp: sanitizedData.timestamp,
        sessionId: sanitizedData.sessionId,
        userId: sanitizedData.userId,
        metadata: {
          ...sanitizedData.metadata,
          validatedAt: Date.now()
        }
      } satisfies import('@/lib/event-system').BaseEvent).then(() => analyticsMonitor.finish(true)).catch(error => {
        analyticsMonitor.finish(false);
        throw error;
      })
    );

    await Promise.all(syncTasks);
    syncMonitor.finish(true, 1);
    monitoring.recordMetric('sync.interaction_success', 1, { eventType: data.eventType });
    logger.info(`✅ User interaction synced with validation: ${data.eventType}`);

  } catch (error) {
    syncMonitor.finish(false);
    monitoring.recordMetric('sync.interaction_failures', 1, { eventType: data.eventType });
    logger.error(`❌ User interaction sync failed for ${data.eventType}:`, error as Record<string, unknown>);
    throw error;
  }
}

// Handle search synchronization
async function handleSearchSync(data: {
  query: string;
  userId?: string;
  sessionId: string;
  resultsCount: number;
  clickedResults?: number[];
  metadata?: Record<string, unknown>;
}): Promise<void> {
  const syncMonitor = monitorSyncEvent('search_sync');

  try {
    // Validate search tracking data
    const trackingData = {
      id: `search_sync_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      type: 'search.performed' as const,
      timestamp: Date.now(),
      sessionId: data.sessionId,
      userId: data.userId,
      query: data.query,
      resultsCount: data.resultsCount,
      clickedResultId: data.clickedResults?.[0],
      filters: data.metadata?.filters as Record<string, unknown> | undefined,
      metadata: {
        clickedResults: data.clickedResults,
        syncSource: 'webhook',
        ...data.metadata
      }
    };

    const validationResult = validateSearchTracking(trackingData);
    if (!validationResult.success) {
      logger.error('Search sync validation failed:', {
        errors: validationResult.errors,
        query: data.query,
        sessionId: data.sessionId
      });
      monitoring.recordMetric('sync.validation_failures', 1, { operation: 'search_sync' });
      syncMonitor.finish(false);
      return;
    }

    const sanitizedData = validationResult.sanitized || trackingData;
    const syncTasks = [];

    // Monitor Memgraph sync
    const memgraphMonitor = monitorSyncEvent('memgraph_search_sync');
    syncTasks.push(
      autoSyncSearchToMemgraph({
        query: sanitizedData.query,
        resultsCount: sanitizedData.resultsCount,
        userId: sanitizedData.userId,
        sessionId: sanitizedData.sessionId,
        timestamp: sanitizedData.timestamp,
        clickedResultId: sanitizedData.clickedResultId
      }).then(() => memgraphMonitor.finish(true)).catch(error => {
        memgraphMonitor.finish(false);
        throw error;
      })
    );

    // Monitor Qdrant sync
    const qdrantMonitor = monitorSyncEvent('qdrant_search_sync');
    syncTasks.push(
      autoSyncUserSearchToQdrant({
        query: sanitizedData.query,
        userId: sanitizedData.userId,
        sessionId: sanitizedData.sessionId,
        resultsCount: sanitizedData.resultsCount,
        clickedResults: data.clickedResults,
        timestamp: sanitizedData.timestamp
      }).then(() => qdrantMonitor.finish(true)).catch(error => {
        qdrantMonitor.finish(false);
        throw error;
      })
    );

    // Monitor Analytics DB sync
    const analyticsMonitor = monitorSyncEvent('analytics_search_sync');
    syncTasks.push(
      saveAnalyticsEvent({
        id: sanitizedData.id,
        type: sanitizedData.type as import('@/lib/event-system').EventType,
        timestamp: sanitizedData.timestamp,
        sessionId: sanitizedData.sessionId,
        userId: sanitizedData.userId,
        metadata: {
          ...sanitizedData.metadata,
          validatedAt: Date.now()
        }
      } satisfies import('@/lib/event-system').BaseEvent).then(() => analyticsMonitor.finish(true)).catch(error => {
        analyticsMonitor.finish(false);
        throw error;
      })
    );

    await Promise.all(syncTasks);
    syncMonitor.finish(true, 1);
    monitoring.recordMetric('sync.search_success', 1, {
      queryLength: data.query.length.toString(),
      resultsCount: data.resultsCount.toString()
    });
    logger.info(`✅ Search "${data.query}" synced to all databases with validation`);

  } catch (error) {
    syncMonitor.finish(false);
    monitoring.recordMetric('sync.search_failures', 1, { query: data.query });
    logger.error(`❌ Search sync failed for "${data.query}":`, error as Record<string, unknown>);
    throw error;
  }
}

// Handle bulk synchronization
async function handleBulkSync(data: {
  syncType: 'products' | 'users' | 'orders' | 'all';
  options?: {
    batchSize?: number;
    maxItems?: number;
    startDate?: string;
    endDate?: string;
  };
}): Promise<void> {
  logger.info(`🔄 Starting bulk sync: ${data.syncType}`);

  const options = {
    batchSize: 50,
    maxItems: 1000,
    ...data.options
  };

  switch (data.syncType) {
    case 'products':
      await bulkSyncProducts(options);
      break;

    case 'orders':
      await bulkSyncOrders(options);
      break;

    case 'all':
      await bulkSyncProducts(options);
      await bulkSyncOrders(options);
      break;

    default:
      throw new Error(`Unknown sync type: ${data.syncType}`);
  }

  logger.info(`✅ Bulk sync completed: ${data.syncType}`);
}

// Bulk sync products
async function bulkSyncProducts(options: { batchSize: number; maxItems: number }): Promise<void> {
  const { getAllProducts } = await import('@/lib/woocommerce');

  let page = 1;
  let totalProcessed = 0;

  while (totalProcessed < options.maxItems) {
    const products = await getAllProducts({
      per_page: options.batchSize,
      page,
      status: 'publish'
    });

    if (products.length === 0) break;

    const syncTasks = products.map(product =>
      handleProductSync({
        productId: product.id,
        eventType: 'bulk_sync.product',
        productData: product as unknown as Record<string, unknown>,
        metadata: {
          bulkSync: true,
          batch: page,
          timestamp: Date.now()
        }
      })
    );

    await Promise.all(syncTasks);

    totalProcessed += products.length;
    page++;

    logger.info(`📊 Bulk sync progress: ${totalProcessed} products processed`);

    // Small delay to prevent overwhelming the databases
    await new Promise(resolve => setTimeout(resolve, 1000));
  }
}

// Bulk sync orders (simplified - you'd implement based on your order data source)
async function bulkSyncOrders(_options: { batchSize: number; maxItems: number }): Promise<void> {
  // Implementation would depend on your order data source
  logger.info('📊 Bulk order sync would be implemented here');
}

// Import webhook utilities
import { verifyWebhookSignature } from '@/lib/webhook-config';
import { checkWebhookRateLimit } from '@/lib/redis-rate-limiter';
import { validateWebhookRequest } from '@/lib/enhanced-webhook-security';

// Verify webhook signature for security (enhanced version)
function verifyWebhookSignatureFromRequest(request: NextRequest, body: string): boolean {
  const signature = request.headers.get('x-wc-webhook-signature');
  const topic = request.headers.get('x-wc-webhook-topic');

  if (!signature || !topic) {
    logger.warn('Missing webhook signature or topic');
    return false;
  }

  return verifyWebhookSignature(signature, body);
}

// GET endpoint for status and manual triggers
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const action = searchParams.get('action');

  if (action === 'status') {
    return NextResponse.json({
      status: 'active',
      endpoints: {
        'POST /api/auto-sync?action=product_created': 'Sync single product creation',
        'POST /api/auto-sync?action=product_updated': 'Sync single product update',
        'POST /api/auto-sync?action=order_created': 'Sync new order',
        'POST /api/auto-sync?action=user_interaction': 'Sync user interaction',
        'POST /api/auto-sync?action=search_performed': 'Sync search query',
        'POST /api/auto-sync?action=bulk_sync': 'Trigger bulk synchronization',
      },
      features: [
        'Real-time product sync to Memgraph, Qdrant, and Analytics DB',
        'Order relationship tracking',
        'User behavior pattern analysis',
        'Search pattern learning',
        'Bulk synchronization support',
        'Webhook signature verification'
      ],
      lastActivity: new Date().toISOString()
    });
  }

  return NextResponse.json({
    message: 'Auto-sync API ready',
    usage: 'POST with action parameter and data payload',
    status: 'ready'
  });
}