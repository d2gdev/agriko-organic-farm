// WooCommerce Webhook Configuration for Auto-Sync
import { Core } from '@/types/TYPE_REGISTRY';
import { logger } from '@/lib/logger';
import { config } from '@/lib/unified-config';
import crypto from 'crypto';

// WooCommerce webhook response types
interface WCWebhook {
  id: number;
  name: string;
  topic: string;
  delivery_url: string;
  secret: string;
  status: 'active' | 'paused' | 'disabled';
  api_version: string;
  date_created?: string;
  date_modified?: string;
}

interface WCProductWebhookData {
  id: number;
  name: string;
  price: Core.Money;
  status: string;
  categories?: Array<{ name: string; id: number }>;
}

interface WCOrderWebhookData {
  id: number;
  customer_id?: number;
  total: string;
  status: string;
  payment_method?: string;
  billing?: {
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  line_items?: Array<{
    product_id: number;
    quantity: number;
    price: Core.Money;
  }>;
}

type WebhookData = WCProductWebhookData | WCOrderWebhookData;

interface ProcessedWebhookResult {
  action: string;
  processedData: {
    productId?: number;
    orderId?: string;
    userId?: string;
    orderValue?: number;
    items?: Array<{
      productId: number;
      quantity: number;
      price: number;
    }>;
    eventType?: string;
    productData?: WCProductWebhookData;
    metadata: {
      name?: string;
      price?: string;
      status: string;
      categories?: string[];
      paymentMethod?: string;
      customerEmail?: string;
      webhook: boolean;
      timestamp: number;
    };
  };
}

export interface WebhookConfig {
  name: string;
  topic: string;
  delivery_url: string;
  secret: string;
  status: 'active' | 'paused' | 'disabled';
  api_version: string;
}

// Webhook configurations for auto-sync
export const AUTO_SYNC_WEBHOOKS: WebhookConfig[] = [
  {
    name: 'Auto-Sync Product Created',
    topic: 'product.created',
    delivery_url: `${config.app.baseUrl}/api/auto-sync?action=product_created`,
    secret: config.webhooks.secret || 'default-webhook-secret',
    status: 'active',
    api_version: 'wp_api_v3'
  },
  {
    name: 'Auto-Sync Product Updated',
    topic: 'product.updated',
    delivery_url: `${config.app.baseUrl}/api/auto-sync?action=product_updated`,
    secret: config.webhooks.secret || 'default-webhook-secret',
    status: 'active',
    api_version: 'wp_api_v3'
  },
  {
    name: 'Auto-Sync Order Created',
    topic: 'order.created',
    delivery_url: `${config.app.baseUrl}/api/auto-sync?action=order_created`,
    secret: config.webhooks.secret || 'default-webhook-secret',
    status: 'active',
    api_version: 'wp_api_v3'
  },
  {
    name: 'Auto-Sync Order Updated',
    topic: 'order.updated',
    delivery_url: `${config.app.baseUrl}/api/auto-sync?action=order_updated`,
    secret: config.webhooks.secret || 'default-webhook-secret',
    status: 'active',
    api_version: 'wp_api_v3'
  }
];

/**
 * Creates or updates WooCommerce webhooks for auto-sync
 */
export async function setupAutoSyncWebhooks(): Promise<{
  success: boolean;
  created: number;
  updated: number;
  errors: string[];
}> {
  const results = {
    success: true,
    created: 0,
    updated: 0,
    errors: [] as string[]
  };

  if (!config.woocommerce.apiUrl) {
    results.success = false;
    results.errors.push('Missing WooCommerce API URL');
    return results;
  }

  const webhookSecret = config.webhooks.secret || 'default-webhook-secret';
  if (!webhookSecret || webhookSecret === 'default-webhook-secret') {
    logger.warn('Using default webhook secret - configure WEBHOOK_SECRET in production');
  }

  try {
    const { wcRequest } = await import('./woocommerce');

    // Get existing webhooks
    const existingWebhooks = await wcRequest<WCWebhook[]>('/webhooks');

    for (const webhookConfig of AUTO_SYNC_WEBHOOKS) {
      try {
        // Check if webhook already exists
        const existing = existingWebhooks.find(wh =>
          wh.topic === webhookConfig.topic &&
          wh.delivery_url === webhookConfig.delivery_url
        );

        if (existing) {
          // Update existing webhook
          await wcRequest(`/webhooks/${existing.id}`, {
            method: 'PUT',
            body: JSON.stringify({
              status: webhookConfig.status,
              secret: webhookConfig.secret,
              api_version: webhookConfig.api_version
            })
          });
          results.updated++;
          logger.info(`✅ Updated webhook: ${webhookConfig.name}`);
        } else {
          // Create new webhook
          await wcRequest('/webhooks', {
            method: 'POST',
            body: JSON.stringify(webhookConfig)
          });
          results.created++;
          logger.info(`✅ Created webhook: ${webhookConfig.name}`);
        }
      } catch (error) {
        const errorMsg = `Failed to setup webhook ${webhookConfig.name}: ${error instanceof Error ? error.message : String(error)}`;
        results.errors.push(errorMsg);
        logger.error(errorMsg);
        results.success = false;
      }
    }

    logger.info(`🔗 Webhook setup completed: ${results.created} created, ${results.updated} updated, ${results.errors.length} errors`);
    return results;

  } catch (error) {
    results.success = false;
    results.errors.push(`Webhook setup failed: ${error instanceof Error ? error.message : String(error)}`);
    logger.error('Failed to setup auto-sync webhooks:', error as Record<string, unknown>);
    return results;
  }
}

/**
 * Verifies webhook signature for security
 */
export function verifyWebhookSignature(
  signature: string | null,
  body: string,
  secret: string = config.webhooks.secret || 'default-webhook-secret'
): boolean {
  if (!signature || !secret) {
    logger.warn('Webhook signature verification failed: missing signature or secret');
    return false;
  }

  try {
    // WooCommerce uses HMAC-SHA256
    const expectedSignature = crypto
      .createHmac('sha256', secret)
      .update(body, 'utf8')
      .digest('base64');

    // Use timing-safe comparison to prevent timing attacks
    return crypto.timingSafeEqual(
      Buffer.from(signature),
      Buffer.from(expectedSignature)
    );
  } catch (error) {
    logger.error('Webhook signature verification error:', error as Record<string, unknown>);
    return false;
  }
}

/**
 * Processes incoming webhook data
 */
export function processWebhookData(topic: string, data: WebhookData): ProcessedWebhookResult {
  switch (topic) {
    case 'product.created':
    case 'product.updated': {
      const productData = data as WCProductWebhookData;
      return {
        action: topic.replace('.', '_'),
        processedData: {
          productId: productData.id,
          eventType: topic,
          productData: productData,
          metadata: {
            name: productData.name,
            price: productData.price?.toString(),
            status: productData.status,
            categories: productData.categories?.map((cat) => cat.name) || [],
            webhook: true,
            timestamp: Date.now()
          }
        }
      };
    }

    case 'order.created':
    case 'order.updated':
      return {
        action: topic.replace('.', '_'),
        processedData: {
          orderId: data.id.toString(),
          userId: (data as WCOrderWebhookData).customer_id ? (data as WCOrderWebhookData).customer_id!.toString() : undefined,
          orderValue: parseFloat((data as WCOrderWebhookData).total || '0'),
          items: (data as WCOrderWebhookData).line_items?.map((item) => ({
            productId: item.product_id,
            quantity: item.quantity,
            price: parseFloat(item.price?.toString() || '0')
          })) || [],
          metadata: {
            status: data.status,
            paymentMethod: (data as WCOrderWebhookData).payment_method,
            customerEmail: (data as WCOrderWebhookData).billing?.email,
            webhook: true,
            timestamp: Date.now()
          }
        }
      };

    default:
      throw new Error(`Unknown webhook topic: ${topic}`);
  }
}

/**
 * Test webhook connectivity
 */
export async function testWebhookConnectivity(): Promise<{
  success: boolean;
  webhooks: Array<{
    id: number;
    name: string;
    topic: string;
    status: string;
    lastDelivery?: string;
  }>;
  errors: string[];
}> {
  const results = {
    success: true,
    webhooks: [] as Array<{
      id: number;
      name: string;
      topic: string;
      status: string;
      lastDelivery?: string;
    }>,
    errors: [] as string[]
  };

  try {
    const { wcRequest } = await import('./woocommerce');
    const webhooks = await wcRequest<WCWebhook[]>('/webhooks');

    results.webhooks = webhooks
      .filter(wh => wh.delivery_url?.includes('/api/auto-sync'))
      .map(wh => ({
        id: wh.id,
        name: wh.name,
        topic: wh.topic,
        status: wh.status,
        lastDelivery: wh.date_modified
      }));

    logger.info(`📊 Found ${results.webhooks.length} auto-sync webhooks`);

  } catch (error) {
    results.success = false;
    results.errors.push(`Failed to test webhook connectivity: ${error instanceof Error ? error.message : String(error)}`);
    logger.error('Webhook connectivity test failed:', error as Record<string, unknown>);
  }

  return results;
}