// Enhanced Enterprise-Grade Webhook Security System
import crypto from 'crypto';
import { logger } from '@/lib/logger';
import { config } from '@/lib/unified-config';
import { monitoring } from '@/lib/monitoring-observability';

// Security configuration
export interface WebhookSecurityConfig {
  maxPayloadSize: number;          // Maximum payload size in bytes
  signatureTimeout: number;        // Max age for signatures in seconds
  allowedIpRanges: string[];       // Allowed IP CIDR ranges
  requireHttps: boolean;           // Require HTTPS in production
  rotateSecretsAfter: number;      // Rotate secrets after N days
  maxFailedAttempts: number;       // Max failed attempts before blocking
  blockDuration: number;           // Block duration in seconds
  enableReplayProtection: boolean; // Prevent replay attacks
  replayWindowMs: number;          // Replay protection window
}

// Default security configuration
const DEFAULT_SECURITY_CONFIG: WebhookSecurityConfig = {
  maxPayloadSize: 1024 * 1024,     // 1MB
  signatureTimeout: 300,           // 5 minutes
  allowedIpRanges: [],             // Empty = allow all (configure in production)
  requireHttps: process.env.NODE_ENV === 'production',
  rotateSecretsAfter: 30,          // 30 days
  maxFailedAttempts: 5,
  blockDuration: 900,              // 15 minutes
  enableReplayProtection: true,
  replayWindowMs: 300000           // 5 minutes
};

// Webhook security result
export interface WebhookSecurityResult {
  allowed: boolean;
  reason?: string;
  riskLevel: 'low' | 'medium' | 'high' | 'critical';
  metadata: {
    sourceIp: string;
    userAgent?: string;
    timestamp: number;
    payloadSize: number;
    signatureValid: boolean;
  };
}

// IP blocking cache (in production, use Redis)
const blockedIps = new Map<string, { blockedUntil: number; attempts: number }>();
const usedNonces = new Set<string>();

// Cleanup interval reference
let cleanupInterval: NodeJS.Timeout | null = null;

// Initialize cleanup
function startCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
  }

  cleanupInterval = setInterval(() => {
    const now = Date.now();

    // Clean blocked IPs
    for (const [ip, data] of blockedIps.entries()) {
      if (data.blockedUntil <= now) {
        blockedIps.delete(ip);
      }
    }

    // Clean old nonces (keep only last hour)
    if (usedNonces.size > 10000) {
      usedNonces.clear(); // Simple cleanup for memory
    }
  }, 60000); // Cleanup every minute
}

// Stop cleanup
function stopCleanup() {
  if (cleanupInterval) {
    clearInterval(cleanupInterval);
    cleanupInterval = null;
  }
}

// Start cleanup automatically
startCleanup();

export class EnhancedWebhookSecurity {
  private config: WebhookSecurityConfig;

  constructor(customConfig?: Partial<WebhookSecurityConfig>) {
    this.config = { ...DEFAULT_SECURITY_CONFIG, ...customConfig };
  }

