import { NextRequest, NextResponse } from 'next/server';
import { monitoring } from '@/lib/monitoring-service';
import { validateAdminAuth } from '@/lib/unified-auth';
import { createErrorResponse, createSuccessResponse } from '@/lib/api-helpers';
import { logger } from '@/lib/logger';

// GET /api/monitoring - Get system health and metrics
export async function GET(request: NextRequest) {
  try {
    // Authenticate admin access
    const authResult = await validateAdminAuth(request);
    if (!authResult.success) {
      return createErrorResponse(
        'Unauthorized access to monitoring endpoint',
        { reason: authResult.error },
        401
      );
    }

    const url = new URL(request.url);
    const action = url.searchParams.get('action') || 'health';

    switch (action) {
      case 'health':
        const healthStatus = await monitoring.getHealthStatus();
        return createSuccessResponse(healthStatus, 'Health status retrieved');

      case 'metrics':
        const currentMetrics = monitoring.getCurrentMetrics();
        if (!currentMetrics) {
          return createErrorResponse('No metrics available yet', {}, 204);
        }
        return createSuccessResponse(currentMetrics, 'Current metrics retrieved');

      case 'history':
        const hours = parseInt(url.searchParams.get('hours') || '1');
        const metricsHistory = monitoring.getMetricsHistory(hours);
        return createSuccessResponse(
          {
            metrics: metricsHistory,
            period: `${hours} hours`,
            count: metricsHistory.length,
          },
          'Metrics history retrieved'
        );

      case 'alerts':
        const alertType = url.searchParams.get('type') || 'active';
        const alerts = alertType === 'active' 
          ? monitoring.getActiveAlerts()
          : monitoring.getAlertHistory(parseInt(url.searchParams.get('limit') || '100'));
        
        return createSuccessResponse(
          {
            alerts,
            type: alertType,
            count: alerts.length,
          },
          'Alerts retrieved'
        );

      case 'dashboard':
        // Comprehensive dashboard data
        const dashboardData = {
          health: await monitoring.getHealthStatus(),
          currentMetrics: monitoring.getCurrentMetrics(),
          recentMetrics: monitoring.getMetricsHistory(0.25), // Last 15 minutes
          activeAlerts: monitoring.getActiveAlerts(),
          recentAlerts: monitoring.getAlertHistory(10),
        };
        return createSuccessResponse(dashboardData, 'Dashboard data retrieved');

      default:
        return createErrorResponse(
          'Invalid action parameter',
          { 
            validActions: ['health', 'metrics', 'history', 'alerts', 'dashboard'],
            provided: action 
          },
          400
        );
    }
  } catch (error) {
    logger.error('Monitoring API error:', error as Record<string, unknown>);
    return createErrorResponse(
      'Failed to retrieve monitoring data',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

// POST /api/monitoring - Resolve alerts or trigger actions
export async function POST(request: NextRequest) {
  try {
    // Authenticate admin access
    const authResult = await validateAdminAuth(request);
    if (!authResult.success) {
      return createErrorResponse(
        'Unauthorized access to monitoring endpoint',
        { reason: authResult.error },
        401
      );
    }

    const body = await request.json();
    const { action, alertId } = body;

    switch (action) {
      case 'resolve_alert':
        if (!alertId) {
          return createErrorResponse('Alert ID is required for resolve action', {}, 400);
        }
        
        monitoring.resolveAlert(alertId);
        logger.info('Alert resolved manually', { alertId, userId: authResult.userId });
        
        return createSuccessResponse(
          { alertId, resolved: true },
          'Alert resolved successfully'
        );

      case 'force_metrics_collection':
        // This would trigger an immediate metrics collection
        const currentMetrics = monitoring.getCurrentMetrics();
        return createSuccessResponse(
          currentMetrics,
          'Metrics collection triggered'
        );

      default:
        return createErrorResponse(
          'Invalid action',
          { 
            validActions: ['resolve_alert', 'force_metrics_collection'],
            provided: action 
          },
          400
        );
    }
  } catch (error) {
    logger.error('Monitoring API POST error:', error as Record<string, unknown>);
    return createErrorResponse(
      'Failed to process monitoring action',
      { error: error instanceof Error ? error.message : 'Unknown error' }
    );
  }
}

// Health check endpoint (no auth required for basic health)
export async function HEAD(_request: NextRequest) {
  try {
    const healthStatus = await monitoring.getHealthStatus();
    
    const headers = new Headers();
    headers.set('X-Health-Status', healthStatus.status);
    headers.set('X-Uptime', healthStatus.uptime.toString());
    headers.set('X-Version', healthStatus.version);
    
    const statusCode = healthStatus.status === 'healthy' ? 200 : 
                      healthStatus.status === 'degraded' ? 200 : 503;
    
    return new NextResponse(null, { status: statusCode, headers });
  } catch (error) {
    logger.error('Health check error:', error as Record<string, unknown>);
    return new NextResponse(null, { status: 503 });
  }
}