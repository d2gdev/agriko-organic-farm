import { NextRequest, NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'

export async function GET(request: NextRequest) {
  try {
    // Get the pathname from the URL
    const url = new URL(request.url)
    const pathname = url.pathname.replace('/api/studio-static', '')

    // Default to index.html if no path
    const filePath = pathname === '' || pathname === '/'
      ? 'index.html'
      : pathname.startsWith('/') ? pathname.slice(1) : pathname

    // Build the full path to the studio dist folder
    const fullPath = path.join(process.cwd(), 'dist', filePath)

    // Check if file exists
    if (!fs.existsSync(fullPath)) {
      // If it's a route without extension, try to serve index.html
      const indexPath = path.join(process.cwd(), 'dist', 'index.html')
      if (fs.existsSync(indexPath)) {
        const content = fs.readFileSync(indexPath)
        return new NextResponse(content, {
          headers: {
            'Content-Type': 'text/html; charset=utf-8',
          },
        })
      }
      return NextResponse.json({ error: 'File not found' }, { status: 404 })
    }

    // Read the file
    const content = fs.readFileSync(fullPath)

    // Determine content type
    let contentType = 'text/plain'
    if (filePath.endsWith('.html')) contentType = 'text/html; charset=utf-8'
    else if (filePath.endsWith('.js')) contentType = 'application/javascript'
    else if (filePath.endsWith('.css')) contentType = 'text/css'
    else if (filePath.endsWith('.json')) contentType = 'application/json'
    else if (filePath.endsWith('.svg')) contentType = 'image/svg+xml'
    else if (filePath.endsWith('.png')) contentType = 'image/png'
    else if (filePath.endsWith('.jpg') || filePath.endsWith('.jpeg')) contentType = 'image/jpeg'
    else if (filePath.endsWith('.gif')) contentType = 'image/gif'
    else if (filePath.endsWith('.woff')) contentType = 'font/woff'
    else if (filePath.endsWith('.woff2')) contentType = 'font/woff2'
    else if (filePath.endsWith('.ttf')) contentType = 'font/ttf'
    else if (filePath.endsWith('.eot')) contentType = 'application/vnd.ms-fontobject'

    return new NextResponse(content, {
      headers: {
        'Content-Type': contentType,
        'Cache-Control': 'public, max-age=31536000, immutable',
      },
    })
  } catch (error) {
    console.error('Error serving studio file:', error)
    return NextResponse.json({ error: 'Internal server error' }, { status: 500 })
  }
}