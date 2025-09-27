// Blog post database schema and operations for semantic integration
import { logger } from '@/lib/logger'
import { withRetry } from '@/lib/retry-handler'

// Blog post database schema (to be integrated with your existing database)
export interface BlogPost {
  id: string
  sanity_id: string
  title: string
  slug: string
  content: string
  excerpt?: string
  published_at: Date
  created_at: Date
  updated_at: Date
  categories: string[]
  related_products: Array<{
    product_id: string
    relevance_score: number
  }>
  ai_generated: boolean
  ai_model?: string
  ai_prompt?: string
  // Semantic database fields
  embedding?: number[] // Vector embedding for semantic search
  qdrant_id?: string // ID in Qdrant vector database
  memgraph_node_id?: string // ID in Memgraph relationship database
}

// SQL schema for blog posts table (PostgreSQL/MySQL compatible)
export const BLOG_POSTS_TABLE_SQL = `
CREATE TABLE IF NOT EXISTS blog_posts (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  sanity_id VARCHAR(255) UNIQUE NOT NULL,
  title TEXT NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  content TEXT NOT NULL,
  excerpt TEXT,
  published_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  categories TEXT[] DEFAULT '{}',
  related_products JSONB DEFAULT '[]',
  ai_generated BOOLEAN DEFAULT FALSE,
  ai_model VARCHAR(100),
  ai_prompt TEXT,
  embedding VECTOR(1536), -- Adjust dimension based on your embedding model
  qdrant_id VARCHAR(255),
  memgraph_node_id VARCHAR(255),

  -- Indexes for performance
  INDEX idx_blog_posts_slug (slug),
  INDEX idx_blog_posts_published_at (published_at),
  INDEX idx_blog_posts_sanity_id (sanity_id),
  INDEX idx_blog_posts_categories (categories),
  INDEX idx_blog_posts_ai_generated (ai_generated)
);

-- Table for blog post to product relationships
CREATE TABLE IF NOT EXISTS blog_post_products (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  blog_post_id UUID REFERENCES blog_posts(id) ON DELETE CASCADE,
  product_id VARCHAR(255) NOT NULL,
  relevance_score DECIMAL(3,2) DEFAULT 0.8,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),

  UNIQUE(blog_post_id, product_id),
  INDEX idx_blog_post_products_blog_id (blog_post_id),
  INDEX idx_blog_post_products_product_id (product_id),
  INDEX idx_blog_post_products_relevance (relevance_score)
);

-- Table for blog post categories
CREATE TABLE IF NOT EXISTS blog_categories (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name VARCHAR(255) UNIQUE NOT NULL,
  slug VARCHAR(255) UNIQUE NOT NULL,
  description TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);
`

// Database operations for blog posts
export class BlogPostDatabase {
  // Insert or update blog post from Sanity webhook
  static async upsertBlogPost(blogPostData: Partial<BlogPost>): Promise<BlogPost> {
    return withRetry(
      async () => {
        // TODO: Integrate with your existing database connection
        // This is a placeholder that shows the structure

        const existingPost = await this.findBySanityId(blogPostData.sanity_id!)

        if (existingPost) {
          return await this.updateBlogPost(existingPost.id, blogPostData)
        } else {
          return await this.createBlogPost(blogPostData)
        }
      },
      {
        maxAttempts: 3,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 2,
      },
      `blog-post-upsert-${blogPostData.sanity_id}`
    )
  }

  // Create new blog post
  static async createBlogPost(blogPostData: Partial<BlogPost>): Promise<BlogPost> {
    // TODO: Replace with your actual database implementation
    logger.info('Creating blog post:', {
      title: blogPostData.title,
      sanity_id: blogPostData.sanity_id
    })

    // Placeholder implementation
    const blogPost: BlogPost = {
      id: `blog-${Date.now()}`,
      sanity_id: blogPostData.sanity_id!,
      title: blogPostData.title!,
      slug: blogPostData.slug!,
      content: blogPostData.content!,
      excerpt: blogPostData.excerpt,
      published_at: blogPostData.published_at || new Date(),
      created_at: new Date(),
      updated_at: new Date(),
      categories: blogPostData.categories || [],
      related_products: blogPostData.related_products || [],
      ai_generated: blogPostData.ai_generated || false,
      ai_model: blogPostData.ai_model,
      ai_prompt: blogPostData.ai_prompt,
    }

    // Generate embeddings for semantic search
    await this.generateAndStoreEmbeddings(blogPost)

    // Create relationships in Memgraph
    await this.createMemgraphRelationships(blogPost)

    return blogPost
  }

