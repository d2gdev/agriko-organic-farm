import React, { useMemo } from 'react'
import { Card, Stack, Text, Badge } from '@sanity/ui'
import { CheckmarkCircleIcon, WarningOutlineIcon, ClockIcon } from '@sanity/icons'

interface SanityDocument {
  _id?: string;
  _type?: string;
  title?: string;
  slug?: {
    current?: string;
  };
  excerpt?: string;
  body?: unknown[];
  content?: unknown;
  seo?: {
    title?: string;
    description?: string;
    metaDescription?: string;
    keywords?: string[];
    metaKeywords?: string[];
  };
  mainImage?: unknown;
  images?: unknown[];
  backgroundImage?: unknown;
  [key: string]: unknown;
}

interface SchemaType {
  name: string;
  title?: string;
  [key: string]: unknown;
}

interface ContentCheck {
  name: string;
  passed: boolean;
  score: number;
  maxScore: number;
  message: string;
  status?: 'pass' | 'warning' | 'fail' | 'info';
  points?: number;
}

interface ContentScoringProps {
  document: SanityDocument
  schemaType: SchemaType
}

export function ContentScoring({ document, schemaType }: ContentScoringProps) {
  const score = useMemo(() => {
    let totalScore = 0
    let maxScore = 0
    const checks: ContentCheck[] = []

    // Helper to create check objects
    const addCheck = (
      name: string,
      passed: boolean,
      points: number,
      maxPoints: number,
      message?: string
    ) => {
      checks.push({
        name,
        passed,
        score: passed ? points : 0,
        maxScore: maxPoints,
        message: message || (passed ? 'Pass' : 'Fail'),
        status: passed ? 'pass' : 'fail',
        points: passed ? points : 0
      })
      if (passed) totalScore += points
      maxScore += maxPoints
    }

    // Basic content checks
    if (document?.title) {
      const titleLength = document.title.length
      const titlePassed = titleLength >= 20 && titleLength <= 60
      addCheck(
        'Title length',
        titlePassed,
        10,
        10,
        titlePassed ? `${titleLength} characters` : `${titleLength} chars (should be 20-60)`
      )
    }

    // Content length check
    if (document?.content) {
      const contentText = extractTextFromPortableText(document.content)
      const wordCount = contentText.split(' ').filter(word => word.length > 0).length

      const contentPassed = wordCount >= 300
      addCheck(
        'Content length',
        contentPassed,
        20,
        20,
        contentPassed ? `${wordCount} words` : `${wordCount} words (minimum 300)`
      )

      // Reading time (info check - not scored)
      const readingTime = Math.ceil(wordCount / 200) // Average reading speed
      checks.push({
        name: 'Reading time',
        passed: true,
        score: 0,
        maxScore: 0,
        message: `~${readingTime} min read`,
        status: 'info',
        points: 0
      })
    }

    // SEO checks
    if (document?.seo?.metaDescription) {
      const descLength = document.seo.metaDescription.length
      const seoPassed = descLength >= 120 && descLength <= 160
      addCheck(
        'Meta description',
        seoPassed,
        10,
        10,
        seoPassed ? `${descLength} characters` : `${descLength} chars (should be 120-160)`
      )
    } else {
      addCheck('Meta description', false, 0, 10, 'Missing')
    }

    // Image check
    const hasImage = !!(document?.backgroundImage || document?.mainImage || document?.images?.length)
    addCheck(
      'Featured image',
      hasImage,
      10,
      10,
      hasImage ? 'Present' : 'No image'
    )

    // Keywords check
    const hasKeywords = (document?.seo?.metaKeywords?.length ?? 0) > 0
    addCheck(
      'Keywords',
      hasKeywords,
      10,
      10,
      hasKeywords ? `${document?.seo?.metaKeywords?.length} keywords` : 'No keywords'
    )

    // Slug check
    const hasSlug = !!document?.slug?.current
    addCheck(
      'URL slug',
      hasSlug,
      5,
      5,
      hasSlug ? 'Present' : 'Missing'
    )

    // Internal links check (bonus)
    if (document?.content) {
      const hasLinks = checkForLinks(document.content)
      if (hasLinks) {
        addCheck('Internal links', true, 5, 5, 'Has links')
      } else {
        // Warning state - still track but don't score
        checks.push({
          name: 'Internal links',
          passed: false,
          score: 0,
          maxScore: 5,
          message: 'Consider adding links',
          status: 'warning',
          points: 0
        })
        maxScore += 5
      }
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

interface PortableTextChild {
  _type?: string;
  text?: string;
  marks?: string[];
  [key: string]: unknown;
}

interface PortableTextBlock {
  _type: string;
  children?: PortableTextChild[];
  [key: string]: unknown;
}

function extractTextFromPortableText(blocks: unknown): string {
  if (!blocks || !Array.isArray(blocks)) return ''
  const typedBlocks = blocks as PortableTextBlock[]
  return typedBlocks
    .filter(block => block._type === 'block')
    .map(block => block.children?.map((child) => child.text || '').join(' ') || '')
    .join(' ')
}

function checkForLinks(content: unknown): boolean {
  if (!content || !Array.isArray(content)) return false
  const typedContent = content as PortableTextBlock[]
  return typedContent.some(block =>
    block.children?.some((child) =>
      child.marks?.some((mark) => mark.includes('link'))
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

function getScoreTone(percentage: number): "positive" | "caution" | "critical" {
  if (percentage >= 80) return 'positive'
  if (percentage >= 60) return 'caution'
  return 'critical'
}

function getScoreColor(percentage: number): string {
  if (percentage >= 80) return '#4caf50'
  if (percentage >= 60) return '#ff9800'
  return '#f44336'
}