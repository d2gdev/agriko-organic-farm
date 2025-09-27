const { createClient } = require('@sanity/client')
const crypto = require('crypto')

// Initialize Sanity client
const client = createClient({
  projectId: 'su5jn8x7',
  dataset: 'production',
  useCdn: false,
  token: process.env.SANITY_WRITE_TOKEN, // You'll need to set this
  apiVersion: '2023-05-03'
})

async function setupBlogContent() {
  console.log('Setting up initial blog content...')

  try {
    // Create categories
    const categories = [
      {
        _type: 'category',
        _id: crypto.randomUUID(),
        title: 'Agriculture & Farming',
        slug: { _type: 'slug', current: 'agriculture-farming' },
        description: 'Latest insights and tips for modern farming practices',
        color: '#22c55e' // Green for agriculture
      },
      {
        _type: 'category',
        _id: crypto.randomUUID(),
        title: 'Product Spotlight',
        slug: { _type: 'slug', current: 'product-spotlight' },
        description: 'Featured products and their benefits for farmers',
        color: '#3b82f6' // Blue for products
      },
      {
        _type: 'category',
        _id: crypto.randomUUID(),
        title: 'Industry News',
        slug: { _type: 'slug', current: 'industry-news' },
        description: 'Latest developments in the agriculture industry',
        color: '#f59e0b' // Orange for news
      },
      {
        _type: 'category',
        _id: crypto.randomUUID(),
        title: 'How-To Guides',
        slug: { _type: 'slug', current: 'how-to-guides' },
        description: 'Step-by-step guides for farming techniques',
        color: '#8b5cf6' // Purple for guides
      }
    ]

    // Create authors
    const authors = [
      {
        _type: 'author',
        _id: crypto.randomUUID(),
        name: 'Sean - Agriko Founder',
        slug: { _type: 'slug', current: 'sean-agriko-founder' },
        bio: 'Passionate about sustainable agriculture and helping farmers succeed with quality products and expert guidance.',
        isAI: false
      },
      {
        _type: 'author',
        _id: crypto.randomUUID(),
        name: 'AgriBot Assistant',
        slug: { _type: 'slug', current: 'agribot-assistant' },
        bio: 'AI-powered agriculture specialist providing data-driven insights and recommendations for modern farming.',
        isAI: true
      }
    ]

    // Create sample blog posts
    const samplePosts = [
      {
        _type: 'blogPost',
        _id: crypto.randomUUID(),
        title: 'Welcome to the Agriko Blog',
        slug: { _type: 'slug', current: 'welcome-to-agriko-blog' },
        author: { _type: 'reference', _ref: authors[0]._id },
        categories: [{ _type: 'reference', _ref: categories[1]._id }],
        publishedAt: new Date().toISOString(),
        excerpt: 'Discover the latest in agriculture technology, farming tips, and product insights to help your farm thrive.',
        body: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'Welcome to the official Agriko blog! Here you\'ll find expert insights, product spotlights, and practical farming advice to help you succeed.'
              }
            ]
          }
        ],
        aiGenerated: false,
        syncedToSemanticDb: false
      },
      {
        _type: 'blogPost',
        _id: crypto.randomUUID(),
        title: 'Top 5 Sustainable Farming Practices for 2024',
        slug: { _type: 'slug', current: 'sustainable-farming-practices-2024' },
        author: { _type: 'reference', _ref: authors[1]._id },
        categories: [
          { _type: 'reference', _ref: categories[0]._id },
          { _type: 'reference', _ref: categories[3]._id }
        ],
        publishedAt: new Date().toISOString(),
        excerpt: 'Explore the most effective sustainable farming methods that are revolutionizing agriculture while protecting the environment.',
        body: [
          {
            _type: 'block',
            children: [
              {
                _type: 'span',
                text: 'Sustainable farming is not just a trend—it\'s the future of agriculture. Here are the top practices every modern farmer should consider implementing.'
              }
            ]
          }
        ],
        aiGenerated: true,
        aiModel: 'deepseek-v3',
        syncedToSemanticDb: false
      }
    ]

    // Create all content
    console.log('Creating categories...')
    for (const category of categories) {
      await client.create(category)
      console.log(`✓ Created category: ${category.title}`)
    }

    console.log('Creating authors...')
    for (const author of authors) {
      await client.create(author)
      console.log(`✓ Created author: ${author.name}`)
    }

    console.log('Creating blog posts...')
    for (const post of samplePosts) {
      await client.create(post)
      console.log(`✓ Created blog post: ${post.title}`)
    }

    console.log('\n🎉 Blog content setup complete!')
    console.log('Visit http://localhost:3333/ to see your content in Sanity Studio')

  } catch (error) {
    console.error('Error setting up blog content:', error)
    console.log('\nNote: You may need to set SANITY_WRITE_TOKEN environment variable')
    console.log('or create content manually through the Sanity Studio interface at http://localhost:3333/')
  }
}

setupBlogContent()