  // Update existing blog post
  static async updateBlogPost(id: string, updates: Partial<BlogPost>): Promise<BlogPost> {
    // TODO: Replace with your actual database implementation
    logger.info('Updating blog post:', { id, updates: Object.keys(updates) })

    // If content changed, regenerate embeddings
    if (updates.content) {
      // TODO: Regenerate embeddings and update Qdrant
    }

    // Update Memgraph relationships if categories or products changed
    if (updates.categories || updates.related_products) {
      // TODO: Update Memgraph relationships
    }

    // Placeholder return
    return { id, ...updates } as BlogPost
  }

  // Find blog post by Sanity ID
  static async findBySanityId(sanityId: string): Promise<BlogPost | null> {
    // TODO: Replace with your actual database query
    logger.debug('Finding blog post by Sanity ID:', { sanityId })
    return null // Placeholder
  }

  // Delete blog post
  static async deleteBlogPost(sanityId: string): Promise<void> {
    return withRetry(
      async () => {
        const blogPost = await this.findBySanityId(sanityId)
        if (!blogPost) return

        // Remove from Qdrant
        await this.removeFromQdrant(blogPost.qdrant_id!)

        // Remove from Memgraph
        await this.removeFromMemgraph(blogPost.memgraph_node_id!)

        // Remove from main database
        // TODO: Implement actual database deletion
        logger.info('Blog post deleted:', { sanityId, id: blogPost.id })
      },
      {
        maxAttempts: 2,
        baseDelayMs: 500,
        maxDelayMs: 2000,
        backoffMultiplier: 2,
      },
      `blog-post-delete-${sanityId}`
    )
  }

  // Generate and store embeddings using your existing vectorization system
  static async generateAndStoreEmbeddings(blogPost: BlogPost): Promise<void> {
    try {
      // Import your existing embedding and Qdrant systems
      const { generateBatchEmbeddings, prepareTextForEmbedding } = await import('@/lib/embeddings')
      const { safeUpsertVectors } = await import('@/lib/qdrant')

      // 1. Prepare text for embedding (same format as your product embeddings)
      const textForEmbedding = prepareTextForEmbedding(
        blogPost.title,
        blogPost.content,
        blogPost.categories
      )

      // 2. Generate embedding using your existing system
      const embeddings = await generateBatchEmbeddings([textForEmbedding])
      const embedding = embeddings[0]

      if (!embedding || embedding.length === 0) {
        throw new Error('Failed to generate embedding for blog post')
      }

      // 3. Create Qdrant vector with blog-specific metadata
      // Use timestamp as integer ID (Qdrant accepts integers)
      const blogQdrantId = Date.now();
      const qdrantVector = {
        id: String(blogQdrantId), // Convert to string for consistent ID handling
        values: embedding,
        metadata: {
          type: 'blog_post',
          source: 'agriko_blog',
          sanity_id: blogPost.sanity_id,
          title: blogPost.title,
          slug: blogPost.slug,
          excerpt: blogPost.excerpt || '',
          categories: blogPost.categories,
          published_at: blogPost.published_at.toISOString(),
          ai_generated: blogPost.ai_generated,
          ai_model: blogPost.ai_model || '',
          related_products: blogPost.related_products.map(rp => rp.product_id),
          content_length: blogPost.content.length,
          timestamp: new Date().toISOString(),
        }
      }

      // 4. Store in Qdrant using blog-specific collection
      const blogCollectionName = process.env.QDRANT_BLOG_COLLECTION || 'blog_posts';
      const result = await safeUpsertVectors([qdrantVector], blogCollectionName)

      if (!result.success) {
        throw new Error(`Failed to store blog post vector: ${result.error}`)
      }

      // 5. Update blog post with embedding data
      blogPost.qdrant_id = qdrantVector.id
      blogPost.embedding = embedding

      logger.info('Embeddings generated and stored for blog post:', {
        id: blogPost.id,
        title: blogPost.title,
        qdrant_id: blogPost.qdrant_id,
        embedding_dimension: embedding.length,
        categories: blogPost.categories.length,
        related_products: blogPost.related_products.length
      })
    } catch (error) {
      logger.error('Failed to generate embeddings:', error as Record<string, unknown>)
      throw error
    }
  }

