import { NextRequest, NextResponse } from 'next/server'
import { BlogPostDatabase } from '@/lib/blog-database'
import { logger } from '@/lib/logger'

export async function POST(request: NextRequest) {
  try {
    const { action, data } = await request.json()

    logger.info('Blog test endpoint called:', { action })

    switch (action) {
      case 'test_blog_post_creation':
        return await testBlogPostCreation(data)

      case 'test_semantic_search':
        return await testSemanticSearch(data)

      case 'test_product_relations':
        return await testProductRelations(data)

      case 'test_embeddings':
        return await testEmbeddings(data)

      default:
        return NextResponse.json(
          { error: 'Invalid action. Available: test_blog_post_creation, test_semantic_search, test_product_relations, test_embeddings' },
          { status: 400 }
        )
    }
  } catch (error) {
    logger.error('Blog test endpoint error:', error as Record<string, unknown>)
    return NextResponse.json(
      { error: 'Test failed' },
      { status: 500 }
    )
  }
}

async function testBlogPostCreation(data: Record<string, unknown>) {
  try {
    // Create a test blog post
    const testBlogPost = {
      sanity_id: `test_${Date.now()}`,
      title: (data?.title as string) || 'Test Blog Post: Growing Tomatoes Organically',
      slug: (data?.slug as string) || 'test-growing-tomatoes-organically',
      content: (data?.content as string) || `
        Growing tomatoes organically is a rewarding experience that yields delicious, healthy produce.
        Start with good soil preparation using compost and organic matter. Choose disease-resistant varieties
        and provide adequate spacing for air circulation. Regular watering and proper fertilization with
        organic nutrients will ensure a bountiful harvest.
      `,
      excerpt: (data?.excerpt as string) || 'Learn the essential steps for growing delicious organic tomatoes in your garden.',
      published_at: new Date(),
      categories: (data?.categories as string[]) || ['Gardening', 'Organic Farming', 'Vegetables'],
      related_products: (data?.related_products as any[]) || [
        { product_id: '123', relevance_score: 0.9 },
        { product_id: '456', relevance_score: 0.8 }
      ],
      ai_generated: (data?.ai_generated as boolean) || false,
      ai_model: (data?.ai_model as string) || '',
      created_at: new Date(),
      updated_at: new Date(),
    }

    logger.info('Creating test blog post:', { title: testBlogPost.title })

    // Test the complete workflow: database -> embeddings -> Qdrant -> Memgraph
    const result = await BlogPostDatabase.upsertBlogPost(testBlogPost)

    return NextResponse.json({
      success: true,
      message: 'Blog post created successfully',
      blog_post: {
        id: result.id,
        title: result.title,
        qdrant_id: result.qdrant_id,
        memgraph_node_id: result.memgraph_node_id,
        embedding_dimension: result.embedding?.length || 0
      }
    })
  } catch (error) {
    logger.error('Test blog post creation failed:', error as Record<string, unknown>)
    return NextResponse.json(
      { error: 'Failed to create test blog post', details: (error as Error).message },
      { status: 500 }
    )
  }
}

async function testSemanticSearch(data: Record<string, unknown>) {
  try {
    const query = (data?.query as string) || 'organic tomato gardening'
    const limit = (data?.limit as number) || 5

    logger.info('Testing semantic search:', { query, limit })

    const results = await BlogPostDatabase.semanticSearch(query, limit)

    return NextResponse.json({
      success: true,
      message: 'Semantic search completed',
      query,
      results: results.map(post => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        categories: post.categories,
        ai_generated: post.ai_generated,
        qdrant_id: post.qdrant_id
      }))
    })
  } catch (error) {
    logger.error('Test semantic search failed:', error as Record<string, unknown>)
    return NextResponse.json(
      { error: 'Semantic search test failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

async function testProductRelations(data: Record<string, unknown>) {
  try {
    const productId = (data?.product_id as string) || '123'

    logger.info('Testing product relations:', { productId })

    const relatedPosts = await BlogPostDatabase.getRelatedPostsForProduct(productId)

    return NextResponse.json({
      success: true,
      message: 'Product relations test completed',
      product_id: productId,
      related_posts: relatedPosts.map(post => ({
        id: post.id,
        title: post.title,
        excerpt: post.excerpt,
        relevance_score: post.related_products.find(rp => rp.product_id === productId)?.relevance_score || 0
      }))
    })
  } catch (error) {
    logger.error('Test product relations failed:', error as Record<string, unknown>)
    return NextResponse.json(
      { error: 'Product relations test failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

async function testEmbeddings(data: Record<string, unknown>) {
  try {
    const text = (data?.text as string) || 'organic vegetable gardening techniques'

    logger.info('Testing embedding generation:', { text })

    // Import your embedding system
    const { generateBatchEmbeddings, prepareTextForEmbedding } = await import('@/lib/embeddings')

    const preparedText = prepareTextForEmbedding(text, '', [])
    const embeddings = await generateBatchEmbeddings([preparedText])
    const embedding = embeddings[0]

    return NextResponse.json({
      success: true,
      message: 'Embedding generation test completed',
      text,
      prepared_text: preparedText,
      embedding_info: {
        dimension: embedding?.length || 0,
        first_5_values: embedding?.slice(0, 5) || [],
        has_embedding: !!embedding && embedding.length > 0
      }
    })
  } catch (error) {
    logger.error('Test embedding generation failed:', error as Record<string, unknown>)
    return NextResponse.json(
      { error: 'Embedding generation test failed', details: (error as Error).message },
      { status: 500 }
    )
  }
}

export async function GET(_request: NextRequest) {
  return NextResponse.json({
    message: 'Blog test endpoint',
    available_actions: [
      'test_blog_post_creation',
      'test_semantic_search',
      'test_product_relations',
      'test_embeddings'
    ],
    usage: 'POST with { "action": "action_name", "data": { ...optional_data } }'
  })
}