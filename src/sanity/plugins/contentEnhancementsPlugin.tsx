import React from 'react'
import { definePlugin } from 'sanity'
import { useDocumentPane } from 'sanity/desk'
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
        const { documentType, documentId } = context

        // Only add to content types that would benefit from these tools
        const supportedTypes = ['blogPost', 'page', 'product']

        if (!documentType || !supportedTypes.includes(documentType)) {
          return prev
        }

        const schemaType = { name: documentType }

        // Component wrapper that uses the hook to get document data
        const InspectorWrapper = ({ children }: { children: (document: any) => React.ReactNode }) => {
          const paneContext = useDocumentPane()
          const document = paneContext?.value
          return <>{children(document)}</>
        }

        return [
          ...prev,
          {
            name: 'live-preview',
            title: 'Live Preview',
            component: () => (
              <InspectorWrapper>
                {(document) => <LivePreview document={document} schemaType={schemaType} />}
              </InspectorWrapper>
            )
          },
          {
            name: 'seo-preview',
            title: 'SEO Preview',
            component: () => (
              <InspectorWrapper>
                {(document) => <SEOPreview document={document} />}
              </InspectorWrapper>
            )
          },
          {
            name: 'social-preview',
            title: 'Social Media',
            component: () => (
              <InspectorWrapper>
                {(document) => <SocialMediaPreview document={document} />}
              </InspectorWrapper>
            )
          },
          {
            name: 'content-score',
            title: 'Content Score',
            component: () => (
              <InspectorWrapper>
                {(document) => <ContentScoring document={document} schemaType={schemaType} />}
              </InspectorWrapper>
            )
          },
          {
            name: 'related-content',
            title: 'Related Content',
            component: () => (
              <InspectorWrapper>
                {(document) => <RelatedContentSuggestions document={document} documentId={documentId || ''} />}
              </InspectorWrapper>
            )
          },
          {
            name: 'link-checker',
            title: 'Link Checker',
            component: () => (
              <InspectorWrapper>
                {(document) => <BrokenLinkChecker document={document} />}
              </InspectorWrapper>
            )
          },
          {
            name: 'image-optimizer',
            title: 'Image Optimizer',
            component: () => (
              <InspectorWrapper>
                {(document) => <ImageOptimizer document={document} />}
              </InspectorWrapper>
            )
          }
        ]
      }
    }
  }
})