  // Create relationships in Memgraph
  static async createMemgraphRelationships(blogPost: BlogPost): Promise<void> {
    try {
      // Import your existing Memgraph system
      const { withSession } = await import('@/lib/memgraph')

      logger.info('Creating Memgraph relationships for blog post:', {
        id: blogPost.id,
        title: blogPost.title,
        categories: blogPost.categories.length,
        relatedProducts: blogPost.related_products.length
      })

      await withSession(async (session) => {
        // 1. Create the blog post node
        const blogNodeQuery = `
          MERGE (b:BlogPost {id: $id})
          SET b.sanity_id = $sanity_id,
              b.title = $title,
              b.slug = $slug,
              b.excerpt = $excerpt,
              b.published_at = datetime($published_at),
              b.created_at = datetime($created_at),
              b.ai_generated = $ai_generated,
              b.ai_model = $ai_model,
              b.content_length = $content_length,
              b.qdrant_id = $qdrant_id
          RETURN b.id as blogId
        `

        const blogResult = await session.run(blogNodeQuery, {
          id: blogPost.id,
          sanity_id: blogPost.sanity_id,
          title: blogPost.title,
          slug: blogPost.slug,
          excerpt: blogPost.excerpt || '',
          published_at: blogPost.published_at.toISOString(),
          created_at: blogPost.created_at.toISOString(),
          ai_generated: blogPost.ai_generated,
          ai_model: blogPost.ai_model || '',
          content_length: blogPost.content.length,
          qdrant_id: blogPost.qdrant_id || ''
        })

        // 2. Create category relationships
        for (const category of blogPost.categories) {
          const categoryQuery = `
            MERGE (c:Category {name: $category})
            WITH c
            MATCH (b:BlogPost {id: $blog_id})
            MERGE (b)-[:BELONGS_TO_CATEGORY]->(c)
          `
          await session.run(categoryQuery, {
            category,
            blog_id: blogPost.id
          })
        }

        // 3. Create product relationships
        for (const relatedProduct of blogPost.related_products) {
          const productRelationQuery = `
            MATCH (p:Product {id: $product_id})
            MATCH (b:BlogPost {id: $blog_id})
            MERGE (b)-[r:MENTIONS_PRODUCT]->(p)
            SET r.relevance_score = $relevance_score,
                r.created_at = datetime()
          `
          await session.run(productRelationQuery, {
            product_id: parseInt(relatedProduct.product_id),
            blog_id: blogPost.id,
            relevance_score: relatedProduct.relevance_score
          })
        }

        // 4. Create semantic similarity relationships (based on categories and content)
        // Find other blog posts with similar categories
        const similarPostsQuery = `
          MATCH (b1:BlogPost {id: $blog_id})-[:BELONGS_TO_CATEGORY]->(c:Category)<-[:BELONGS_TO_CATEGORY]-(b2:BlogPost)
          WHERE b1 <> b2
          WITH b1, b2, count(c) as shared_categories
          WHERE shared_categories >= 1
          MERGE (b1)-[r:SIMILAR_TO]->(b2)
          SET r.similarity_score = toFloat(shared_categories) / 10.0,
              r.basis = 'category_overlap',
              r.created_at = datetime()
        `
        await session.run(similarPostsQuery, { blog_id: blogPost.id })

        // 5. Create blog-to-product discovery relationships for recommendation engine
        // This helps the recommendation system suggest blog posts when viewing products
        const productDiscoveryQuery = `
          MATCH (b:BlogPost {id: $blog_id})-[:MENTIONS_PRODUCT]->(p:Product)
          WITH b, p
          MATCH (p)-[:SIMILAR_TO|COMPLEMENTARY_WITH]-(related_p:Product)
          WHERE NOT EXISTS((b)-[:MENTIONS_PRODUCT]->(related_p))
          WITH b, related_p, count(*) as connection_strength
          WHERE connection_strength >= 1
          MERGE (b)-[r:MIGHT_INTEREST]->(related_p)
          SET r.strength = toFloat(connection_strength) / 10.0,
              r.created_at = datetime()
        `
        await session.run(productDiscoveryQuery, { blog_id: blogPost.id })
      })

      // Store the Memgraph node ID for future reference
      blogPost.memgraph_node_id = blogPost.id

      logger.info('Successfully created Memgraph relationships for blog post:', {
        id: blogPost.id,
        title: blogPost.title,
        memgraph_node_id: blogPost.memgraph_node_id
      })
    } catch (error) {
      logger.error('Failed to create Memgraph relationships:', error as Record<string, unknown>)
      throw error
    }
  }

