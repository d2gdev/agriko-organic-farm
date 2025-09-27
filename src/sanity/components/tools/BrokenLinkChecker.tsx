import React, { useState, useEffect } from 'react'
import { Card, Stack, Text, Button, Badge, Box, Spinner, Flex as SanityFlex } from '@sanity/ui'
import { ErrorOutlineIcon, CheckmarkCircleIcon, WarningOutlineIcon, RefreshIcon } from '@sanity/icons'

interface BrokenLinkCheckerProps {
  document: any
}

interface LinkCheckResult {
  url: string
  status: 'ok' | 'broken' | 'warning' | 'checking'
  statusCode?: number
  message?: string
  location: string
}

export function BrokenLinkChecker({ document }: BrokenLinkCheckerProps) {
  const [links, setLinks] = useState<LinkCheckResult[]>([])
  const [isChecking, setIsChecking] = useState(false)
  const [lastChecked, setLastChecked] = useState<Date | null>(null)

  const extractLinks = (content: any): string[] => {
    const foundLinks: string[] = []

    // Extract from portable text content
    if (Array.isArray(content)) {
      content.forEach(block => {
        if (block._type === 'block' && block.children) {
          block.children.forEach((child: any) => {
            if (child.marks?.includes('link') && child.href) {
              foundLinks.push(child.href)
            }
          })
        }
      })
    }

    // Extract from SEO fields
    if (document?.seo?.canonicalUrl) {
      foundLinks.push(document.seo.canonicalUrl)
    }

    // Extract from any URL fields
    const findUrlsInObject = (obj: any): void => {
      if (!obj || typeof obj !== 'object') return

      Object.entries(obj).forEach(([key, value]) => {
        if (typeof value === 'string' && (value.startsWith('http://') || value.startsWith('https://'))) {
          foundLinks.push(value)
        } else if (typeof value === 'object') {
          findUrlsInObject(value)
        }
      })
    }

    findUrlsInObject(document)

    // Remove duplicates
    return Array.from(new Set(foundLinks))
  }

  const checkLink = async (url: string, location: string): Promise<LinkCheckResult> => {
    // Simulate link checking
    // In production, this would make an actual HTTP request
    await new Promise(resolve => setTimeout(resolve, Math.random() * 500 + 200))

    const random = Math.random()

    if (random < 0.7) {
      return {
        url,
        status: 'ok',
        statusCode: 200,
        location,
        message: 'Link is working'
      }
    } else if (random < 0.85) {
      return {
        url,
        status: 'broken',
        statusCode: 404,
        location,
        message: 'Page not found'
      }
    } else {
      return {
        url,
        status: 'warning',
        statusCode: 301,
        location,
        message: 'Redirect detected'
      }
    }
  }

  const checkAllLinks = async () => {
    setIsChecking(true)
    const extractedLinks = extractLinks(document?.content)

    // Set all links to checking state
    const initialLinks: LinkCheckResult[] = extractedLinks.map(url => ({
      url,
      status: 'checking',
      location: 'Content'
    }))
    setLinks(initialLinks)

    // Check each link
    const results: LinkCheckResult[] = []
    for (const link of extractedLinks) {
      const result = await checkLink(link, 'Content')
      results.push(result)
      setLinks([...results, ...initialLinks.slice(results.length)])
    }

    setLastChecked(new Date())
    setIsChecking(false)
  }

  useEffect(() => {
    if (document) {
      checkAllLinks()
    }
  }, [document])

  const getStatusIcon = (status: string) => {
    switch(status) {
      case 'ok': return <CheckmarkCircleIcon style={{ color: '#4caf50' }} />
      case 'broken': return <ErrorOutlineIcon style={{ color: '#f44336' }} />
      case 'warning': return <WarningOutlineIcon style={{ color: '#ff9800' }} />
      case 'checking': return <Spinner />
      default: return null
    }
  }

  const getStatusTone = (status: string) => {
    switch(status) {
      case 'ok': return 'positive'
      case 'broken': return 'critical'
      case 'warning': return 'caution'
      default: return 'default'
    }
  }

  const brokenCount = links.filter(l => l.status === 'broken').length
  const warningCount = links.filter(l => l.status === 'warning').length
  const okCount = links.filter(l => l.status === 'ok').length

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <SanityFlex align="center" justify="space-between">
          <SanityFlex align="center" gap={2}>
            <ErrorOutlineIcon />
            <Text size={2} weight="semibold">Broken Link Checker</Text>
          </SanityFlex>
          <Button
            fontSize={1}
            icon={RefreshIcon}
            mode="ghost"
            onClick={checkAllLinks}
            loading={isChecking}
            text="Check Links"
          />
        </SanityFlex>

        {/* Summary Stats */}
        <SanityFlex gap={3}>
          <Card padding={2} tone="positive" border>
            <Stack space={1}>
              <Text size={3} weight="semibold" style={{textAlign: 'center'}}>{okCount}</Text>
              <Text size={1} style={{textAlign: 'center'}}>Working</Text>
            </Stack>
          </Card>
          <Card padding={2} tone="critical" border>
            <Stack space={1}>
              <Text size={3} weight="semibold" style={{textAlign: 'center'}}>{brokenCount}</Text>
              <Text size={1} style={{textAlign: 'center'}}>Broken</Text>
            </Stack>
          </Card>
          <Card padding={2} tone="caution" border>
            <Stack space={1}>
              <Text size={3} weight="semibold" style={{textAlign: 'center'}}>{warningCount}</Text>
              <Text size={1} style={{textAlign: 'center'}}>Warnings</Text>
            </Stack>
          </Card>
        </SanityFlex>

        {/* Link List */}
        {links.length === 0 ? (
          <Card padding={3} tone="transparent" border>
            <Text size={1} muted style={{textAlign: 'center'}}>
              No links found in document
            </Text>
          </Card>
        ) : (
          <Stack space={2}>
            {links.map((link, index) => (
              <Card key={index} padding={3} radius={2} tone="default" border>
                <SanityFlex align="center" gap={3}>
                  {getStatusIcon(link.status)}
                  <Stack space={1} flex={1}>
                    <Text size={1} style={{ wordBreak: 'break-all' }}>
                      {link.url}
                    </Text>
                    <SanityFlex align="center" gap={2}>
                      <Badge tone={getStatusTone(link.status)} fontSize={0}>
                        {link.statusCode || link.status}
                      </Badge>
                      <Text size={1} muted>
                        {link.message}
                      </Text>
                      <Text size={1} muted>
                        • {link.location}
                      </Text>
                    </SanityFlex>
                  </Stack>
                  {link.status === 'broken' && (
                    <Button fontSize={1} mode="ghost" text="Fix" tone="critical" />
                  )}
                </SanityFlex>
              </Card>
            ))}
          </Stack>
        )}

        {lastChecked && (
          <Text size={1} muted style={{textAlign: 'center'}}>
            Last checked: {lastChecked.toLocaleTimeString()}
          </Text>
        )}

        {/* Tips */}
        {brokenCount > 0 && (
          <Card padding={3} radius={2} tone="critical" border>
            <Stack space={2}>
              <Text size={1} weight="semibold">⚠️ Action Required</Text>
              <Text size={1}>
                You have {brokenCount} broken link{brokenCount !== 1 ? 's' : ''} that should be fixed.
                Broken links hurt SEO and user experience.
              </Text>
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  )
}

