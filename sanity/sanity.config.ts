import {defineConfig} from 'sanity'
import {deskTool} from 'sanity/desk'
import {visionTool} from '@sanity/vision'

import {blogPost} from './schemas/blogPost'
import {author} from './schemas/author'
import {category} from './schemas/category'

export default defineConfig({
  name: 'agriko-blog',
  title: 'Agriko Blog',

  projectId: 'su5jn8x7',
  dataset: 'production',

  plugins: [deskTool(), visionTool()],

  schema: {
    types: [blogPost, author, category],
  },
})