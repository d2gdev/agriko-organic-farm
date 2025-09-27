import { blogPost } from './blogPost'
import { author } from './author'
import { category } from './category'
import { page } from './page'
import { testimonial } from './testimonial'
import { siteSettings } from './siteSettings'
import {
  heroBlock,
  statisticBlock,
  ctaBlock,
  testimonialBlock,
  galleryBlock,
  contactFormBlock,
  mapBlock,
  storeLocationsBlock
} from './customBlocks'

export const schemaTypes = [
  // Core content
  blogPost,
  page,

  // People & organizations
  author,

  // Taxonomy
  category,

  // Social proof
  testimonial,

  // Configuration
  siteSettings,

  // Custom content blocks
  heroBlock,
  statisticBlock,
  ctaBlock,
  testimonialBlock,
  galleryBlock,
  contactFormBlock,
  mapBlock,
  storeLocationsBlock,
]