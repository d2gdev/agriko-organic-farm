import { NextRequest, NextResponse } from 'next/server';
import { logger } from '@/lib/logger';
import { abTesting, commonTests } from '@/lib/ab-testing';
import { abTestingAnalytics } from '@/lib/ab-testing-analytics';
import { sanitizeStringParam, createErrorResponse, parseBooleanParam } from '@/lib/api-helpers';
import { checkEndpointRateLimit, createRateLimitResponse } from '@/lib/rate-limit';

// A/B Testing Results API - Real conversion tracking and statistical analysis
export async function GET(request: NextRequest) {
  // Rate limiting for analytics endpoints
  const rl = checkEndpointRateLimit(request, 'analytics');
  if (!rl.success) {
    return createRateLimitResponse(rl);
  }

  const { searchParams } = new URL(request.url);
  
  // Validate and sanitize input parameters
  const testIdParam = searchParams.get('testId');
  const mockParam = searchParams.get('mock');
  
  // Sanitize testId if provided
  let testId: string | null = null;
  if (testIdParam) {
    const sanitized = sanitizeStringParam(testIdParam, 'testId', { maxLength: 50 });
    if (!sanitized.success) {
      return createErrorResponse(sanitized.error, {}, 400);
    }
    testId = sanitized.value;
  }
  
  // Validate mock parameter
  const useMock = parseBooleanParam(mockParam, 'mock');
  
  try {

    if (testId) {
      // Get specific test results
      const testResults = useMock 
        ? generateTestResults(testId)
        : abTestingAnalytics.getTestResults(testId);
      
      return NextResponse.json({
        success: true,
        testId,
        data: testResults,
        source: useMock ? 'mock_data' : 'real_analytics',
        timestamp: new Date().toISOString()
      });
    } else {
      // Get all active test results
      if (useMock) {
        const activeTests = abTesting.getActiveTests();
        const allResults = activeTests.map(test => ({
          testId: test.id,
          testName: test.name,
          status: test.status,
          results: generateTestResults(test.id)
        }));

        return NextResponse.json({
          success: true,
          data: allResults,
          source: 'mock_data',
          timestamp: new Date().toISOString()
        });
      } else {
        // Get real A/B testing results
        const allResults = abTestingAnalytics.getAllTestResults();
        
        return NextResponse.json({
          success: true,
          data: allResults,
          source: 'ab_testing_analytics',
          timestamp: new Date().toISOString()
        });
      }
    }

  } catch (error) {
    logger.error('A/B Testing Results API Error:', error as Record<string, unknown>);
    
    // Fallback to mock data when real analytics fails
    try {
      const activeTests = abTesting.getActiveTests();
      const fallbackResults = testId 
        ? generateTestResults(testId)
        : activeTests.map(test => ({
            testId: test.id,
            testName: test.name,
            status: test.status,
            results: generateTestResults(test.id)
          }));

      return NextResponse.json({
        success: true,
        data: fallbackResults,
        source: 'fallback_mock',
        warning: 'A/B Testing analytics unavailable, showing fallback data',
        timestamp: new Date().toISOString()
      });
    } catch (fallbackError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Failed to fetch A/B test results',
          message: error instanceof Error ? error.message : 'Unknown error'
        },
        { status: 500 }
      );
    }
  }
}

function generateTestResults(testId: string) {
  const activeTests = abTesting.getActiveTests();
  const test = activeTests.find(t => t.id === testId);
  if (!test) {
    return null;
  }

  // Mock results - in production, this would query actual analytics data
  const totalParticipants = Math.floor(Math.random() * 1000) + 500;
  
  const variantResults = test.variants.map(variant => {
    const participants = Math.floor(totalParticipants * (variant.trafficWeight / 100));
    const conversions = Math.floor(participants * (0.02 + Math.random() * 0.08)); // 2-10% conversion rate
    const conversionRate = ((conversions / participants) * 100).toFixed(2);
    const revenue = Math.floor(conversions * (25 + Math.random() * 50)); // $25-75 per conversion

    return {
      variantId: variant.id,
      variantName: variant.name,
      participants,
      conversions,
      conversionRate: parseFloat(conversionRate),
      revenue,
      revenuePerVisitor: (revenue / participants).toFixed(2),
      confidence: Math.floor(Math.random() * 30) + 70, // 70-100% confidence
      isWinning: false // Will be determined after all variants are generated
    };
  });

  // Determine winning variant (highest conversion rate)
  const winningVariant = variantResults.reduce((winner, current) => 
    current.conversionRate > winner.conversionRate ? current : winner
  );
  winningVariant.isWinning = true;

  return {
    testId: test.id,
    testName: test.name,
    description: test.description,
    status: test.status,
    startDate: test.startDate,
    targetMetrics: test.targetMetrics,
    totalParticipants,
    variants: variantResults,
    statisticalSignificance: winningVariant.confidence,
    recommendedAction: winningVariant.confidence > 95 
      ? `Deploy ${winningVariant.variantName} - statistically significant improvement`
      : 'Continue test - not yet statistically significant',
    estimatedLift: {
      conversionRate: ((winningVariant.conversionRate / (variantResults.find(v => v.variantId === 'control')?.conversionRate ?? 1) - 1) * 100).toFixed(1),
      revenue: ((parseFloat(winningVariant.revenuePerVisitor) / parseFloat(variantResults.find(v => v.variantId === 'control')?.revenuePerVisitor ?? '1') - 1) * 100).toFixed(1)
    }
  };
}