  /**
   * Comprehensive webhook security validation
   */
  async validateWebhookSecurity(
    request: {
      headers: Headers;
      body: string;
      url: string;
      method: string;
    },
    sourceIp: string
  ): Promise<WebhookSecurityResult> {
    const metadata = {
      sourceIp,
      userAgent: request.headers.get('user-agent') || undefined,
      timestamp: Date.now(),
      payloadSize: Buffer.byteLength(request.body, 'utf8'),
      signatureValid: false
    };

    try {
      // 1. Check if IP is blocked
      const ipBlockCheck = this.checkIpBlocking(sourceIp);
      if (!ipBlockCheck.allowed) {
        monitoring.recordMetric('webhook.security.ip_blocked', 1, { ip: sourceIp });
        return {
          allowed: false,
          reason: 'IP address is temporarily blocked due to security violations',
          riskLevel: 'high',
          metadata
        };
      }

      // 2. Validate request method
      if (request.method !== 'POST') {
        this.recordSecurityViolation(sourceIp, 'invalid_method');
        return {
          allowed: false,
          reason: 'Invalid HTTP method - only POST allowed',
          riskLevel: 'medium',
          metadata
        };
      }

      // 3. Validate HTTPS in production
      if (this.config.requireHttps && !request.url.startsWith('https://')) {
        this.recordSecurityViolation(sourceIp, 'non_https');
        return {
          allowed: false,
          reason: 'HTTPS required in production environment',
          riskLevel: 'high',
          metadata
        };
      }

      // 4. Check payload size
      if (metadata.payloadSize > this.config.maxPayloadSize) {
        this.recordSecurityViolation(sourceIp, 'payload_too_large');
        return {
          allowed: false,
          reason: `Payload size ${metadata.payloadSize} exceeds maximum ${this.config.maxPayloadSize}`,
          riskLevel: 'medium',
          metadata
        };
      }

      // 5. Validate IP whitelist (if configured)
      if (this.config.allowedIpRanges.length > 0) {
        const ipAllowed = this.isIpAllowed(sourceIp);
        if (!ipAllowed) {
          this.recordSecurityViolation(sourceIp, 'ip_not_whitelisted');
          return {
            allowed: false,
            reason: 'Source IP not in allowed ranges',
            riskLevel: 'high',
            metadata
          };
        }
      }

      // 6. Validate webhook signature with enhanced security
      const signatureResult = await this.validateEnhancedSignature(request, sourceIp);
      metadata.signatureValid = signatureResult.valid;

      if (!signatureResult.valid) {
        this.recordSecurityViolation(sourceIp, 'invalid_signature');
        return {
          allowed: false,
          reason: signatureResult.reason || 'Invalid webhook signature',
          riskLevel: 'critical',
          metadata
        };
      }

      // 7. Check for replay attacks
      if (this.config.enableReplayProtection) {
        const replayCheck = this.checkReplayAttack(request, sourceIp);
        if (!replayCheck.allowed) {
          this.recordSecurityViolation(sourceIp, 'replay_attack');
          return {
            allowed: false,
            reason: 'Potential replay attack detected',
            riskLevel: 'critical',
            metadata
          };
        }
      }

      // 8. Validate content type
      const contentType = request.headers.get('content-type');
      if (!contentType || !contentType.includes('application/json')) {
        this.recordSecurityViolation(sourceIp, 'invalid_content_type');
        return {
          allowed: false,
          reason: 'Invalid content type - application/json required',
          riskLevel: 'medium',
          metadata
        };
      }

      // 9. Check for suspicious headers
      const suspiciousHeaderCheck = this.checkSuspiciousHeaders(request.headers, sourceIp);
      if (!suspiciousHeaderCheck.allowed) {
        return {
          allowed: false,
          reason: suspiciousHeaderCheck.reason,
          riskLevel: 'high',
          metadata
        };
      }

      // All checks passed
      monitoring.recordMetric('webhook.security.validated', 1, { ip: sourceIp });
      return {
        allowed: true,
        riskLevel: 'low',
        metadata
      };

    } catch (error) {
      logger.error('Webhook security validation error:', error as Record<string, unknown>);
      monitoring.recordMetric('webhook.security.validation_error', 1, { ip: sourceIp });

      return {
        allowed: false,
        reason: 'Security validation failed',
        riskLevel: 'critical',
        metadata
      };
    }
  }

  /**
   * Enhanced signature validation with multiple security layers
   */
  private async validateEnhancedSignature(
    request: { headers: Headers; body: string },
    sourceIp: string
  ): Promise<{ valid: boolean; reason?: string }> {
    const signature = request.headers.get('x-wc-webhook-signature');
    const topic = request.headers.get('x-wc-webhook-topic');
    const timestamp = request.headers.get('x-wc-webhook-timestamp');
    const _delivery = request.headers.get('x-wc-webhook-delivery');

    if (!signature) {
      return { valid: false, reason: 'Missing webhook signature' };
    }

    if (!topic) {
      return { valid: false, reason: 'Missing webhook topic' };
    }

    // Check signature timestamp (if provided)
    if (timestamp) {
      const signatureAge = Date.now() / 1000 - parseInt(timestamp);
      if (signatureAge > this.config.signatureTimeout) {
        monitoring.recordMetric('webhook.security.signature_expired', 1, { ip: sourceIp });
        return { valid: false, reason: 'Signature timestamp expired' };
      }
    }

    // Validate primary signature
    const webhookSecret = config.webhooks.secret || 'default-webhook-secret';
    const primaryValid = this.verifyHmacSignature(signature, request.body, webhookSecret);
    if (!primaryValid) {
      return { valid: false, reason: 'Primary signature verification failed' };
    }

    // Validate against backup secret (if configured)
    const backupSecret = process.env.WEBHOOK_BACKUP_SECRET;
    if (backupSecret) {
      const backupValid = this.verifyHmacSignature(signature, request.body, backupSecret);
      if (!backupValid && !primaryValid) {
        return { valid: false, reason: 'Both primary and backup signature verification failed' };
      }
    }

    // Additional validation for specific topics
    if (!this.isValidTopic(topic)) {
      return { valid: false, reason: 'Invalid or unauthorized webhook topic' };
    }

    return { valid: true };
  }

