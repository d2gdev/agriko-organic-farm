import React, { useState } from 'react'
import { Card, Stack, Text, Button, Badge, Box, Grid, Flex as SanityFlex } from '@sanity/ui'
import { ImageIcon, DownloadIcon, WarningOutlineIcon } from '@sanity/icons'

interface ImageOptimizerProps {
  document: any
}

interface ImageAnalysis {
  field: string
  originalSize: number
  optimizedSize: number
  savings: number
  format: string
  dimensions: { width: number; height: number }
  recommendations: string[]
}

export function ImageOptimizer({ document }: ImageOptimizerProps) {
  const [images, setImages] = useState<ImageAnalysis[]>([])
  const [isAnalyzing, setIsAnalyzing] = useState(false)

  const formatBytes = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  const analyzeImages = () => {
    setIsAnalyzing(true)

    // Simulate image analysis
    setTimeout(() => {
      const mockImages: ImageAnalysis[] = []

      // Check hero image
      if (document?.heroSection?.backgroundImage) {
        mockImages.push({
          field: 'Hero Background',
          originalSize: 2500000, // 2.5MB
          optimizedSize: 450000, // 450KB
          savings: 82,
          format: 'PNG',
          dimensions: { width: 1920, height: 1080 },
          recommendations: [
            'Convert to WebP format',
            'Reduce to 1600px width for web',
            'Add lazy loading'
          ]
        })
      }

      // Check main image
      if (document?.image) {
        mockImages.push({
          field: 'Featured Image',
          originalSize: 1800000, // 1.8MB
          optimizedSize: 320000, // 320KB
          savings: 82,
          format: 'JPEG',
          dimensions: { width: 2400, height: 1600 },
          recommendations: [
            'Compress quality to 85%',
            'Generate responsive sizes',
            'Add alt text for SEO'
          ]
        })
      }

      // Check gallery images
      if (document?.gallery?.length > 0) {
        document.gallery.slice(0, 3).forEach((img: any, index: number) => {
          mockImages.push({
            field: `Gallery Image ${index + 1}`,
            originalSize: Math.random() * 3000000 + 500000,
            optimizedSize: Math.random() * 500000 + 100000,
            savings: Math.floor(Math.random() * 40 + 60),
            format: (['JPEG', 'PNG', 'GIF'] as const)[Math.floor(Math.random() * 3)]!,
            dimensions: {
              width: Math.floor(Math.random() * 1000 + 1000),
              height: Math.floor(Math.random() * 1000 + 800)
            },
            recommendations: [
              'Optimize file size',
              'Use next-gen formats',
              'Implement CDN delivery'
            ]
          })
        })
      }

      setImages(mockImages)
      setIsAnalyzing(false)
    }, 1500)
  }

  const getTotalSavings = () => {
    const totalOriginal = images.reduce((sum, img) => sum + img.originalSize, 0)
    const totalOptimized = images.reduce((sum, img) => sum + img.optimizedSize, 0)
    const savedBytes = totalOriginal - totalOptimized
    return {
      original: formatBytes(totalOriginal),
      optimized: formatBytes(totalOptimized),
      saved: formatBytes(savedBytes),
      percentage: totalOriginal > 0 ? Math.round((savedBytes / totalOriginal) * 100) : 0
    }
  }

  const savings = getTotalSavings()

  return (
    <Card padding={4} radius={2} shadow={1}>
      <Stack space={4}>
        <SanityFlex align="center" justify="space-between">
          <SanityFlex align="center" gap={2}>
            <ImageIcon />
            <Text size={2} weight="semibold">Image Optimizer</Text>
          </SanityFlex>
          <Button
            fontSize={1}
            icon={ImageIcon}
            mode="ghost"
            onClick={analyzeImages}
            loading={isAnalyzing}
            text="Analyze Images"
          />
        </SanityFlex>

        {images.length > 0 && (
          <>
            {/* Summary Card */}
            <Card padding={3} radius={2} tone="positive" border>
              <Stack space={3}>
                <Text size={1} weight="semibold">Optimization Summary</Text>
                <Grid columns={[1, 1, 2, 2]} gap={3}>
                  <Stack space={1}>
                    <Text size={1} muted>Current Size</Text>
                    <Text size={2} weight="semibold">{savings.original}</Text>
                  </Stack>
                  <Stack space={1}>
                    <Text size={1} muted>Optimized Size</Text>
                    <Text size={2} weight="semibold">{savings.optimized}</Text>
                  </Stack>
                  <Stack space={1}>
                    <Text size={1} muted>Total Savings</Text>
                    <Text size={2} weight="semibold" style={{ color: '#4caf50' }}>
                      {savings.saved} ({savings.percentage}%)
                    </Text>
                  </Stack>
                  <Stack space={1}>
                    <Text size={1} muted>Images Found</Text>
                    <Text size={2} weight="semibold">{images.length}</Text>
                  </Stack>
                </Grid>
              </Stack>
            </Card>

            {/* Individual Image Analysis */}
            <Stack space={2}>
              {images.map((image, index) => (
                <Card key={index} padding={3} radius={2} tone="default" border>
                  <Stack space={3}>
                    <SanityFlex align="center" justify="space-between">
                      <Text size={1} weight="semibold">{image.field}</Text>
                      <Badge tone={image.savings > 70 ? 'critical' : image.savings > 40 ? 'caution' : 'positive'}>
                        {image.savings}% reduction possible
                      </Badge>
                    </SanityFlex>

                    <Grid columns={[1, 1, 3, 3]} gap={2}>
                      <Stack space={1}>
                        <Text size={1} muted>Format</Text>
                        <Text size={1}>{image.format}</Text>
                      </Stack>
                      <Stack space={1}>
                        <Text size={1} muted>Dimensions</Text>
                        <Text size={1}>{image.dimensions.width} × {image.dimensions.height}</Text>
                      </Stack>
                      <Stack space={1}>
                        <Text size={1} muted>Size Reduction</Text>
                        <Text size={1}>
                          {formatBytes(image.originalSize)} → {formatBytes(image.optimizedSize)}
                        </Text>
                      </Stack>
                    </Grid>

                    {image.recommendations.length > 0 && (
                      <Box>
                        <Text size={1} muted weight="semibold">Recommendations:</Text>
                        <Stack space={1} marginTop={2}>
                          {image.recommendations.map((rec, i) => (
                            <SanityFlex key={i} align="center" gap={2}>
                              <Text size={1}>• {rec}</Text>
                            </SanityFlex>
                          ))}
                        </Stack>
                      </Box>
                    )}

                    <SanityFlex gap={2}>
                      <Button fontSize={1} text="Optimize" tone="primary" />
                      <Button fontSize={1} text="Download Optimized" mode="ghost" icon={DownloadIcon} />
                    </SanityFlex>
                  </Stack>
                </Card>
              ))}
            </Stack>

            {/* Optimization Tips */}
            <Card padding={3} radius={2} tone="primary" border>
              <Stack space={2}>
                <Text size={1} weight="semibold">💡 Optimization Best Practices</Text>
                <Stack space={1}>
                  <Text size={1}>• Use WebP format for 25-35% better compression than JPEG</Text>
                  <Text size={1}>• Implement responsive images with srcset</Text>
                  <Text size={1}>• Lazy load images below the fold</Text>
                  <Text size={1}>• Use a CDN for faster global delivery</Text>
                  <Text size={1}>• Compress images to 85% quality for web</Text>
                </Stack>
              </Stack>
            </Card>
          </>
        )}

        {images.length === 0 && !isAnalyzing && (
          <Card padding={3} tone="transparent" border>
            <Stack space={2}>
              <div style={{textAlign: 'center'}}>
                <WarningOutlineIcon />
              </div>
              <Text size={1} muted style={{textAlign: 'center'}}>
                Click "Analyze Images" to scan document for optimization opportunities
              </Text>
            </Stack>
          </Card>
        )}
      </Stack>
    </Card>
  )
}

