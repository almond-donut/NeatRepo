import { createServerClient } from '@supabase/ssr'
import { NextResponse } from 'next/server'
import type { NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  try {
    // Check if required environment variables are present
    if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY) {
      console.error('Missing Supabase environment variables')
      return NextResponse.next()
    }

    let res = NextResponse.next({
      request: {
        headers: req.headers,
      },
    })

    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: any) {
            req.cookies.set({
              name,
              value,
              ...options,
            })
            res = NextResponse.next({
              request: {
                headers: req.headers,
              },
            })
            res.cookies.set({
              name,
              value,
              ...options,
            })
          },
          remove(name: string, options: any) {
            req.cookies.set({
              name,
              value: '',
              ...options,
            })
            res = NextResponse.next({
              request: {
                headers: req.headers,
              },
            })
            res.cookies.set({
              name,
              value: '',
              ...options,
            })
          },
        },
      }
    )

    // Refresh session if expired
    const {
      data: { session },
      error
    } = await supabase.auth.getSession()

    if (error) {
      console.error('🚨 MIDDLEWARE: Supabase session error:', error)
      // Continue without session if there's an error
    }

    // Log session status for debugging
    console.log('🔍 MIDDLEWARE: Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      path: req.nextUrl.pathname,
      cookies: req.cookies.getAll().map(c => c.name).join(', ')
    })

    // Protected routes that require authentication
    const protectedRoutes = ['/dashboard', '/profile']
    const isProtectedRoute = protectedRoutes.some(route =>
      req.nextUrl.pathname.startsWith(route)
    )

    // If accessing protected route without session, redirect to home
    // BUT: Allow dashboard access with auth=success parameter (fresh from OAuth callback)
    if (isProtectedRoute && !session) {
      const authSuccess = req.nextUrl.searchParams.get('auth')
      if (authSuccess === 'success' && req.nextUrl.pathname === '/dashboard') {
        console.log('🔄 MIDDLEWARE: Allowing dashboard access with auth=success parameter')
        // Allow access but remove the parameter to clean URL
        const cleanUrl = new URL(req.url)
        cleanUrl.searchParams.delete('auth')
        return NextResponse.redirect(cleanUrl)
      }
      
      const redirectUrl = new URL('/', req.url)
      redirectUrl.searchParams.set('redirected', 'true')
      console.log('🚫 MIDDLEWARE: No session found, redirecting to home')
      return NextResponse.redirect(redirectUrl)
    }

    // Check GitHub connection for protected routes
    if (isProtectedRoute && session) {
      const provider = session.user?.app_metadata?.provider
      const hasGitHubConnection = provider === 'github' || session.user?.user_metadata?.provider === 'github'

      // If user doesn't have GitHub connection, redirect to connect page
      if (!hasGitHubConnection && req.nextUrl.pathname !== '/connect-github') {
        console.log('🔗 MIDDLEWARE: User needs GitHub connection, redirecting...')
        return NextResponse.redirect(new URL('/connect-github', req.url))
      }
    }

    // Allow access to connect-github page for authenticated users
    if (req.nextUrl.pathname === '/connect-github' && !session) {
      return NextResponse.redirect(new URL('/', req.url))
    }

    // If accessing home with session, allow but don't auto-redirect
    // This allows users to visit landing page even when logged in

    return res
  } catch (error) {
    console.error('Middleware error:', error)
    // Return next response if middleware fails
    return NextResponse.next()
  }
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - api (API routes)
     */
    '/((?!_next/static|_next/image|favicon.ico|api).*)',
  ],
}
