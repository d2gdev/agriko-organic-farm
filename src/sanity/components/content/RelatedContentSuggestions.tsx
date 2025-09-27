import React, { useState, useEffect } from 'react'
import { Card, Stack, Text, Button, Badge, Flex as SanityFlex } from '@sanity/ui'
import { LinkIcon, RefreshIcon } from '@sanity/icons'

interface SanityDocument {
  _id: string;
  _type: string;
  title?: string;
  slug?: { current: string };
  categories?: Array<{ title: string }>;
  tags?: string[];
  seo?: {
    title?: string;
    description?: string;
    metaKeywords?: string[];
  };
  [key: string]: unknown;
}

interface ContentSuggestion {
  _id: string;
  _type: string;
  title: string;
  slug?: { current: string };
  score?: number;
  relevanceScore?: number;
  matchedKeywords?: string[];
}

interface RelatedContentSuggestionsProps {
  document: SanityDocument
  documentId: string
}

export function RelatedContentSuggestions({ document, documentId }: RelatedContentSuggestionsProps) {
  const [suggestions, setSuggestions] = useState<ContentSuggestion[]>([])
  const [isLoading, setIsLoading] = useState(false)

  const analyzeSimilarity = (doc1: SanityDocument, doc2: SanityDocument): number => {
    let score = 0

    // Title similarity
    if (doc1.title && doc2.title) {
      const words1 = new Set(doc1.title.toLowerCase().split(/\s+/))
      const words2 = new Set(doc2.title.toLowerCase().split(/\s+/))
      const intersection = new Set([...words1].filter(x => words2.has(x)))
      score += intersection.size * 10
    }

    // Category/tag similarity
    if (doc1.categories && doc2.categories) {
      const cats1 = new Set(doc1.categories)
      const cats2 = new Set(doc2.categories)
      const commonCats = new Set([...cats1].filter(x => cats2.has(x)))
      score += commonCats.size * 20
    }

    // Keyword similarity
    if (doc1.seo?.metaKeywords && doc2.seo?.metaKeywords) {
      const keywords1 = new Set(doc1.seo.metaKeywords)
      const keywords2 = new Set(doc2.seo.metaKeywords)
      const commonKeywords = new Set([...keywords1].filter(x => keywords2.has(x)))
      score += commonKeywords.size * 15
    }

    // Product type similarity (for product pages)
    if (doc1.productType && doc2.productType && doc1.productType === doc2.productType) {
      score += 30
    }

    // Content type bonus
    if (doc1._type === doc2._type) {
      score += 5
    }

    return score
  }

  const fetchSuggestions = async () => {
    setIsLoading(true)
    try {
      // Simulate fetching related content
      // In production, this would query your Sanity dataset
      const mockRelatedContent = [
        {
          _id: '1',
          _type: 'blogPost',
          title: 'Health Benefits of Turmeric',
          slug: { current: 'health-benefits-turmeric' },
          relevanceScore: 85,
          matchedKeywords: ['turmeric', 'health', 'organic']
        },
        {
          _id: '2',
          _type: 'blogPost',
          title: 'Organic Farming Practices',
          slug: { current: 'organic-farming-practices' },
          relevanceScore: 72,
          matchedKeywords: ['organic', 'farming']
        },
        {
          _id: '3',
          _type: 'page',
          title: 'Our Products',
          slug: { current: 'products' },
          relevanceScore: 65,
          matchedKeywords: ['products', 'organic']
        },
        {
          _id: '4',
          _type: 'blogPost',
          title: 'Rice Varieties Explained',
          slug: { current: 'rice-varieties-explained' },
          relevanceScore: 58,
          matchedKeywords: ['rice', 'varieties']
        }
      ]

      // Filter out current document and sort by relevance
      const filtered = mockRelatedContent
        .filter(item => item._id !== documentId)
        .sort((a, b) => b.relevanceScore - a.relevanceScore)
        .slice(0, 5)

      setSuggestions(filtered)
    } catch (error) {
      console.error('Failed to fetch suggestions:', error)
    } finally {
      setIsLoading(false)
    }
  }

  useEffect(() => {
    if (document && documentId) {
      fetchSuggestions()
    }
  }, [document, documentId])

  const getTypeColor = (type: string) => {
    switch(type) {
      case 'blogPost': return 'primary'
      case 'page': return 'positive'
      case 'product': return 'caution'
      default: return 'default'
    }
  }

  const getTypeLabel = (type: string) => {
    switch(type) {
      case 'blogPost': return 'Blog'
      case 'page': return 'Page'
      case 'product': return 'Product'
      default: return type
    }
  }

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <SanityFlex align="center" justify="space-between">
          <SanityFlex align="center" gap={2}>
            <LinkIcon />
            <Text size={2} weight="semibold">Related Content Suggestions</Text>
          </SanityFlex>
          <Button
            fontSize={1}
            icon={RefreshIcon}
            mode="ghost"
            onClick={fetchSuggestions}
            loading={isLoading}
            text="Refresh"
          />
        </SanityFlex>

        {suggestions.length === 0 && !isLoading ? (
          <Card padding={3} tone="transparent" border>
            <Text size={1} muted align="center">
              No related content suggestions available
            </Text>
          </Card>
        ) : (
          <Stack space={2}>
            {suggestions.map((item) => (
              <Card key={item._id} padding={3} radius={2} tone="default" border>
                <SanityFlex align="center" justify="space-between">
                  <Stack space={2} flex={1}>
                    <SanityFlex align="center" gap={2}>
                      <Badge tone={getTypeColor(item._type)} fontSize={0}>
                        {getTypeLabel(item._type)}
                      </Badge>
                      <Text size={1} weight="semibold">
                        {item.title}
                      </Text>
                    </SanityFlex>
                    <SanityFlex align="center" gap={3}>
                      <Text size={1} muted>
                        Relevance: {item.relevanceScore}%
                      </Text>
                      {item.matchedKeywords && (
                        <SanityFlex gap={1}>
                          {item.matchedKeywords.slice(0, 3).map((keyword: string) => (
                            <Badge key={keyword} tone="default" fontSize={0}>
                              {keyword}
                            </Badge>
                          ))}
                        </SanityFlex>
                      )}
                    </SanityFlex>
                  </Stack>
                  <Button
                    fontSize={1}
                    mode="ghost"
                    text="Link"
                    tone="primary"
                  />
                </SanityFlex>
              </Card>
            ))}
          </Stack>
        )}

        {/* AI Insights */}
        <Card padding={3} radius={2} tone="primary" border>
          <Stack space={2}>
            <Text size={1} weight="semibold">💡 AI Insights</Text>
            <Text size={1}>
              Consider linking to related content to improve SEO and user engagement.
              Internal links help search engines understand content relationships and
              keep users on your site longer.
            </Text>
          </Stack>
        </Card>
      </Stack>
    </Card>
  )
}

