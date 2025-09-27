// Proper TypeScript interfaces for Sanity CMS data structures

export interface SanityAsset {
  _ref: string;
  _type: 'reference';
}

export interface SanityImage {
  _type: 'image';
  asset: SanityAsset;
  hotspot?: {
    x: number;
    y: number;
    height: number;
    width: number;
  };
  crop?: {
    top: number;
    bottom: number;
    left: number;
    right: number;
  };
  alt?: string;
}

export interface SanitySlug {
  _type: 'slug';
  current: string;
}

export interface SanityAuthor {
  _id: string;
  _type: 'author';
  name: string;
  slug: SanitySlug;
  image?: SanityImage;
  bio?: string;
  isAI?: boolean;
}

export interface SanityCategory {
  _id: string;
  _type: 'category';
  title: string;
  slug: SanitySlug;
  description?: string;
  color?: string;
  relatedProductCategories?: string[];
}

export interface SanityRelatedProduct {
  productId: string;
  relevanceScore: number;
}

export interface SanitySEO {
  metaDescription?: string;
  metaKeywords?: string[];
  ogImage?: SanityImage;
  noIndex?: boolean;
}

// Portable Text (Rich Text) Types
export interface SanityMarkDef {
  _key: string;
  _type: 'link' | string;
  href?: string;
}

export interface SanitySpan {
  _type: 'span';
  _key: string;
  text: string;
  marks?: string[];
}

export interface SanityTextBlock {
  _type: 'block';
  _key: string;
  style?: 'normal' | 'h1' | 'h2' | 'h3' | 'h4' | 'h5' | 'h6' | 'blockquote';
  children: SanitySpan[];
  markDefs?: SanityMarkDef[];
  level?: number;
  listItem?: 'bullet' | 'number';
}

export interface SanityImageBlock {
  _type: 'image';
  _key: string;
  asset: SanityAsset;
  alt?: string;
  caption?: string;
}

export type SanityPortableTextBlock = SanityTextBlock | SanityImageBlock;

export interface SanityBlogPost {
  _id: string;
  _type: 'blogPost';
  title: string;
  slug: SanitySlug;
  excerpt?: string;
  publishedAt: string;
  mainImage?: SanityImage;
  body: SanityPortableTextBlock[];
  author?: SanityAuthor;
  categories?: SanityCategory[];
  seo?: SanitySEO;
  aiGenerated?: boolean;
  aiModel?: string;
  aiPrompt?: string;
  relatedProducts?: SanityRelatedProduct[];
  syncedToSemanticDb?: boolean;
  semanticDbId?: string;
}