  // Remove from Qdrant vector database
  static async removeFromQdrant(qdrantId: string): Promise<void> {
    try {
      // Import your existing Qdrant system
      const { deleteVectors } = await import('@/lib/qdrant')

      logger.info('Removing blog post from Qdrant:', { qdrantId })

      // Delete the vector using your existing delete function
      const result = await deleteVectors([parseInt(qdrantId, 10)])

      if (!result.success) {
        throw new Error(`Failed to delete from Qdrant: ${result.error}`)
      }

      logger.info('Successfully removed blog post from Qdrant:', { qdrantId })
    } catch (error) {
      logger.error('Failed to remove from Qdrant:', error as Record<string, unknown>)
      throw error
    }
  }

  // Remove from Memgraph
  static async removeFromMemgraph(nodeId: string): Promise<void> {
    try {
      // Import your existing Memgraph system
      const { withSession } = await import('@/lib/memgraph')

      logger.info('Removing blog post from Memgraph:', { nodeId })

      await withSession(async (session) => {
        // Delete the blog post node and all its relationships
        const deleteQuery = `
          MATCH (b:BlogPost {id: $node_id})
          DETACH DELETE b
        `
        await session.run(deleteQuery, { node_id: nodeId })
      })

      logger.info('Successfully removed blog post from Memgraph:', { nodeId })
    } catch (error) {
      logger.error('Failed to remove from Memgraph:', error as Record<string, unknown>)
      throw error
    }
  }

  // Search blog posts semantically
  static async semanticSearch(query: string, limit: number = 10): Promise<BlogPost[]> {
    try {
      // Import your existing embedding and Qdrant systems
      const { generateBatchEmbeddings, prepareTextForEmbedding } = await import('@/lib/embeddings')
      const { searchSimilarVectors } = await import('@/lib/qdrant')

      logger.info('Semantic search for blog posts:', { query, limit })

      // 1. Generate embedding for the search query
      const queryText = prepareTextForEmbedding(query, '', [])
      const queryEmbeddings = await generateBatchEmbeddings([queryText])
      const queryEmbedding = queryEmbeddings[0]

      if (!queryEmbedding || queryEmbedding.length === 0) {
        logger.warn('Failed to generate embedding for search query')
        return []
      }

      // 2. Search Qdrant for similar blog posts only
      const searchResults = await searchSimilarVectors({
        vector: queryEmbedding,
        limit,
        filter: {
          must: [
            { key: 'type', match: { value: 'blog_post' } },
            { key: 'source', match: { value: 'agriko_blog' } }
          ]
        }
      })

      if (!searchResults.success || !searchResults.results) {
        logger.warn('Qdrant search returned no results')
        return []
      }

      // 3. Convert Qdrant results back to BlogPost format
      const blogPosts: BlogPost[] = searchResults.results.map((result: any) => {
        const metadata = result.payload || {}
        return {
          id: result.id.toString().replace('blog_', ''),
          sanity_id: metadata.sanity_id || '',
          title: metadata.title || '',
          slug: metadata.slug || '',
          content: '', // Content not stored in Qdrant for performance
          excerpt: metadata.excerpt || '',
          published_at: new Date(metadata.published_at || Date.now()),
          created_at: new Date(metadata.timestamp || Date.now()),
          updated_at: new Date(metadata.timestamp || Date.now()),
          categories: metadata.categories || [],
          related_products: (metadata.related_products || []).map((productId: string) => ({
            product_id: productId,
            relevance_score: 0.8
          })),
          ai_generated: metadata.ai_generated || false,
          ai_model: metadata.ai_model || '',
          qdrant_id: result.id.toString(),
          embedding: undefined, // Not needed for search results
        } as BlogPost
      })

      logger.info('Semantic search completed:', {
        query,
        results: blogPosts.length,
        topScore: searchResults?.results?.[0]?.score || 0
      })

      return blogPosts
    } catch (error) {
      logger.error('Semantic search failed:', error as Record<string, unknown>)
      return []
    }
  }

