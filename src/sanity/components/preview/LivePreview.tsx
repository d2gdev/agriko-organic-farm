import React, { useState, useEffect } from 'react'
import { Card, Stack, Text, Button, Flex } from '@sanity/ui'
import { EyeOpenIcon, RefreshIcon } from '@sanity/icons'

interface LivePreviewProps {
  document: any
  schemaType: any
}

export function LivePreview({ document, schemaType }: LivePreviewProps) {
  const [previewUrl, setPreviewUrl] = useState('')
  const [isLoading, setIsLoading] = useState(false)

  useEffect(() => {
    if (document?.slug?.current) {
      // Build preview URL based on document type
      const baseUrl = process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'

      switch (schemaType.name) {
        case 'blogPost':
          setPreviewUrl(`${baseUrl}/blog/${document.slug.current}?preview=true`)
          break
        case 'page':
          setPreviewUrl(`${baseUrl}/${document.slug.current}?preview=true`)
          break
        case 'product':
          setPreviewUrl(`${baseUrl}/product/${document.slug.current}?preview=true`)
          break
        default:
          setPreviewUrl('')
      }
    }
  }, [document, schemaType])

  const handleRefresh = () => {
    setIsLoading(true)
    // Force iframe refresh
    const iframe = document.getElementById('preview-iframe') as HTMLIFrameElement
    if (iframe) {
      iframe.src = iframe.src
    }
    setTimeout(() => setIsLoading(false), 1000)
  }

  if (!previewUrl) {
    return (
      <Card padding={4} radius={2} shadow={1}>
        <Stack space={3}>
          <Text size={1} muted>
            Save document with a slug to see preview
          </Text>
        </Stack>
      </Card>
    )
  }

  return (
    <Card padding={0} radius={2} shadow={1} style={{ height: '600px' }}>
      <Flex direction="column" style={{ height: '100%' }}>
        <Card padding={2} borderBottom>
          <Flex align="center" gap={2}>
            <EyeOpenIcon />
            <Text size={1} weight="semibold">Live Preview</Text>
            <Button
              fontSize={1}
              icon={RefreshIcon}
              mode="ghost"
              onClick={handleRefresh}
              loading={isLoading}
              text="Refresh"
              style={{ marginLeft: 'auto' }}
            />
          </Flex>
        </Card>
        <iframe
          id="preview-iframe"
          src={previewUrl}
          style={{
            width: '100%',
            flex: 1,
            border: 'none',
            background: '#fff'
          }}
          title="Content Preview"
        />
      </Flex>
    </Card>
  )
}