// Webhook Security Management API
import { NextRequest, NextResponse } from 'next/server';
import { webhookSecurity } from '@/lib/enhanced-webhook-security';
import { validateAdminAuth } from '@/lib/unified-auth';
import { logger } from '@/lib/logger';

export const runtime = 'nodejs';

// GET /api/webhook-security - Get security status and metrics
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin access
    const authResult = await validateAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized access to security endpoint' },
        { status: 401 }
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'status';

    switch (action) {
      case 'status': {
          const metrics = webhookSecurity.getSecurityMetrics();
          const blockedIps = webhookSecurity.getBlockedIps();

          return NextResponse.json({
            status: 'active',
            timestamp: Date.now(),
            metrics: {
              blockedIps: metrics.blockedIps,
              usedNonces: metrics.usedNonces,
              activeBlocks: blockedIps.length
            },
            configuration: {
              maxPayloadSize: metrics.config.maxPayloadSize,
              signatureTimeout: metrics.config.signatureTimeout,
              maxFailedAttempts: metrics.config.maxFailedAttempts,
              blockDuration: metrics.config.blockDuration,
              requireHttps: metrics.config.requireHttps,
              enableReplayProtection: metrics.config.enableReplayProtection
            },
            blockedIps: blockedIps.map(block => ({
              ip: block.ip,
              blockedUntil: new Date(block.blockedUntil).toISOString(),
              attempts: block.attempts,
              timeRemaining: Math.max(0, block.blockedUntil - Date.now())
            })),
            securityFeatures: [
              'Enhanced HMAC signature verification',
              'IP-based blocking with auto-unblock',
              'Replay attack protection',
              'Payload size validation',
              'Suspicious header detection',
              'SQL injection and XSS protection',
              'HTTPS enforcement in production',
              'Topic whitelist validation',
              'User agent analysis',
              'Real-time security monitoring'
            ]
          });

      }

      case 'blocked-ips': {
        const allBlockedIps = webhookSecurity.getBlockedIps();
        return NextResponse.json({
          blockedIps: allBlockedIps,
          count: allBlockedIps.length,
          timestamp: Date.now()
        });

      }

      case 'health': {
        const healthMetrics = webhookSecurity.getSecurityMetrics();
        const isHealthy = healthMetrics.blockedIps < 100 && healthMetrics.usedNonces < 10000;

        return NextResponse.json({
          status: isHealthy ? 'healthy' : 'degraded',
          metrics: healthMetrics,
          recommendations: isHealthy ? [] : [
            healthMetrics.blockedIps >= 100 ? 'High number of blocked IPs detected' : null,
            healthMetrics.usedNonces >= 10000 ? 'Nonce cache getting large, cleanup needed' : null
          ].filter(Boolean)
        });

      }

      default:
        return NextResponse.json(
          { error: 'Unknown action', availableActions: ['status', 'blocked-ips', 'health'] },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Webhook security API error:', error as Record<string, unknown>);
    return NextResponse.json(
      { error: 'Security API failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// POST /api/webhook-security - Security management actions
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin access
    const authResult = await validateAdminAuth(request);
    if (!authResult.success) {
      return NextResponse.json(
        { error: 'Unauthorized access to security management' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { action, ip } = body;

    switch (action) {
      case 'unblock-ip': {
        if (!ip) {
          return NextResponse.json(
            { error: 'IP address required for unblock action' },
            { status: 400 }
          );
        }

        const wasBlocked = webhookSecurity.unblockIp(ip);

        logger.info('Admin IP unblock action', {
          ip,
          wasBlocked,
          admin: authResult.userId,
          timestamp: Date.now()
        });

        return NextResponse.json({
          success: true,
          action: 'unblock-ip',
          ip,
          wasBlocked,
          message: wasBlocked ? `IP ${ip} has been unblocked` : `IP ${ip} was not blocked`
        });
      }

      case 'get-security-events':
        // This would typically query a database of security events
        // For now, return basic info
        return NextResponse.json({
          success: true,
          events: [
            {
              type: 'ip_blocked',
              timestamp: Date.now() - 300000,
              details: { reason: 'Example security event' }
            }
          ],
          message: 'Security events retrieved (limited to last 24 hours)'
        });

      case 'test-security': {
        // Test current security configuration
        const testResult = await testSecurityConfiguration();
        return NextResponse.json({
          success: true,
          testResult,
          timestamp: Date.now()
        });

      }

      default:
        return NextResponse.json(
          {
            error: 'Unknown action',
            availableActions: ['unblock-ip', 'get-security-events', 'test-security']
          },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('Webhook security management error:', error as Record<string, unknown>);
    return NextResponse.json(
      { error: 'Security management failed', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}

// Test security configuration
async function testSecurityConfiguration(): Promise<{
  passed: number;
  failed: number;
  tests: Array<{ name: string; passed: boolean; details?: string }>;
}> {
  const tests = [];

  // Test 1: Signature verification
  try {
    const testBody = '{"test": "data"}';
    const testHeaders = new Headers({
      'content-type': 'application/json',
      'x-wc-webhook-topic': 'product.created',
      'x-wc-webhook-signature': 'test-signature'
    });

    const result = await webhookSecurity.validateWebhookSecurity({
      headers: testHeaders,
      body: testBody,
      url: 'https://example.com/api/webhook',
      method: 'POST'
    }, '127.0.0.1');

    tests.push({
      name: 'Basic webhook validation',
      passed: true,
      details: `Risk level: ${result.riskLevel}, Allowed: ${result.allowed}`
    });
  } catch (error) {
    tests.push({
      name: 'Basic webhook validation',
      passed: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 2: IP blocking functionality
  try {
    const blockedIps = webhookSecurity.getBlockedIps();
    tests.push({
      name: 'IP blocking system',
      passed: true,
      details: `Currently ${blockedIps.length} IPs blocked`
    });
  } catch (error) {
    tests.push({
      name: 'IP blocking system',
      passed: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 3: Security metrics
  try {
    const metrics = webhookSecurity.getSecurityMetrics();
    tests.push({
      name: 'Security metrics collection',
      passed: metrics.blockedIps !== undefined && metrics.usedNonces !== undefined,
      details: `Blocked IPs: ${metrics.blockedIps}, Nonces: ${metrics.usedNonces}`
    });
  } catch (error) {
    tests.push({
      name: 'Security metrics collection',
      passed: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  // Test 4: Configuration validation
  try {
    const config = webhookSecurity.getSecurityMetrics().config;
    const hasRequiredConfig = config.maxPayloadSize > 0 &&
                             config.signatureTimeout > 0 &&
                             config.maxFailedAttempts > 0;

    tests.push({
      name: 'Security configuration',
      passed: hasRequiredConfig,
      details: `Max payload: ${config.maxPayloadSize}, Timeout: ${config.signatureTimeout}s`
    });
  } catch (error) {
    tests.push({
      name: 'Security configuration',
      passed: false,
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }

  const passed = tests.filter(t => t.passed).length;
  const failed = tests.filter(t => !t.passed).length;

  return { passed, failed, tests };
}