import { defineField, defineType } from 'sanity'

export const testimonial = defineType({
  name: 'testimonial',
  title: 'Testimonial',
  type: 'document',
  fields: [
    defineField({
      name: 'customerName',
      title: 'Customer Name',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'customerLocation',
      title: 'Customer Location',
      type: 'string',
      description: 'e.g., "Manila, Philippines" or "Farmer from Laguna"',
    }),
    defineField({
      name: 'customerPhoto',
      title: 'Customer Photo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      validation: (Rule) => Rule.required().min(1).max(5),
      initialValue: 5,
    }),
    defineField({
      name: 'testimonialText',
      title: 'Testimonial',
      type: 'text',
      rows: 4,
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'productsPurchased',
      title: 'Products Purchased',
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
              name: 'productName',
              title: 'Product Name',
              type: 'string',
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'featured',
      title: 'Featured',
      type: 'boolean',
      description: 'Show this testimonial prominently on the homepage',
      initialValue: false,
    }),
    defineField({
      name: 'category',
      title: 'Category',
      type: 'string',
      options: {
        list: [
          { title: 'Product Quality', value: 'quality' },
          { title: 'Customer Service', value: 'service' },
          { title: 'Shipping & Delivery', value: 'shipping' },
          { title: 'Farm Partnership', value: 'partnership' },
          { title: 'Sustainability', value: 'sustainability' },
          { title: 'General', value: 'general' },
        ],
      },
      initialValue: 'general',
    }),
    defineField({
      name: 'dateReceived',
      title: 'Date Received',
      type: 'date',
      description: 'When this testimonial was received',
    }),
    defineField({
      name: 'verified',
      title: 'Verified Purchase',
      type: 'boolean',
      description: 'This customer made a verified purchase',
      initialValue: false,
    }),
    defineField({
      name: 'displayOrder',
      title: 'Display Order',
      type: 'number',
      description: 'Lower numbers appear first',
    }),
  ],
  preview: {
    select: {
      name: 'customerName',
      rating: 'rating',
      featured: 'featured',
      category: 'category',
      media: 'customerPhoto',
    },
    prepare(selection) {
      const { name, rating, featured, category } = selection
      const stars = '★'.repeat(rating) + '☆'.repeat(5 - rating)
      return {
        title: name,
        subtitle: `${stars} • ${category}${featured ? ' • Featured' : ''}`,
        media: selection.media,
      }
    },
  },
})