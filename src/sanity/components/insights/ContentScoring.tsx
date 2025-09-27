import React, { useMemo } from 'react'
import { Card, Stack, Text, Badge, Box, Grid } from '@sanity/ui'
import { CheckmarkCircleIcon, WarningOutlineIcon, ClockIcon } from '@sanity/icons'

interface ContentScoringProps {
  document: any
  schemaType: any
}

export function ContentScoring({ document, schemaType }: ContentScoringProps) {
  const score = useMemo(() => {
    let totalScore = 0
    let maxScore = 0
    const checks: any[] = []

    // Basic content checks
    if (document?.title) {
      const titleLength = document.title.length
      if (titleLength >= 20 && titleLength <= 60) {
        totalScore += 10
        checks.push({ name: 'Title length', status: 'pass', points: 10 })
      } else {
        checks.push({ name: 'Title length', status: 'fail', points: 0, message: 'Should be 20-60 characters' })
      }
      maxScore += 10
    }

    // Content length check
    if (document?.content) {
      const contentText = extractTextFromPortableText(document.content)
      const wordCount = contentText.split(' ').filter(word => word.length > 0).length

      if (wordCount >= 300) {
        totalScore += 20
        checks.push({ name: 'Content length', status: 'pass', points: 20, message: `${wordCount} words` })
      } else {
        checks.push({ name: 'Content length', status: 'fail', points: 0, message: `${wordCount} words (minimum 300)` })
      }
      maxScore += 20

      // Reading time
      const readingTime = Math.ceil(wordCount / 200) // Average reading speed
      checks.push({ name: 'Reading time', status: 'info', message: `~${readingTime} min read` })
    }

    // SEO checks
    if (document?.seo?.metaDescription) {
      const descLength = document.seo.metaDescription.length
      if (descLength >= 120 && descLength <= 160) {
        totalScore += 10
        checks.push({ name: 'Meta description', status: 'pass', points: 10 })
      } else {
        checks.push({ name: 'Meta description', status: 'fail', points: 0, message: 'Should be 120-160 characters' })
      }
    } else {
      checks.push({ name: 'Meta description', status: 'fail', points: 0, message: 'Missing' })
    }
    maxScore += 10

    // Image check
    if (document?.heroSection?.backgroundImage || document?.image) {
      totalScore += 10
      checks.push({ name: 'Featured image', status: 'pass', points: 10 })
    } else {
      checks.push({ name: 'Featured image', status: 'fail', points: 0, message: 'No image' })
    }
    maxScore += 10

    // Keywords check
    if (document?.seo?.metaKeywords?.length > 0) {
      totalScore += 10
      checks.push({ name: 'Keywords', status: 'pass', points: 10, message: `${document.seo.metaKeywords.length} keywords` })
    } else {
      checks.push({ name: 'Keywords', status: 'fail', points: 0, message: 'No keywords' })
    }
    maxScore += 10

    // Slug check
    if (document?.slug?.current) {
      totalScore += 5
      checks.push({ name: 'URL slug', status: 'pass', points: 5 })
    } else {
      checks.push({ name: 'URL slug', status: 'fail', points: 0, message: 'Missing' })
    }
    maxScore += 5

    // Internal links check (bonus)
    if (document?.content) {
      const hasLinks = checkForLinks(document.content)
      if (hasLinks) {
        totalScore += 5
        checks.push({ name: 'Internal links', status: 'pass', points: 5 })
      } else {
        checks.push({ name: 'Internal links', status: 'warning', points: 0, message: 'Consider adding links' })
      }
      maxScore += 5
    }

    const percentage = maxScore > 0 ? Math.round((totalScore / maxScore) * 100) : 0

    return {
      total: totalScore,
      max: maxScore,
      percentage,
      checks,
      grade: getGrade(percentage)
    }
  }, [document, schemaType])

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Text size={2} weight="semibold">Content Quality Score</Text>
          <Badge tone={getScoreTone(score.percentage)} fontSize={1}>
            {score.grade}
          </Badge>
        </div>

        {/* Score Circle */}
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            width: '120px',
            height: '120px',
            borderRadius: '50%',
            background: `conic-gradient(${getScoreColor(score.percentage)} ${score.percentage}%, #e0e0e0 ${score.percentage}%)`,
            position: 'relative'
          }}>
            <div style={{
              position: 'absolute',
              width: '100px',
              height: '100px',
              borderRadius: '50%',
              background: 'white',
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              <Text size={4} weight="bold">
                {score.percentage}%
              </Text>
              <Text size={1} muted>
                {score.total}/{score.max} points
              </Text>
            </div>
          </div>
        </div>

        {/* Detailed Checks */}
        <Stack space={2}>
          <Text size={1} weight="semibold" muted>Content Analysis</Text>
          {score.checks.map((check, index) => (
            <div key={index} style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              padding: '8px',
              backgroundColor: '#f5f5f5',
              borderRadius: '4px'
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                {check.status === 'pass' ? (
                  <CheckmarkCircleIcon style={{ color: '#4caf50' }} />
                ) : check.status === 'warning' ? (
                  <WarningOutlineIcon style={{ color: '#ff9800' }} />
                ) : check.status === 'info' ? (
                  <ClockIcon style={{ color: '#2196f3' }} />
                ) : (
                  <WarningOutlineIcon style={{ color: '#f44336' }} />
                )}
                <Text size={1}>{check.name}</Text>
              </div>
              <Text size={1} muted>
                {check.message || (check.points !== undefined ? `+${check.points}` : '')}
              </Text>
            </div>
          ))}
        </Stack>

        {/* Recommendations */}
        {score.percentage < 80 && (
          <Card padding={3} radius={2} tone="primary" border>
            <Stack space={2}>
              <Text size={1} weight="semibold">💡 Recommendations</Text>
              {score.checks
                .filter(c => c.status === 'fail' || c.status === 'warning')
                .map((check, index) => (
                  <Text key={index} size={1}>
                    • {check.name}: {check.message}
                  </Text>
                ))}
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  )
}

function extractTextFromPortableText(blocks: any[]): string {
  if (!blocks) return ''
  return blocks
    .filter(block => block._type === 'block')
    .map(block => block.children?.map((child: any) => child.text).join(' ') || '')
    .join(' ')
}

function checkForLinks(content: any[]): boolean {
  if (!content) return false
  return content.some(block =>
    block.children?.some((child: any) =>
      child.marks?.some((mark: string) => mark.includes('link'))
    )
  )
}

function getGrade(percentage: number): string {
  if (percentage >= 90) return 'A+'
  if (percentage >= 80) return 'A'
  if (percentage >= 70) return 'B'
  if (percentage >= 60) return 'C'
  if (percentage >= 50) return 'D'
  return 'F'
}

function getScoreTone(percentage: number): string {
  if (percentage >= 80) return 'positive'
  if (percentage >= 60) return 'caution'
  return 'critical'
}

function getScoreColor(percentage: number): string {
  if (percentage >= 80) return '#4caf50'
  if (percentage >= 60) return '#ff9800'
  return '#f44336'
}