import { NextRequest, NextResponse } from 'next/server'
import { sanityWriteClient } from '@/lib/sanity'
import { logger } from '@/lib/logger'
import { withRetry } from '@/lib/retry-handler'

// Sanity block types for portable text
interface SanityBlock {
  _type: 'block';
  style?: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6';
  children: Array<{
    _type: 'span';
    text: string;
    marks?: string[];
  }>;
}

interface AIContentRequest {
  topic: string;
  category?: string;
  targetProducts?: string[];
  tone?: string;
}

interface GeneratedContent {
  title: string;
  content: string;
  excerpt?: string;
  seoTitle?: string;
  seoDescription?: string;
}

const DEEPSEEK_API_KEY = process.env.DEEPSEEK_API_KEY
const DEEPSEEK_API_URL = 'https://api.deepseek.com/v1/chat/completions'

export async function POST(request: NextRequest) {
  try {
    const { topic, category, targetProducts, tone = 'informative' } = await request.json()

    if (!topic) {
      return NextResponse.json({ error: 'Topic is required' }, { status: 400 })
    }

    if (!DEEPSEEK_API_KEY) {
      return NextResponse.json({ error: 'Deepseek API key not configured' }, { status: 500 })
    }

    logger.info('Generating AI blog content:', { topic, category, tone })

    // Generate blog content using Deepseek
    const generatedContent = await withRetry(
      () => generateBlogContent(topic, category, targetProducts, tone),
      {
        maxAttempts: 2,
        baseDelayMs: 1000,
        maxDelayMs: 5000,
        backoffMultiplier: 1.5,
        retryableErrors: (error: unknown) => {
          if (error instanceof Error) {
            // Only retry on actual network errors, not authentication errors
            return error.message.includes('fetch failed') ||
                   error.message.includes('timeout') ||
                   error.message.includes('ECONNRESET') ||
                   (error.message.includes('500') && !error.message.includes('401') && !error.message.includes('403'))
          }
          return false
        }
      },
      'deepseek-content-generation'
    )

    // Create blog post in Sanity
    const sanityDoc = await sanityWriteClient.create({
      _type: 'blogPost',
      title: generatedContent.title,
      slug: {
        current: generateSlug(generatedContent.title),
        _type: 'slug'
      },
      excerpt: generatedContent.excerpt,
      body: convertToSanityBlocks(generatedContent.content),
      publishedAt: null, // Draft by default
      aiGenerated: true,
      aiPrompt: generatedContent.prompt,
      aiModel: 'deepseek-v3',
      categories: category ? [{ _type: 'reference', _ref: category }] : [],
      relatedProducts: targetProducts?.map((productId: string) => ({
        _type: 'object',
        productId,
        relevanceScore: 0.8 // Default high relevance for manually specified products
      })) || []
    })

    logger.info('AI blog post created in Sanity:', {
      id: sanityDoc._id,
      title: generatedContent.title
    })

    return NextResponse.json({
      success: true,
      blogPost: {
        _id: sanityDoc._id,
        title: generatedContent.title,
        excerpt: generatedContent.excerpt,
        aiGenerated: true
      }
    })

  } catch (error) {
    logger.error('AI content generation failed:', error as Record<string, unknown>)
    return NextResponse.json(
      { error: 'Content generation failed' },
      { status: 500 }
    )
  }
}

async function generateBlogContent(topic: string, category?: string, targetProducts?: string[], tone: string = 'informative') {
  const prompt = `Write a comprehensive blog post about "${topic}" for an agricultural/gardening e-commerce website.

Requirements:
- Target audience: Home gardeners and small-scale farmers
- Tone: ${tone}
- Length: 800-1200 words
- Include actionable tips and practical advice
${category ? `- Category focus: ${category}` : ''}
${targetProducts?.length ? `- Naturally mention these product types: ${targetProducts.join(', ')}` : ''}

Structure the response as JSON with these fields:
{
  "title": "SEO-friendly title (max 60 characters)",
  "excerpt": "Compelling meta description (max 160 characters)",
  "content": "Full blog post content in markdown format",
  "prompt": "The prompt used to generate this content"
}

Focus on providing real value to readers while subtly connecting to relevant products. Include specific tips, best practices, and common mistakes to avoid.`

  const response = await fetch(DEEPSEEK_API_URL, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${DEEPSEEK_API_KEY}`
    },
    body: JSON.stringify({
      model: 'deepseek-chat',
      messages: [
        {
          role: 'user',
          content: prompt
        }
      ],
      max_tokens: 2000,
      temperature: 0.7,
      response_format: { type: 'json_object' }
    })
  })

  if (!response.ok) {
    const errorText = await response.text()
    logger.error('Deepseek API detailed error:', {
      status: response.status,
      statusText: response.statusText,
      headers: Object.fromEntries(response.headers.entries()),
      body: errorText,
      url: DEEPSEEK_API_URL
    })
    throw new Error(`Deepseek API error: ${response.status} - ${errorText}`)
  }

  const data = await response.json()
  const content = JSON.parse(data.choices[0].message.content)

  return {
    ...content,
    prompt: prompt.substring(0, 500) + '...' // Truncate for storage
  }
}

// Convert markdown content to Sanity's portable text blocks
function convertToSanityBlocks(markdownContent: string): SanityBlock[] {
  // Simple markdown to Sanity blocks conversion
  // In a real implementation, you'd use a proper markdown parser
  const paragraphs = markdownContent.split('\n\n').filter(p => p.trim())

  return paragraphs.map(paragraph => {
    const trimmedPara = paragraph.trim()

    // Handle headers
    if (trimmedPara.startsWith('# ')) {
      return {
        _type: 'block',
        style: 'h1',
        children: [{ _type: 'span', text: trimmedPara.substring(2) }]
      }
    }
    if (trimmedPara.startsWith('## ')) {
      return {
        _type: 'block',
        style: 'h2',
        children: [{ _type: 'span', text: trimmedPara.substring(3) }]
      }
    }
    if (trimmedPara.startsWith('### ')) {
      return {
        _type: 'block',
        style: 'h3',
        children: [{ _type: 'span', text: trimmedPara.substring(4) }]
      }
    }

    // Handle lists
    if (trimmedPara.includes('\n- ') || trimmedPara.startsWith('- ')) {
      const listItems = trimmedPara.split('\n- ').map(item => item.replace(/^- /, ''))
      return {
        _type: 'block',
        listItem: 'bullet',
        children: listItems.map(item => ({ _type: 'span', text: item }))
      }
    }

    // Regular paragraphs
    return {
      _type: 'block',
      style: 'normal',
      children: [{ _type: 'span', text: trimmedPara }]
    }
  })
}

// Generate URL-friendly slug
function generateSlug(title: string): string {
  return title
    .toLowerCase()
    .replace(/[^\w\s-]/g, '') // Remove special characters
    .replace(/\s+/g, '-') // Replace spaces with hyphens
    .replace(/-+/g, '-') // Remove duplicate hyphens
    .trim()
}