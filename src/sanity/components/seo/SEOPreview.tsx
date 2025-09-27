import React from 'react'
import { Card, Stack, Text, Label, Box } from '@sanity/ui'
import { SearchIcon } from '@sanity/icons'

interface SEOPreviewProps {
  document: any
}

export function SEOPreview({ document }: SEOPreviewProps) {
  const title = document?.seo?.metaTitle || document?.title || 'Page Title'
  const description = document?.seo?.metaDescription || document?.excerpt || 'Page description will appear here...'
  const url = `agrikoph.com/${document?.slug?.current || 'page-url'}`

  // Character counts
  const titleLength = title.length
  const descriptionLength = description.length

  // Optimal lengths
  const titleOptimal = titleLength >= 30 && titleLength <= 60
  const descriptionOptimal = descriptionLength >= 120 && descriptionLength <= 160

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <Flex align="center" gap={2}>
          <SearchIcon />
          <Text size={2} weight="semibold">Google Search Preview</Text>
        </Flex>

        {/* Google Search Result Preview */}
        <Card padding={3} radius={2} tone="default" border>
          <Stack space={2}>
            {/* URL */}
            <Text size={1} muted>
              {url}
            </Text>

            {/* Title */}
            <Text size={3} weight="semibold" style={{ color: '#1a0dab' }}>
              {title.substring(0, 60)}{titleLength > 60 && '...'}
            </Text>

            {/* Description */}
            <Text size={1} style={{ color: '#545454', lineHeight: 1.4 }}>
              {description.substring(0, 160)}{descriptionLength > 160 && '...'}
            </Text>
          </Stack>
        </Card>

        {/* SEO Analysis */}
        <Stack space={3}>
          <Text size={2} weight="semibold">SEO Analysis</Text>

          {/* Title Analysis */}
          <Box>
            <Label size={1}>
              Title ({titleLength}/60 characters)
            </Label>
            <Progress value={Math.min(titleLength / 60 * 100, 100)} tone={titleOptimal ? 'positive' : 'caution'} />
            <Text size={1} muted>
              {titleOptimal ? '✅ Good length' : titleLength < 30 ? '⚠️ Too short' : '⚠️ Too long'}
            </Text>
          </Box>

          {/* Description Analysis */}
          <Box>
            <Label size={1}>
              Description ({descriptionLength}/160 characters)
            </Label>
            <Progress value={Math.min(descriptionLength / 160 * 100, 100)} tone={descriptionOptimal ? 'positive' : 'caution'} />
            <Text size={1} muted>
              {descriptionOptimal ? '✅ Good length' : descriptionLength < 120 ? '⚠️ Too short' : '⚠️ Too long'}
            </Text>
          </Box>

          {/* Keywords Check */}
          <Box>
            <Label size={1}>Keywords</Label>
            {document?.seo?.metaKeywords?.length > 0 ? (
              <Text size={1} muted>
                ✅ {document.seo.metaKeywords.length} keywords defined
              </Text>
            ) : (
              <Text size={1} muted tone="caution">
                ⚠️ No keywords defined
              </Text>
            )}
          </Box>
        </Stack>
      </Stack>
    </Card>
  )
}

// Simple progress bar component
function Progress({ value, tone }: { value: number; tone: 'positive' | 'caution' }) {
  return (
    <div style={{
      width: '100%',
      height: '4px',
      backgroundColor: '#e0e0e0',
      borderRadius: '2px',
      overflow: 'hidden',
      margin: '4px 0'
    }}>
      <div style={{
        width: `${value}%`,
        height: '100%',
        backgroundColor: tone === 'positive' ? '#4caf50' : '#ff9800',
        transition: 'width 0.3s ease'
      }} />
    </div>
  )
}

function Flex({ children, align, gap }: any) {
  return (
    <div style={{
      display: 'flex',
      alignItems: align,
      gap: gap ? `${gap * 4}px` : undefined
    }}>
      {children}
    </div>
  )
}