import { defineType, defineField } from 'sanity'

// Statistics/Metrics Block
export const statisticBlock = defineType({
  name: 'statisticBlock',
  title: 'Statistic Block',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string',
    }),
    defineField({
      name: 'statistics',
      title: 'Statistics',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'value', title: 'Value', type: 'string' },
          { name: 'label', title: 'Label', type: 'string' },
          { name: 'sublabel', title: 'Sub Label', type: 'string' },
          { name: 'color', title: 'Color Theme', type: 'string', options: {
            list: ['green', 'yellow', 'blue', 'purple', 'orange', 'red']
          }}
        ]
      }]
    })
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'Statistics Block',
        subtitle: '📊 Statistics/Metrics'
      }
    }
  }
})

// CTA Button Block
export const ctaBlock = defineType({
  name: 'ctaBlock',
  title: 'Call to Action',
  type: 'object',
  fields: [
    defineField({
      name: 'text',
      title: 'Button Text',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'url',
      title: 'Link URL',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'style',
      title: 'Button Style',
      type: 'string',
      options: {
        list: [
          { title: 'Primary', value: 'primary' },
          { title: 'Secondary', value: 'secondary' },
          { title: 'Outline', value: 'outline' }
        ]
      },
      initialValue: 'primary'
    }),
    defineField({
      name: 'icon',
      title: 'Icon',
      type: 'string',
      options: {
        list: [
          { title: 'None', value: 'none' },
          { title: 'Arrow Right', value: 'arrow-right' },
          { title: 'Download', value: 'download' },
          { title: 'External Link', value: 'external' }
        ]
      },
      initialValue: 'none'
    })
  ],
  preview: {
    select: { text: 'text', url: 'url' },
    prepare({ text, url }) {
      return {
        title: text,
        subtitle: `🔗 ${url}`
      }
    }
  }
})

// Testimonial Block
export const testimonialBlock = defineType({
  name: 'testimonialBlock',
  title: 'Testimonial',
  type: 'object',
  fields: [
    defineField({
      name: 'quote',
      title: 'Quote',
      type: 'text',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'author',
      title: 'Author Name',
      type: 'string',
      validation: Rule => Rule.required()
    }),
    defineField({
      name: 'role',
      title: 'Author Role/Title',
      type: 'string'
    }),
    defineField({
      name: 'rating',
      title: 'Rating',
      type: 'number',
      options: {
        list: [1, 2, 3, 4, 5]
      },
      initialValue: 5
    }),
    defineField({
      name: 'image',
      title: 'Author Image',
      type: 'image',
      options: {
        hotspot: true
      }
    })
  ],
  preview: {
    select: { author: 'author', quote: 'quote' },
    prepare({ author, quote }) {
      return {
        title: author,
        subtitle: `💬 ${quote?.substring(0, 50)}...`
      }
    }
  }
})

// Hero Section Block
export const heroBlock = defineType({
  name: 'heroBlock',
  title: 'Hero Section',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Title',
      type: 'string'
    }),
    defineField({
      name: 'subtitle',
      title: 'Subtitle',
      type: 'text'
    }),
    defineField({
      name: 'backgroundImage',
      title: 'Background Image',
      type: 'image',
      options: {
        hotspot: true
      }
    }),
    defineField({
      name: 'buttons',
      title: 'CTA Buttons',
      type: 'array',
      of: [{ type: 'ctaBlock' }]
    })
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'Hero Section',
        subtitle: '🦸 Hero Block'
      }
    }
  }
})

// Gallery Block
export const galleryBlock = defineType({
  name: 'galleryBlock',
  title: 'Image Gallery',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Gallery Title',
      type: 'string'
    }),
    defineField({
      name: 'images',
      title: 'Images',
      type: 'array',
      of: [{
        type: 'image',
        fields: [
          { name: 'caption', title: 'Caption', type: 'string' },
          { name: 'alt', title: 'Alt Text', type: 'string' }
        ],
        options: {
          hotspot: true
        }
      }]
    }),
    defineField({
      name: 'layout',
      title: 'Layout',
      type: 'string',
      options: {
        list: [
          { title: 'Grid', value: 'grid' },
          { title: 'Carousel', value: 'carousel' },
          { title: 'Masonry', value: 'masonry' }
        ]
      },
      initialValue: 'grid'
    })
  ],
  preview: {
    select: { title: 'title', images: 'images' },
    prepare({ title, images }) {
      return {
        title: title || 'Image Gallery',
        subtitle: `🖼️ ${images?.length || 0} images`
      }
    }
  }
})

// Contact Form Block
export const contactFormBlock = defineType({
  name: 'contactFormBlock',
  title: 'Contact Form',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Form Title',
      type: 'string'
    }),
    defineField({
      name: 'description',
      title: 'Form Description',
      type: 'text'
    }),
    defineField({
      name: 'fields',
      title: 'Form Fields',
      type: 'array',
      of: [{
        type: 'string',
        options: {
          list: [
            'name', 'email', 'phone', 'subject', 'message', 'company', 'address'
          ]
        }
      }]
    }),
    defineField({
      name: 'submitButtonText',
      title: 'Submit Button Text',
      type: 'string',
      initialValue: 'Send Message'
    })
  ],
  preview: {
    select: { title: 'title' },
    prepare({ title }) {
      return {
        title: title || 'Contact Form',
        subtitle: '📝 Form Block'
      }
    }
  }
})

// Map/Location Block
export const mapBlock = defineType({
  name: 'mapBlock',
  title: 'Map/Location',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Location Title',
      type: 'string'
    }),
    defineField({
      name: 'address',
      title: 'Address',
      type: 'text'
    }),
    defineField({
      name: 'coordinates',
      title: 'Coordinates',
      type: 'geopoint'
    }),
    defineField({
      name: 'mapUrl',
      title: 'Google Maps URL',
      type: 'url'
    })
  ],
  preview: {
    select: { title: 'title', address: 'address' },
    prepare({ title, address }) {
      return {
        title: title || 'Location',
        subtitle: `📍 ${address || 'Map Block'}`
      }
    }
  }
})

// Store Locations Block
export const storeLocationsBlock = defineType({
  name: 'storeLocationsBlock',
  title: 'Store Locations',
  type: 'object',
  fields: [
    defineField({
      name: 'title',
      title: 'Section Title',
      type: 'string'
    }),
    defineField({
      name: 'stores',
      title: 'Stores',
      type: 'array',
      of: [{
        type: 'object',
        fields: [
          { name: 'name', title: 'Store Name', type: 'string' },
          { name: 'logo', title: 'Store Logo', type: 'image' },
          { name: 'locations', title: 'Locations', type: 'array', of: [{ type: 'string' }] },
          { name: 'url', title: 'Store Website', type: 'url' }
        ]
      }]
    })
  ],
  preview: {
    select: { title: 'title', stores: 'stores' },
    prepare({ title, stores }) {
      return {
        title: title || 'Store Locations',
        subtitle: `🏪 ${stores?.length || 0} store chains`
      }
    }
  }
})