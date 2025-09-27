import { defineField, defineType } from 'sanity'

export const siteSettings = defineType({
  name: 'siteSettings',
  title: 'Site Settings',
  type: 'document',
  fields: [
    defineField({
      name: 'title',
      title: 'Site Title',
      type: 'string',
      validation: (Rule) => Rule.required(),
    }),
    defineField({
      name: 'description',
      title: 'Site Description',
      type: 'text',
      rows: 3,
    }),
    defineField({
      name: 'logo',
      title: 'Site Logo',
      type: 'image',
      options: {
        hotspot: true,
      },
    }),
    defineField({
      name: 'favicon',
      title: 'Favicon',
      type: 'image',
    }),
    defineField({
      name: 'socialMedia',
      title: 'Social Media',
      type: 'object',
      fields: [
        {
          name: 'facebook',
          title: 'Facebook URL',
          type: 'url',
        },
        {
          name: 'instagram',
          title: 'Instagram URL',
          type: 'url',
        },
        {
          name: 'twitter',
          title: 'Twitter URL',
          type: 'url',
        },
        {
          name: 'youtube',
          title: 'YouTube URL',
          type: 'url',
        },
        {
          name: 'tiktok',
          title: 'TikTok URL',
          type: 'url',
        },
      ],
    }),
    defineField({
      name: 'contactInfo',
      title: 'Contact Information',
      type: 'object',
      fields: [
        {
          name: 'email',
          title: 'Email',
          type: 'string',
        },
        {
          name: 'phone',
          title: 'Phone',
          type: 'string',
        },
        {
          name: 'address',
          title: 'Address',
          type: 'text',
          rows: 3,
        },
        {
          name: 'businessHours',
          title: 'Business Hours',
          type: 'text',
          rows: 2,
        },
      ],
    }),
    defineField({
      name: 'homepage',
      title: 'Homepage Settings',
      type: 'object',
      fields: [
        {
          name: 'heroTitle',
          title: 'Hero Title',
          type: 'string',
        },
        {
          name: 'heroSubtitle',
          title: 'Hero Subtitle',
          type: 'text',
          rows: 2,
        },
        {
          name: 'heroImage',
          title: 'Hero Background Image',
          type: 'image',
          options: {
            hotspot: true,
          },
        },
        {
          name: 'featuredProducts',
          title: 'Featured Products Section',
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Section Title',
              type: 'string',
            },
            {
              name: 'subtitle',
              title: 'Section Subtitle',
              type: 'text',
              rows: 2,
            },
            {
              name: 'showProductIds',
              title: 'Featured Product IDs',
              type: 'array',
              of: [{ type: 'string' }],
              description: 'Enter WooCommerce product IDs to feature',
            },
          ],
        },
        {
          name: 'aboutSection',
          title: 'About Section',
          type: 'object',
          fields: [
            {
              name: 'title',
              title: 'Section Title',
              type: 'string',
            },
            {
              name: 'content',
              title: 'Content',
              type: 'text',
              rows: 4,
            },
            {
              name: 'image',
              title: 'Section Image',
              type: 'image',
              options: {
                hotspot: true,
              },
            },
          ],
        },
      ],
    }),
    defineField({
      name: 'notifications',
      title: 'Site Notifications',
      type: 'object',
      fields: [
        {
          name: 'banner',
          title: 'Banner Message',
          type: 'object',
          fields: [
            {
              name: 'enabled',
              title: 'Show Banner',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'message',
              title: 'Banner Message',
              type: 'string',
            },
            {
              name: 'type',
              title: 'Banner Type',
              type: 'string',
              options: {
                list: [
                  { title: 'Info', value: 'info' },
                  { title: 'Success', value: 'success' },
                  { title: 'Warning', value: 'warning' },
                  { title: 'Sale', value: 'sale' },
                ],
              },
              initialValue: 'info',
            },
            {
              name: 'link',
              title: 'Banner Link',
              type: 'string',
            },
          ],
        },
        {
          name: 'maintenance',
          title: 'Maintenance Mode',
          type: 'object',
          fields: [
            {
              name: 'enabled',
              title: 'Enable Maintenance Mode',
              type: 'boolean',
              initialValue: false,
            },
            {
              name: 'message',
              title: 'Maintenance Message',
              type: 'text',
              rows: 3,
            },
          ],
        },
      ],
    }),
  ],
  preview: {
    select: {
      title: 'title',
    },
    prepare(selection) {
      return {
        title: selection.title || 'Site Settings',
      }
    },
  },
})