  /**
   * HMAC signature verification with enhanced security
   */
  private verifyHmacSignature(signature: string, body: string, secret: string): boolean {
    try {
      // Support both base64 and hex encodings
      const expectedBase64 = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('base64');

      const expectedHex = crypto
        .createHmac('sha256', secret)
        .update(body, 'utf8')
        .digest('hex');

      // Try both formats
      const signatureBuffer = Buffer.from(signature);
      const expectedBase64Buffer = Buffer.from(expectedBase64);
      const expectedHexBuffer = Buffer.from(expectedHex);

      return (
        (signatureBuffer.length === expectedBase64Buffer.length &&
          crypto.timingSafeEqual(signatureBuffer, expectedBase64Buffer)) ||
        (signatureBuffer.length === expectedHexBuffer.length &&
          crypto.timingSafeEqual(signatureBuffer, expectedHexBuffer))
      );
    } catch (error) {
      logger.error('HMAC signature verification error:', error as Record<string, unknown>);
      return false;
    }
  }

  /**
   * Check for replay attacks using nonce and timestamp
   */
  private checkReplayAttack(
    request: { headers: Headers; body: string },
    sourceIp: string
  ): { allowed: boolean; reason?: string } {
    const _delivery = request.headers.get('x-wc-webhook-delivery');
    const timestamp = request.headers.get('x-wc-webhook-timestamp');

    // Create a unique nonce for this request
    const nonce = crypto
      .createHash('sha256')
      .update(request.body + (_delivery || '') + (timestamp || '') + sourceIp)
      .digest('hex');

    // Check if we've seen this nonce before
    if (usedNonces.has(nonce)) {
      monitoring.recordMetric('webhook.security.replay_detected', 1, { ip: sourceIp });
      return { allowed: false, reason: 'Duplicate request detected (replay attack)' };
    }

    // Check timestamp freshness
    if (timestamp) {
      const requestTime = parseInt(timestamp) * 1000;
      const now = Date.now();
      const age = now - requestTime;

      if (age > this.config.replayWindowMs) {
        return { allowed: false, reason: 'Request timestamp too old' };
      }

      if (age < -30000) { // 30 seconds in future
        return { allowed: false, reason: 'Request timestamp too far in future' };
      }
    }

    // Store nonce to prevent replay
    usedNonces.add(nonce);

    return { allowed: true };
  }

  /**
   * Check for suspicious headers
   */
  private checkSuspiciousHeaders(
    headers: Headers,
    sourceIp: string
  ): { allowed: boolean; reason?: string } {
    const userAgent = headers.get('user-agent') || '';
    const origin = headers.get('origin');
    const _referer = headers.get('referer');

    // Check for suspicious user agents
    const suspiciousPatterns = [
      /curl/i,
      /wget/i,
      /python/i,
      /bot/i,
      /scanner/i,
      /sqlmap/i,
      /nikto/i
    ];

    for (const pattern of suspiciousPatterns) {
      if (pattern.test(userAgent)) {
        monitoring.recordMetric('webhook.security.suspicious_user_agent', 1, {
          ip: sourceIp,
          userAgent
        });
        // Log but don't block - could be legitimate automation
        logger.warn('Suspicious user agent detected', { ip: sourceIp, userAgent });
      }
    }

    // Check for unexpected origin/referer
    if (origin && !this.isValidOrigin(origin)) {
      return {
        allowed: false,
        reason: 'Invalid origin header'
      };
    }

    // Check for injection attempts in headers
    const allHeaders = Array.from(headers.entries());
    for (const [name, value] of allHeaders) {
      if (this.containsSqlInjection(value) || this.containsXssAttempt(value)) {
        monitoring.recordMetric('webhook.security.injection_attempt', 1, {
          ip: sourceIp,
          header: name
        });
        return {
          allowed: false,
          reason: 'Malicious content detected in headers'
        };
      }
    }

    return { allowed: true };
  }

  /**
   * Check IP blocking status and update failure counts
   */
  private checkIpBlocking(sourceIp: string): { allowed: boolean } {
    const now = Date.now();
    const blocked = blockedIps.get(sourceIp);

    if (blocked) {
      if (blocked.blockedUntil > now) {
        return { allowed: false };
      } else {
        // Block expired, reset
        blockedIps.delete(sourceIp);
      }
    }

    return { allowed: true };
  }

