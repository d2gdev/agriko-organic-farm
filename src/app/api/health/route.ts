import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '@/lib/monitoring-service';
import { createErrorResponse, createSuccessResponse, sanitizeStringParam } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';
import { getRemoteLoggingStatus } from '@/lib/remote-logging';
import { getGlobalCacheStatus } from '@/lib/global-cache-coordinator';

// GET /api/health - Public health check endpoint
export async function GET(request: NextRequest) {
  try {
    const url = new URL(request.url);
    const checkParam = url.searchParams.get('check');
    
    // Validate check parameter
    const validChecks = ['basic', 'ready', 'detailed'];
    const checkSanitized = sanitizeStringParam(checkParam || 'basic', 'check', { maxLength: 20 });
    if (!checkSanitized.success) {
      return createErrorResponse(checkSanitized.error, {}, 400);
    }
    const check = validChecks.includes(checkSanitized.value) ? checkSanitized.value : 'basic';

    switch (check) {
      case 'basic':
        // Simple liveness check
        return createSuccessResponse(
          {
            status: 'ok',
            timestamp: new Date().toISOString(),
            uptime: process.uptime(),
            version: process.env.npm_package_version || '1.0.0',
          },
          'Service is running'
        );

      case 'ready':
        // Readiness check - includes service dependencies
        const healthStatus = await monitoring.getHealthStatus();
        const isReady = healthStatus.status === 'healthy' || healthStatus.status === 'degraded';
        
        const statusCode = isReady ? 200 : 503;
        const response = {
          status: isReady ? 'ready' : 'not_ready',
          health: healthStatus.status,
          services: healthStatus.services,
          timestamp: new Date().toISOString(),
        };

        return NextResponse.json(response, { status: statusCode });

      case 'detailed':
        // Detailed health information (limited data for public)
        const detailedStatus = await monitoring.getHealthStatus();
        const currentMetrics = monitoring.getCurrentMetrics();
        const activeAlerts = monitoring.getActiveAlerts();
        
        // Get remote logging status
        const loggingStatus = getRemoteLoggingStatus();
        
        // Get global cache status
        const cacheStatus = getGlobalCacheStatus();
        
        const detailedResponse = {
          status: detailedStatus.status,
          timestamp: new Date().toISOString(),
          uptime: detailedStatus.uptime,
          version: detailedStatus.version,
          services: Object.fromEntries(
            Object.entries(detailedStatus.services).map(([key, service]) => [
              key,
              { status: service.status }
            ])
          ),
          logging: {
            remote_enabled: loggingStatus.enabled,
            buffered_logs: loggingStatus.bufferedLogs,
            buffer_utilization: Math.round((loggingStatus.bufferedLogs / loggingStatus.bufferLimit) * 100),
            endpoints: loggingStatus.endpoints.length,
            levels: loggingStatus.enabledLevels
          },
          cache: {
            total_memory_mb: cacheStatus.totalMemoryMB,
            max_memory_mb: cacheStatus.maxMemoryMB,
            memory_utilization: cacheStatus.utilizationPercent,
            cache_instances: cacheStatus.cacheCount,
            emergency_mode: cacheStatus.emergencyMode,
            total_evictions: cacheStatus.totalEvictions
          },
          metrics: currentMetrics ? {
            memory_utilization: Math.round(currentMetrics.memory.utilization),
            response_time_p95: currentMetrics.response.p95,
            error_rate: Math.round(currentMetrics.errors.rate * 100),
            request_rate: Math.round(currentMetrics.requests.rate),
          } : null,
          alerts: {
            active_count: activeAlerts.length,
            critical_count: activeAlerts.filter(a => a.severity === 'critical').length,
          },
        };

        const detailedStatusCode = detailedStatus.status === 'healthy' ? 200 : 
                                 detailedStatus.status === 'degraded' ? 200 : 503;

        return NextResponse.json(detailedResponse, { status: detailedStatusCode });

      default:
        return createErrorResponse(
          'Invalid check parameter',
          { 
            validChecks: ['basic', 'ready', 'detailed'],
            provided: check 
          },
          400
        );
    }
  } catch (error) {
    logger.error('Health check error:', error as Record<string, unknown>);
    return createErrorResponse(
      'Health check failed',
      { error: error instanceof Error ? error.message : 'Unknown error' },
      503
    );
  }
}

// HEAD /api/health - Lightweight health check for load balancers
export async function HEAD(request: NextRequest) {
  try {
    const healthStatus = await monitoring.getHealthStatus();
    
    const headers = new Headers();
    headers.set('X-Health-Status', healthStatus.status);
    headers.set('X-Uptime-Seconds', Math.floor(healthStatus.uptime / 1000).toString());
    headers.set('X-Version', healthStatus.version);
    
    // Add service status headers
    Object.entries(healthStatus.services).forEach(([service, status]) => {
      headers.set(`X-Service-${service.charAt(0).toUpperCase() + service.slice(1)}`, status.status);
    });
    
    // Set appropriate status code
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    return new NextResponse(null, { status: statusCode, headers });
  } catch (error) {
    logger.error('Health check HEAD error:', error as Record<string, unknown>);
    return new NextResponse(null, { 
      status: 503,
      headers: { 'X-Health-Status': 'error' }
    });
  }
}