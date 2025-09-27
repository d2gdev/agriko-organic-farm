import { NextRequest, NextResponse } from 'next/server'
import { BlogRecommendationEngine, BlogRecommendationRequest, BlogRecommendationResponse } from '@/lib/blog-recommendations'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const body: BlogRecommendationRequest = await request.json()
    const { userId, productId, browsingHistory, limit = 5, type } = body

    if (!type || (type !== 'user' && type !== 'product')) {
      return NextResponse.json(
        { error: 'Invalid type. Must be "user" or "product"' },
        { status: 400 }
      )
    }

    if (type === 'product' && !productId) {
      return NextResponse.json(
        { error: 'productId is required for product recommendations' },
        { status: 400 }
      )
    }

    logger.info('Blog recommendation request:', { type, userId, productId, limit })

    let recommendations
    if (type === 'user') {
      recommendations = await BlogRecommendationEngine.getRecommendationsForUser(
        userId,
        browsingHistory,
        limit
      )
    } else {
      recommendations = await BlogRecommendationEngine.getBlogPostsForProduct(
        productId!,
        limit
      )
    }

    const response: BlogRecommendationResponse = {
      recommendations,
      total: recommendations.length,
      requestId: `blog-rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Blog recommendation API error:', error as Record<string, unknown>)
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}

export async function GET(request: NextRequest) {
  // Simple GET endpoint for basic recommendations
  try {
    const { searchParams } = new URL(request.url)
    const type = searchParams.get('type') as 'user' | 'product'
    const productId = searchParams.get('productId')
    const userId = searchParams.get('userId')
    const limit = parseInt(searchParams.get('limit') || '5')

    if (!type || (type !== 'user' && type !== 'product')) {
      return NextResponse.json(
        { error: 'Invalid type parameter' },
        { status: 400 }
      )
    }

    let recommendations
    if (type === 'product' && productId) {
      recommendations = await BlogRecommendationEngine.getBlogPostsForProduct(productId, limit)
    } else {
      recommendations = await BlogRecommendationEngine.getRecommendationsForUser(userId || undefined, [], limit)
    }

    const response: BlogRecommendationResponse = {
      recommendations,
      total: recommendations.length,
      requestId: `blog-rec-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    }

    return NextResponse.json(response)

  } catch (error) {
    logger.error('Blog recommendation GET API error:', error as Record<string, unknown>)
    return NextResponse.json(
      { error: 'Failed to get recommendations' },
      { status: 500 }
    )
  }
}