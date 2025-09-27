// A/B Testing API endpoints for test management and analytics
import { NextRequest, NextResponse } from 'next/server';
import { abTesting, commonTests, ABTest } from '@/lib/ab-testing';
import { logger } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const testId = searchParams.get('testId');
    const userId = searchParams.get('userId');
    const sessionId = searchParams.get('sessionId');

    logger.info(`🧪 A/B Testing API GET: action=${action}`);

    switch (action) {
      case 'get_active_tests': {
        const activeTests = abTesting.getActiveTests();
        return NextResponse.json({
          success: true,
          action,
          tests: activeTests,
          count: activeTests.length
        });
      }

      case 'get_user_experiments': {
        if (!userId) {
          return NextResponse.json(
            { error: 'userId parameter is required' },
            { status: 400 }
          );
        }
        const userExperiments = abTesting.getUserExperiments(userId);
        return NextResponse.json({
          success: true,
          action,
          userId,
          experiments: userExperiments,
          count: userExperiments.length
        });
      }

      case 'get_test_report': {
        if (!testId) {
          return NextResponse.json(
            { error: 'testId parameter is required' },
            { status: 400 }
          );
        }
        const testReport = abTesting.getTestReport(testId);
        if (!testReport) {
          return NextResponse.json(
            { error: 'Test not found' },
            { status: 404 }
          );
        }
        return NextResponse.json({
          success: true,
          action,
          testId,
          report: testReport
        });
      }

      case 'assign_user_to_test': {
        if (!userId || !sessionId || !testId) {
          return NextResponse.json(
            { error: 'userId, sessionId, and testId parameters are required' },
            { status: 400 }
          );
        }
        const variantId = abTesting.assignUserToTest(userId, sessionId, testId);
        return NextResponse.json({
          success: true,
          action,
          userId,
          testId,
          variantId,
          assigned: variantId !== null
        });
      }

      case 'get_variant': {
        if (!userId || !testId) {
          return NextResponse.json(
            { error: 'userId and testId parameters are required' },
            { status: 400 }
          );
        }
        const userVariant = abTesting.getUserVariant(userId, testId);
        return NextResponse.json({
          success: true,
          action,
          userId,
          testId,
          variantId: userVariant
        });
      }

      case 'get_common_tests': {
        return NextResponse.json({
          success: true,
          action,
          tests: commonTests
        });
      }

      case 'calculate_significance': {
        if (!testId) {
          return NextResponse.json(
            { error: 'testId parameter is required' },
            { status: 400 }
          );
        }
        const metric = searchParams.get('metric') ?? 'conversion_rate';
        const significance = abTesting.calculateStatisticalSignificance(testId, metric);
        return NextResponse.json({
          success: true,
          action,
          testId,
          metric,
          significance: Object.fromEntries(significance)
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: get_active_tests, get_user_experiments, get_test_report, assign_user_to_test, get_variant, get_common_tests, calculate_significance' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('❌ A/B Testing GET error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'A/B Testing query failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action') ?? 'unknown';
    const body = await request.json() as Record<string, unknown>;

    logger.info(`🧪 A/B Testing API POST: action=${action}`);

    switch (action) {
      case 'create_test': {
        const { test } = body as { test?: ABTest };
        if (!test?.id || !test.name || !test.variants) {
          return NextResponse.json(
            { error: 'Valid test object with id, name, and variants is required' },
            { status: 400 }
          );
        }
        const createSuccess = await abTesting.createTest(test);
        return NextResponse.json({
          success: createSuccess,
          action,
          testId: test.id,
          message: createSuccess ? 'Test created successfully' : 'Failed to create test'
        });
      }

      case 'start_test': {
        const { testId: startTestId } = body as { testId?: string };
        if (!startTestId) {
          return NextResponse.json(
            { error: 'testId is required' },
            { status: 400 }
          );
        }
        const startSuccess = await abTesting.startTest(startTestId);
        return NextResponse.json({
          success: startSuccess,
          action,
          testId: startTestId,
          message: startSuccess ? 'Test started successfully' : 'Failed to start test'
        });
      }

      case 'stop_test': {
        const { testId: stopTestId } = body as { testId?: string };
        if (!stopTestId) {
          return NextResponse.json(
            { error: 'testId is required' },
            { status: 400 }
          );
        }
        const stopSuccess = await abTesting.stopTest(stopTestId);
        return NextResponse.json({
          success: stopSuccess,
          action,
          testId: stopTestId,
          message: stopSuccess ? 'Test stopped successfully' : 'Failed to stop test'
        });
      }

      case 'track_conversion': {
        const { userId, testId, metric, value } = body as { userId?: string; testId?: string; metric?: string; value?: number };
        if (!userId || !testId || !metric) {
          return NextResponse.json(
            { error: 'userId, testId, and metric are required' },
            { status: 400 }
          );
        }
        await abTesting.trackConversion(userId, testId, metric, value ?? 1);
        return NextResponse.json({
          success: true,
          action,
          userId,
          testId,
          metric,
          value: value ?? 1,
          message: 'Conversion tracked successfully'
        });
      }

      case 'track_event': {
        const {
          eventType,
          userId: eventUserId,
          sessionId,
          testId: eventTestId,
          variantId,
          data
        } = body as { eventType?: string; userId?: string; sessionId?: string; testId?: string; variantId?: string; data?: Record<string, unknown> };
        if (!eventType || !eventUserId || !sessionId || !eventTestId || !variantId) {
          return NextResponse.json(
            { error: 'eventType, userId, sessionId, testId, and variantId are required' },
            { status: 400 }
          );
        }
        abTesting.trackEvent(eventType, eventUserId, sessionId, eventTestId, variantId, data ?? {});
        return NextResponse.json({
          success: true,
          action,
          eventType,
          testId: eventTestId,
          variantId,
          message: 'Event tracked successfully'
        });
      }

      case 'create_common_test': {
        const { testType } = body as { testType?: string };
        if (!testType || !commonTests[testType as keyof typeof commonTests]) {
          return NextResponse.json(
            { error: 'Valid testType is required (recommendationAlgorithm, productCardLayout, searchInterface)' },
            { status: 400 }
          );
        }
        const commonTest = commonTests[testType as keyof typeof commonTests];
        const commonTestSuccess = await abTesting.createTest(commonTest as ABTest);
        return NextResponse.json({
          success: commonTestSuccess,
          action,
          testType,
          testId: commonTest.id,
          message: commonTestSuccess ? 'Common test created successfully' : 'Failed to create common test'
        });
      }

      case 'batch_track_conversions': {
        const { conversions } = body as { conversions?: Array<{ userId: string; testId: string; metric: string; value?: number }> };
        if (!conversions || !Array.isArray(conversions)) {
          return NextResponse.json(
            { error: 'conversions array is required' },
            { status: 400 }
          );
        }

        let successCount = 0;
        for (const conversion of conversions) {
          try {
            await abTesting.trackConversion(
              conversion.userId, 
              conversion.testId, 
              conversion.metric, 
              conversion.value ?? 1
            );
            successCount++;
          } catch (error) {
            logger.error('Failed to track conversion:', error as Record<string, unknown>);
          }
        }

        return NextResponse.json({
          success: successCount > 0,
          action,
          totalConversions: conversions.length,
          successfulConversions: successCount,
          failedConversions: conversions.length - successCount,
          message: `Tracked ${successCount}/${conversions.length} conversions successfully`
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: create_test, start_test, stop_test, track_conversion, track_event, create_common_test, batch_track_conversions' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('❌ A/B Testing POST error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'A/B Testing operation failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}

export async function DELETE(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const action = searchParams.get('action');
    const testId = searchParams.get('testId');

    if (!action || !testId) {
      return NextResponse.json(
        { error: 'action and testId parameters are required' },
        { status: 400 }
      );
    }

    logger.info(`🗑️ A/B Testing DELETE: ${action}:${testId}`);

    switch (action) {
      case 'archive_test': {
        // For now, we'll implement basic test archiving
        // In production, you might want more sophisticated archiving
        const activeTests = abTesting.getActiveTests();
        const test = activeTests.find(t => t.id === testId);

        if (!test) {
          return NextResponse.json(
            { error: 'Test not found' },
            { status: 404 }
          );
        }

        test.status = 'archived';

        return NextResponse.json({
          success: true,
          action,
          testId,
          message: 'Test archived successfully'
        });
      }

      default:
        return NextResponse.json(
          { error: 'Invalid action. Supported: archive_test' },
          { status: 400 }
        );
    }

  } catch (error) {
    logger.error('❌ A/B Testing DELETE error:', error as Record<string, unknown>);
    return NextResponse.json(
      { 
        error: 'A/B Testing deletion failed', 
        details: error instanceof Error ? error.message : 'Unknown error' 
      },
      { status: 500 }
    );
  }
}
