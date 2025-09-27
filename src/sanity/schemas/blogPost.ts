import { defineField, defineType } from 'sanity'

export const blogPost = defineType({
  name: 'blogPost',
  title: 'Blog Post',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'slug',
      title: 'Slug',
      type: 'slug',
      options: {
        source: 'title',
        maxLength: 96,
      },
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'author',
      title: 'Author',
      type: 'reference',
      to: { type: 'author' },
    }),
    defineField({
      name: 'mainImage',
      title: 'Main image',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'categories',
      title: 'Categories',
      type: 'array',
      of: [{ type: 'reference', to: { type: 'category' } }],
    }),
    defineField({
      name: 'publishedAt',
      title: 'Published at',
      type: 'datetime',
    }),
    defineField({
      name: 'excerpt',
      title: 'Excerpt',
      type: 'text',
      rows: 4,
    }),
    defineField({
      name: 'seo',
      title: 'SEO',
      type: 'object',
      fields: [
        {
          name: 'metaDescription',
          title: 'Meta Description',
          type: 'text',
          rows: 3,
          validation: (Rule) => Rule.max(160).warning('Meta description should be under 160 characters'),
        },
        {
          name: 'metaKeywords',
          title: 'Meta Keywords',
          type: 'array',
          of: [{ type: 'string' }],
          options: {
            layout: 'tags',
          },
        },
        {
          name: 'ogImage',
          title: 'Open Graph Image',
          type: 'image',
          description: 'Custom image for social media sharing (defaults to main image if not set)',
        },
        {
          name: 'noIndex',
          title: 'No Index',
          type: 'boolean',
          description: 'Prevent search engines from indexing this post',
          initialValue: false,
        },
      ],
    }),
    defineField({
      name: 'body',
      title: 'Body',
      type: 'array',
      of: [
        {
          type: 'block',
        },
        {
          type: 'image',
          fields: [
            {
              type: 'text',
              name: 'alt',
              title: 'Alternative text',
              description: 'Important for SEO and accessibility.',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'aiPrompt',
      title: 'AI Prompt',
      type: 'text',
      description: 'The prompt used to generate this content',
      hidden: ({ document }) => !document?.aiGenerated,
    }),
    defineField({
      name: 'aiGenerated',
      title: 'AI Generated',
      type: 'boolean',
      initialValue: false,
    }),
    defineField({
      name: 'aiModel',
      title: 'AI Model',
      type: 'string',
      description: 'The AI model used (e.g., deepseek-v3)',
      hidden: ({ document }) => !document?.aiGenerated,
    }),
    defineField({
      name: 'relatedProducts',
      title: 'Related Products',
      type: 'array',
      of: [
        {
          type: 'object',
          fields: [
            {
              name: 'productId',
              title: 'Product ID',
              type: 'string',
            },
            {
              name: 'relevanceScore',
              title: 'Relevance Score',
              type: 'number',
              validation: (Rule) => Rule.min(0).max(1),
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'semanticDbId',
      title: 'Semantic Database ID',
      type: 'string',
      readOnly: true,
    }),
    defineField({
      name: 'syncedToSemanticDb',
      title: 'Synced to Semantic Database',
      type: 'boolean',
      initialValue: false,
      readOnly: true,
    }),
  ],
})