import React from 'react'
import { definePlugin } from 'sanity'
import { LivePreview } from '../components/preview/LivePreview'
import { SocialMediaPreview } from '../components/preview/SocialMediaPreview'
import { SEOPreview } from '../components/seo/SEOPreview'
import { ContentScoring } from '../components/insights/ContentScoring'
import { RelatedContentSuggestions } from '../components/content/RelatedContentSuggestions'
import { BrokenLinkChecker } from '../components/tools/BrokenLinkChecker'
import { ImageOptimizer } from '../components/tools/ImageOptimizer'

export const contentEnhancementsPlugin = definePlugin(() => {
  return {
    name: 'content-enhancements',
    document: {
      inspectors: (prev, context) => {
        const { documentType, document, documentId } = context

        // Only add to content types that would benefit from these tools
        const supportedTypes = ['blogPost', 'page', 'product']

        if (!documentType || !supportedTypes.includes(documentType)) {
          return prev
        }

        const schemaType = { name: documentType }

        return [
          ...prev,
          {
            name: 'live-preview',
            title: 'Live Preview',
            component: () => <LivePreview document={document} schemaType={schemaType} />
          },
          {
            name: 'seo-preview',
            title: 'SEO Preview',
            component: () => <SEOPreview document={document} />
          },
          {
            name: 'social-preview',
            title: 'Social Media',
            component: () => <SocialMediaPreview document={document} />
          },
          {
            name: 'content-score',
            title: 'Content Score',
            component: () => <ContentScoring document={document} schemaType={schemaType} />
          },
          {
            name: 'related-content',
            title: 'Related Content',
            component: () => <RelatedContentSuggestions document={document} documentId={documentId} />
          },
          {
            name: 'link-checker',
            title: 'Link Checker',
            component: () => <BrokenLinkChecker document={document} />
          },
          {
            name: 'image-optimizer',
            title: 'Image Optimizer',
            component: () => <ImageOptimizer document={document} />
          }
        ]
      }
    }
  }
})