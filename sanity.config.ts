import { defineConfig } from 'sanity'
import { structureTool } from 'sanity/structure'
import { visionTool } from '@sanity/vision'
import { schemaTypes } from './src/sanity/schemas'

export default defineConfig({
  name: 'agriko-blog',
  title: 'Agriko Blog CMS',

  projectId: process.env.NEXT_PUBLIC_SANITY_PROJECT_ID || 'su5jn8x7',
  dataset: process.env.NEXT_PUBLIC_SANITY_DATASET || 'production',

  plugins: [
    structureTool(),
    visionTool()
  ],

  schema: {
    types: schemaTypes,
  },

  basePath: '/studio'
})