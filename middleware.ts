import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export function middleware(request: NextRequest) {
  const response = NextResponse.next()
  
  // Allow unsafe-eval for workflow builder in development
  if (request.nextUrl.pathname.startsWith('/app')) {
    const isDev = process.env.NODE_ENV === 'development'
    response.headers.set(
      'Content-Security-Policy',
      isDev 
        ? "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
        : "default-src 'self'; script-src 'self' 'unsafe-inline'; style-src 'self' 'unsafe-inline';"
    )
  }
  
  // Skip middleware for API routes and static files
  if (request.nextUrl.pathname.startsWith('/api') || 
      request.nextUrl.pathname.startsWith('/_next') ||
      request.nextUrl.pathname.startsWith('/favicon')) {
    return response
  }

  // Skip middleware for auth pages to allow OAuth redirects
  if (request.nextUrl.pathname.startsWith('/auth/')) {
    return response
  }

  // Protect dashboard routes - require authentication
  if (request.nextUrl.pathname.startsWith('/dashboard')) {
    const sessionToken = request.cookies.get('next-auth.session-token')
    
    if (!sessionToken) {
      // Redirect to signin if not authenticated
      const signinUrl = new URL('/auth/signin', request.url)
      signinUrl.searchParams.set('callbackUrl', request.url)
      return NextResponse.redirect(signinUrl)
    }
  }

  // Password protection for production deployment
  if (process.env.NODE_ENV === 'production') {
    // Check if user is authenticated via NextAuth session cookie
    const sessionToken = request.cookies.get('next-auth.session-token')
    
    // If user has valid session, allow access
    if (sessionToken) {
      return response
    }

    // Otherwise, check for basic auth
    const authHeader = request.headers.get('authorization')
    const expectedPassword = process.env.APP_PASSWORD || 'flowviber2025'
    
    if (!authHeader) {
      return new NextResponse('Authentication required', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Flow Viber"',
        },
      })
    }

    const base64Credentials = authHeader.split(' ')[1]
    if (!base64Credentials) {
      return new NextResponse('Invalid credentials format', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Flow Viber"',
        },
      })
    }

    const credentials = Buffer.from(base64Credentials, 'base64').toString('ascii')
    const [username, password] = credentials.split(':')

    if (password !== expectedPassword) {
      return new NextResponse('Invalid password', {
        status: 401,
        headers: {
          'WWW-Authenticate': 'Basic realm="Flow Viber"',
        },
      })
    }
  }

  return response
}

export const config = {
  matcher: ['/((?!api|_next|favicon).*)'],
}