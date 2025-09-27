import { createClient } from 'next-sanity'
import imageUrlBuilder from '@sanity/image-url'

// Validate required environment variables
const projectId = process.env.NEXT_PUBLIC_SANITY_PROJECT_ID
const dataset = process.env.NEXT_PUBLIC_SANITY_DATASET

if (!projectId) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_PROJECT_ID environment variable')
}

if (!dataset) {
  throw new Error('Missing NEXT_PUBLIC_SANITY_DATASET environment variable')
}

export const config = {
  projectId,
  dataset,
  apiVersion: '2023-05-03',
  useCdn: process.env.NODE_ENV === 'production',
}

// Client for reading data
export const sanityClient = createClient(config)

// Client for writing data (requires token)
export const sanityWriteClient = createClient({
  ...config,
  useCdn: false,
  token: process.env.SANITY_API_TOKEN,
})

// Image URL builder
const builder = imageUrlBuilder(config)
export const urlFor = (source: any) => builder.image(source)

// Common queries
export const blogPostQuery = `*[_type == "blogPost" && defined(slug.current)] | order(publishedAt desc) {
  _id,
  title,
  slug,
  excerpt,
  publishedAt,
  mainImage,
  author->{
    name,
    slug,
    image
  },
  categories[]->{
    title,
    slug,
    color
  },
  aiGenerated,
  aiModel,
  relatedProducts
}`

export const singleBlogPostQuery = `*[_type == "blogPost" && slug.current == $slug][0] {
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
    color,
    relatedProductCategories
  },
  aiGenerated,
  aiPrompt,
  aiModel,
  relatedProducts,
  syncedToSemanticDb,
  semanticDbId
}`

// Webhook types for TypeScript
export interface SanityWebhookBody {
  _type: string
  _id: string
  _rev?: string
  slug?: {
    current: string
  }
  title?: string
  publishedAt?: string
}

export interface BlogPostForSync {
  _id: string
  title: string
  slug: string
  excerpt?: string
  body: any[]
  publishedAt: string
  categories: string[]
  relatedProducts: Array<{
    productId: string
    relevanceScore: number
  }>
}