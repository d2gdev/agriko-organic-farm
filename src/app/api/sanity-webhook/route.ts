import { NextRequest, NextResponse } from 'next/server'
import { revalidateTag, revalidatePath } from 'next/cache'
import { sanityClient, SanityWebhookBody, BlogPostForSync } from '@/lib/sanity'
import { logger } from '@/lib/logger'
import { withRetry } from '@/lib/retry-handler'

// Webhook secret for security
const WEBHOOK_SECRET = process.env.SANITY_WEBHOOK_SECRET

if (!WEBHOOK_SECRET) {
  throw new Error('Missing SANITY_WEBHOOK_SECRET environment variable')
}

export async function POST(request: NextRequest) {
  try {
    // Verify webhook secret
    const signature = request.headers.get('sanity-webhook-signature')
    if (!signature || signature !== WEBHOOK_SECRET) {
      logger.warn('Sanity webhook: Invalid or missing signature')
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body: SanityWebhookBody = await request.json()
    logger.info('Sanity webhook received:', { type: body._type, id: body._id })

    // Handle cache revalidation for all content types
    await handleCacheRevalidation(body)

    // Handle specific content type processing
    switch (body._type) {
      case 'blogPost':
        if (request.headers.get('sanity-webhook-event') === 'delete') {
          await handleBlogPostDeletion(body._id)
        } else {
          await handleBlogPostSync(body._id)
        }
        break

      case 'page':
      case 'testimonial':
      case 'siteSettings':
      case 'author':
      case 'category':
        // These content types only need cache revalidation (handled above)
        logger.info(`Processed ${body._type} content type via cache revalidation`)
        break

      default:
        logger.info(`Unhandled content type: ${body._type}`)
    }

    return NextResponse.json({ success: true })
  } catch (error) {
    logger.error('Sanity webhook error:', error as Record<string, unknown>)
    return NextResponse.json(
      { error: 'Webhook processing failed' },
      { status: 500 }
    )
  }
}

async function handleCacheRevalidation(body: SanityWebhookBody) {
  // Revalidate based on content type
  switch (body._type) {
    case 'blogPost':
      // Revalidate blog listing pages
      revalidateTag('blog-posts')
      revalidatePath('/blog')

      // Revalidate specific blog post if it has a slug
      if (body.slug?.current) {
        revalidatePath(`/blog/${body.slug.current}`)
      }
      break

    case 'page':
      // Revalidate specific page
      if (body.slug?.current) {
        revalidatePath(`/${body.slug.current}`)
      }
      // Also revalidate common pages
      revalidateTag('pages')
      break

    case 'testimonial':
      // Revalidate pages that show testimonials
      revalidateTag('testimonials')
      revalidatePath('/')  // Homepage likely shows testimonials
      break

    case 'siteSettings':
      // Revalidate entire site when settings change
      revalidateTag('site-settings')
      revalidatePath('/', 'layout')  // Revalidate layout
      break

    case 'author':
      // Revalidate author pages and blog posts
      revalidateTag('authors')
      revalidateTag('blog-posts')
      break

    case 'category':
      // Revalidate category pages and blog posts
      revalidateTag('categories')
      revalidateTag('blog-posts')
      break
  }

  // Always revalidate homepage to ensure fresh content
  revalidatePath('/')

  logger.info('Cache revalidation completed', {
    type: body._type,
    id: body._id,
  })
}

async function handleBlogPostSync(postId: string) {
  try {
    // Fetch the specific blog post from Sanity by ID
    const blogPost = await sanityClient.fetch(
      `*[_type == "blogPost" && _id == $postId][0] {
        _id,
        title,
        slug,
        excerpt,
        publishedAt,
        mainImage,
        body,
        author->{
          name,
          slug,
          image,
          bio
        },
        categories[]->{
          title,
          slug,
          color
        },
        aiGenerated,
        aiModel,
        syncedToSemanticDb
      }`,
      { postId }
    )

    if (!blogPost) {
      logger.warn(`Blog post not found in Sanity: ${postId}`)
      return
    }

    // Skip if not published
    if (!blogPost.publishedAt) {
      logger.info(`Blog post not published yet: ${postId}`)
      return
    }

    logger.info(`Syncing blog post to semantic database: ${blogPost.title}`)

    // Convert Sanity content to format for semantic database
    const blogPostForSync: BlogPostForSync = {
      _id: blogPost._id,
      title: blogPost.title,
      slug: blogPost.slug?.current || '',
      excerpt: blogPost.excerpt || '',
      body: blogPost.body || [],
      publishedAt: blogPost.publishedAt,
      categories: blogPost.categories?.map((cat: any) => cat.title) || [],
      relatedProducts: [], // Will be populated later via AI analysis
    }

    // Sync to your semantic database
    await withRetry(
      () => syncBlogPostToSemanticDb(blogPostForSync),
      {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
      },
      `sanity-sync-${postId}`
    )

    logger.info(`Successfully synced blog post: ${blogPost.title}`)
  } catch (error) {
    logger.error(`Failed to sync blog post ${postId}:`, error as Record<string, unknown>)
    throw error
  }
}

async function handleBlogPostDeletion(postId: string) {
  try {
    logger.info(`Deleting blog post from semantic database: ${postId}`)

    // Remove from your semantic database
    await withRetry(
      () => deleteBlogPostFromSemanticDb(postId),
      {
        maxAttempts: 2,
        baseDelayMs: 500,
        maxDelayMs: 2000,
        backoffMultiplier: 2,
      },
      `sanity-delete-${postId}`
    )

    logger.info(`Successfully deleted blog post: ${postId}`)
  } catch (error) {
    logger.error(`Failed to delete blog post ${postId}:`, error as Record<string, unknown>)
    throw error
  }
}

// This function interfaces with your existing semantic database
async function syncBlogPostToSemanticDb(blogPost: BlogPostForSync) {
  // Import your blog database operations
  const { BlogPostDatabase } = await import('@/lib/blog-database')

  // Extract text content from Sanity's rich text format
  const textContent = extractTextFromBlocks(blogPost.body)

  // Prepare blog post data for your semantic database
  const blogPostData = {
    sanity_id: blogPost._id,
    title: blogPost.title,
    slug: blogPost.slug,
    content: textContent,
    excerpt: blogPost.excerpt,
    published_at: new Date(blogPost.publishedAt),
    categories: blogPost.categories,
    related_products: blogPost.relatedProducts.map(rp => ({
      product_id: rp.productId,
      relevance_score: rp.relevanceScore
    })),
    ai_generated: false, // Will be set based on Sanity data
    created_at: new Date(),
    updated_at: new Date(),
  }

  logger.info('Syncing blog post to semantic database:', {
    id: blogPostData.sanity_id,
    title: blogPostData.title,
    contentLength: textContent.length,
    categories: blogPostData.categories.length,
    relatedProducts: blogPostData.related_products.length,
  })

  // Upsert blog post (this will handle embeddings and Memgraph relationships)
  await BlogPostDatabase.upsertBlogPost(blogPostData)

  logger.info('Blog post successfully synced to semantic database')
}

async function deleteBlogPostFromSemanticDb(postId: string) {
  // Import your blog database operations
  const { BlogPostDatabase } = await import('@/lib/blog-database')

  logger.info(`Deleting blog post from semantic database: ${postId}`)

  // Delete from your database, Qdrant, and Memgraph
  await BlogPostDatabase.deleteBlogPost(postId)

  logger.info(`Blog post successfully deleted from semantic database: ${postId}`)
}

// Helper function to extract plain text from Sanity's rich text blocks
function extractTextFromBlocks(blocks: any[]): string {
  if (!blocks) return ''

  return blocks
    .filter(block => block._type === 'block')
    .map(block => {
      return block.children
        ?.map((child: any) => child.text)
        .join('') || ''
    })
    .join('\n\n')
}