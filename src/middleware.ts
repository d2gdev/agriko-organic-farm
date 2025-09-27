import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const path = request.nextUrl.pathname

  // Rewrite /static/* requests to /api/studio-static/static/*
  if (path.startsWith('/static/')) {
    const newPath = `/api/studio-static${path}`
    return NextResponse.rewrite(new URL(newPath, request.url))
  }

  // Redirect /blogPost and other schema routes to studio
  if (path === '/blogPost' || path === '/page' || path === '/siteSettings') {
    return NextResponse.redirect(new URL('/studio', request.url))
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    '/static/:path*',
    '/blogPost',
    '/page',
    '/siteSettings'
  ]
}