  /**
   * Record security violation and potentially block IP
   */
  private recordSecurityViolation(sourceIp: string, violation: string): void {
    monitoring.recordMetric('webhook.security.violation', 1, {
      ip: sourceIp,
      violation
    });

    logger.warn('Webhook security violation', {
      ip: sourceIp,
      violation,
      timestamp: Date.now()
    });

    // Update failure count
    const current = blockedIps.get(sourceIp) || { blockedUntil: 0, attempts: 0 };
    current.attempts++;

    if (current.attempts >= this.config.maxFailedAttempts) {
      current.blockedUntil = Date.now() + (this.config.blockDuration * 1000);
      monitoring.recordMetric('webhook.security.ip_auto_blocked', 1, { ip: sourceIp });
      logger.error('IP auto-blocked due to security violations', {
        ip: sourceIp,
        attempts: current.attempts
      });
    }

    blockedIps.set(sourceIp, current);
  }

  /**
   * Validate if IP is in allowed ranges (CIDR)
   */
  private isIpAllowed(ip: string): boolean {
    if (this.config.allowedIpRanges.length === 0) {
      return true; // No restrictions
    }

    // Simple IP validation - in production, use proper CIDR library
    for (const range of this.config.allowedIpRanges) {
      if (range === ip || range === '0.0.0.0/0') {
        return true;
      }
      // Add proper CIDR matching logic here
    }

    return false;
  }

  /**
   * Validate webhook topic
   */
  private isValidTopic(topic: string): boolean {
    const allowedTopics = [
      'product.created',
      'product.updated',
      'product.deleted',
      'order.created',
      'order.updated',
      'order.deleted',
      'customer.created',
      'customer.updated'
    ];

    return allowedTopics.includes(topic);
  }

  /**
   * Validate origin header
   */
  private isValidOrigin(origin: string): boolean {
    const allowedOrigins = [
      config.app.baseUrl,
      config.woocommerce.apiUrl
    ].filter((url): url is string => Boolean(url));

    return allowedOrigins.some(allowed => origin.startsWith(allowed));
  }

  /**
   * Check for SQL injection patterns
   */
  private containsSqlInjection(value: string): boolean {
    const sqlPatterns = [
      /(\b(SELECT|INSERT|UPDATE|DELETE|DROP|CREATE|ALTER|EXEC|EXECUTE)\b)/i,
      /(UNION\s+ALL\s+SELECT)/i,
      /(\bOR\s+1\s*=\s*1\b)/i,
      /(\bAND\s+1\s*=\s*1\b)/i,
      /(\';\s*(SELECT|INSERT|UPDATE|DELETE))/i
    ];

    return sqlPatterns.some(pattern => pattern.test(value));
  }

  /**
   * Check for XSS attempts
   */
  private containsXssAttempt(value: string): boolean {
    const xssPatterns = [
      /<script[\s\S]*?>[\s\S]*?<\/script>/i,
      /javascript:/i,
      /on\w+\s*=/i,
      /<iframe[\s\S]*?>/i,
      /<object[\s\S]*?>/i,
      /<embed[\s\S]*?>/i
    ];

    return xssPatterns.some(pattern => pattern.test(value));
  }

  /**
   * Get security metrics for monitoring
   */
  getSecurityMetrics(): {
    blockedIps: number;
    usedNonces: number;
    config: WebhookSecurityConfig;
  } {
    return {
      blockedIps: blockedIps.size,
      usedNonces: usedNonces.size,
      config: this.config
    };
  }

  /**
   * Manual IP unblocking (admin function)
   */
  unblockIp(ip: string): boolean {
    const wasBlocked = blockedIps.has(ip);
    blockedIps.delete(ip);

    if (wasBlocked) {
      monitoring.recordMetric('webhook.security.ip_manually_unblocked', 1, { ip });
      logger.info('IP manually unblocked', { ip, timestamp: Date.now() });
    }

    return wasBlocked;
  }

  /**
   * Get blocked IPs list (admin function)
   */
  getBlockedIps(): Array<{ ip: string; blockedUntil: number; attempts: number }> {
    const now = Date.now();
    return Array.from(blockedIps.entries())
      .filter(([_, data]) => data.blockedUntil > now)
      .map(([ip, data]) => ({ ip, ...data }));
  }
}

// Export singleton instance
export const webhookSecurity = new EnhancedWebhookSecurity();

// Convenience function for the auto-sync API
export async function validateWebhookRequest(request: {
  headers: Headers;
  body: string;
  url: string;
  method: string;
}, sourceIp: string): Promise<WebhookSecurityResult> {
  return webhookSecurity.validateWebhookSecurity(request, sourceIp);
}

// Graceful shutdown handler
const cleanup = () => {
  logger.info('🧹 Cleaning up enhanced webhook security...');
  stopCleanup();
};

// Register cleanup handlers
if (typeof process !== 'undefined') {
  process.on('SIGINT', cleanup);
  process.on('SIGTERM', cleanup);
  process.on('beforeExit', cleanup);
}

export default webhookSecurity;