import React from 'react'
import { Card, Stack, Text, Box, Label, Flex as SanityFlex } from '@sanity/ui'
import { ShareIcon } from '@sanity/icons'

interface SocialMediaPreviewProps {
  document: any
}

export function SocialMediaPreview({ document }: SocialMediaPreviewProps) {
  const title = document?.seo?.metaTitle || document?.title || 'Page Title'
  const description = document?.seo?.metaDescription || document?.excerpt || 'Page description'
  const imageUrl = document?.heroSection?.backgroundImage?.asset?.url ||
                   document?.image?.asset?.url ||
                   '/api/og?title=' + encodeURIComponent(title)

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <SanityFlex align="center" gap={2}>
          <ShareIcon />
          <Text size={2} weight="semibold">Social Media Preview</Text>
        </SanityFlex>

        {/* Facebook Preview */}
        <Stack space={2}>
          <Label size={1}>Facebook</Label>
          <Card padding={0} radius={2} tone="default" border style={{ overflow: 'hidden' }}>
            {/* Image */}
            <div style={{
              width: '100%',
              height: '200px',
              backgroundColor: '#f0f0f0',
              backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
              {!imageUrl && (
                <SanityFlex align="center" justify="center" style={{ height: '100%' }}>
                  <Text size={1} muted>No image set</Text>
                </SanityFlex>
              )}
            </div>
            {/* Content */}
            <Box padding={3}>
              <Text size={1} muted style={{ textTransform: 'uppercase', fontSize: '12px' }}>
                agrikoph.com
              </Text>
              <Text size={2} weight="semibold" style={{ marginTop: '4px' }}>
                {title.substring(0, 65)}{title.length > 65 && '...'}
              </Text>
              <Text size={1} muted style={{ marginTop: '4px', lineHeight: 1.4 }}>
                {description.substring(0, 125)}{description.length > 125 && '...'}
              </Text>
            </Box>
          </Card>
        </Stack>

        {/* Twitter/X Preview */}
        <Stack space={2}>
          <Label size={1}>Twitter/X</Label>
          <Card padding={0} radius={2} tone="default" border style={{ overflow: 'hidden' }}>
            <SanityFlex>
              {/* Image */}
              <div style={{
                width: '120px',
                height: '120px',
                flexShrink: 0,
                backgroundColor: '#f0f0f0',
                backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
                backgroundSize: 'cover',
                backgroundPosition: 'center'
              }}>
                {!imageUrl && (
                  <SanityFlex align="center" justify="center" style={{ height: '100%' }}>
                    <Text size={1} muted>No image</Text>
                  </SanityFlex>
                )}
              </div>
              {/* Content */}
              <Box padding={3} flex={1}>
                <Text size={1} weight="semibold">
                  {title.substring(0, 70)}{title.length > 70 && '...'}
                </Text>
                <Text size={1} muted style={{ marginTop: '4px', lineHeight: 1.3 }}>
                  {description.substring(0, 125)}{description.length > 125 && '...'}
                </Text>
                <Text size={1} muted style={{ marginTop: '4px', fontSize: '12px' }}>
                  agrikoph.com
                </Text>
              </Box>
            </SanityFlex>
          </Card>
        </Stack>

        {/* LinkedIn Preview */}
        <Stack space={2}>
          <Label size={1}>LinkedIn</Label>
          <Card padding={0} radius={2} tone="default" border style={{ overflow: 'hidden' }}>
            {/* Image */}
            <div style={{
              width: '100%',
              height: '150px',
              backgroundColor: '#f0f0f0',
              backgroundImage: imageUrl ? `url(${imageUrl})` : 'none',
              backgroundSize: 'cover',
              backgroundPosition: 'center'
            }}>
              {!imageUrl && (
                <SanityFlex align="center" justify="center" style={{ height: '100%' }}>
                  <Text size={1} muted>No image set</Text>
                </SanityFlex>
              )}
            </div>
            {/* Content */}
            <Box padding={3}>
              <Text size={2} weight="semibold">
                {title.substring(0, 100)}{title.length > 100 && '...'}
              </Text>
              <Text size={1} muted style={{ marginTop: '4px' }}>
                agrikoph.com • 2 min read
              </Text>
            </Box>
          </Card>
        </Stack>
      </Stack>
    </Card>
  )
}