  // Get related blog posts for a product
  static async getRelatedPostsForProduct(productId: string): Promise<BlogPost[]> {
    try {
      // Import your existing Memgraph system
      const { withSession } = await import('@/lib/memgraph')

      logger.info('Getting related blog posts for product:', { productId })

      const blogPosts: BlogPost[] = []

      await withSession(async (session) => {
        // Query for blog posts that directly mention this product
        const directMentionsQuery = `
          MATCH (p:Product {id: $product_id})<-[r:MENTIONS_PRODUCT]-(b:BlogPost)
          RETURN b, r.relevance_score as relevance_score
          ORDER BY r.relevance_score DESC, b.published_at DESC
          LIMIT 10
        `

        const directResult = await session.run(directMentionsQuery, {
          product_id: parseInt(productId)
        })

        // Convert Memgraph results to BlogPost format
        for (const record of directResult.records) {
          const blogNode = record.get('b')
          const relevanceScore = record.get('relevance_score') || 0.8

          if (blogNode && typeof blogNode === 'object' && 'properties' in blogNode) {
            const props = (blogNode as any).properties

            const blogPost: BlogPost = {
              id: props.id || '',
              sanity_id: props.sanity_id || '',
              title: props.title || 'Untitled',
              slug: props.slug || '',
              content: '', // Not stored in Memgraph for performance
              excerpt: props.excerpt || '',
              published_at: new Date(props.published_at || Date.now()),
              created_at: new Date(props.created_at || Date.now()),
              updated_at: new Date(),
              categories: [], // Will be fetched separately if needed
              related_products: [{
                product_id: productId,
                relevance_score: typeof relevanceScore === 'number' ? relevanceScore : 0.8
              }],
              ai_generated: props.ai_generated || false,
              ai_model: props.ai_model || '',
              qdrant_id: props.qdrant_id || '',
              memgraph_node_id: props.id || '',
            }

            blogPosts.push(blogPost)
          }
        }

        // Also look for blog posts that might be interesting based on product relationships
        if (blogPosts.length < 5) {
          const indirectMentionsQuery = `
            MATCH (p:Product {id: $product_id})-[:SIMILAR_TO|COMPLEMENTARY_WITH]-(related_p:Product)<-[r:MENTIONS_PRODUCT]-(b:BlogPost)
            WHERE NOT EXISTS((b)-[:MENTIONS_PRODUCT]->(p))
            RETURN DISTINCT b, avg(r.relevance_score) as avg_relevance
            ORDER BY avg_relevance DESC, b.published_at DESC
            LIMIT $remaining_limit
          `

          const indirectResult = await session.run(indirectMentionsQuery, {
            product_id: parseInt(productId),
            remaining_limit: 10 - blogPosts.length
          })

          for (const record of indirectResult.records) {
            const blogNode = record.get('b')
            const avgRelevance = record.get('avg_relevance') || 0.6

            if (blogNode && typeof blogNode === 'object' && 'properties' in blogNode) {
              const props = (blogNode as any).properties

              const blogPost: BlogPost = {
                id: props.id || '',
                sanity_id: props.sanity_id || '',
                title: props.title || 'Untitled',
                slug: props.slug || '',
                content: '',
                excerpt: props.excerpt || '',
                published_at: new Date(props.published_at || Date.now()),
                created_at: new Date(props.created_at || Date.now()),
                updated_at: new Date(),
                categories: [],
                related_products: [{
                  product_id: productId,
                  relevance_score: typeof avgRelevance === 'number' ? avgRelevance : 0.6
                }],
                ai_generated: props.ai_generated || false,
                ai_model: props.ai_model || '',
                qdrant_id: props.qdrant_id || '',
                memgraph_node_id: props.id || '',
              }

              blogPosts.push(blogPost)
            }
          }
        }
      })

      logger.info('Found related blog posts for product:', {
        productId,
        count: blogPosts.length,
        titles: blogPosts.map(p => p.title).slice(0, 3)
      })

      return blogPosts
    } catch (error) {
      logger.error('Failed to get related blog posts for product:', error as Record<string, unknown>)
      return []
    }
  }
}

export default BlogPostDatabase