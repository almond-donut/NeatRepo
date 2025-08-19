import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function middleware(req: NextRequest) {
  const res = NextResponse.next({
    request: {
      headers: req.headers,
    },
  })

  try {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return req.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            res.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            res.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    // CRITICAL FIX: Skip middleware for dashboard - let client handle auth
    if (req.nextUrl.pathname === '/dashboard') {
      console.log('✅ MIDDLEWARE: Allowing dashboard access - client will handle auth')
      return res
    }

    const {
      data: { session },
      error,
    } = await supabase.auth.getSession()

    if (error) {
      console.error('🚨 MIDDLEWARE: Supabase session error:', error.message)
    }

    const protectedRoutes = ['/profile'] // Remove dashboard from protected routes
    const isProtectedRoute = protectedRoutes.some(route =>
      req.nextUrl.pathname.startsWith(route)
    )

    console.log('🔍 MIDDLEWARE: Session check:', {
      hasSession: !!session,
      userId: session?.user?.id,
      pathname: req.nextUrl.pathname,
      isProtectedRoute,
    })

    // 🔒 CRITICAL FIX: Add session validation to prevent user mixing
    if (session?.user) {
      console.log('🔍 MIDDLEWARE: Validating session for user:', session.user.id);

      // Ensure session has required user properties
      if (!session.user.id || !session.user.email) {
        console.error('🚨 MIDDLEWARE: Invalid session detected - missing user properties');
        // Clear potentially corrupted session
        await supabase.auth.signOut({ scope: 'local' });
        const redirectUrl = req.nextUrl.clone()
        redirectUrl.pathname = '/'
        return NextResponse.redirect(redirectUrl)
      }
    }

    if (isProtectedRoute && !session) {
      console.log(`🚫 MIDDLEWARE: No session, redirecting from protected route ${req.nextUrl.pathname} to home.`)
      const redirectUrl = req.nextUrl.clone()
      redirectUrl.pathname = '/'
      redirectUrl.search = '' // Clear any query params
      return NextResponse.redirect(redirectUrl)
    }

    if (isProtectedRoute && session) {
      const hasGitHubConnection = session.user?.app_metadata?.provider === 'github'
      if (!hasGitHubConnection && req.nextUrl.pathname !== '/connect-github') {
        console.log('🔗 MIDDLEWARE: User needs GitHub connection, redirecting to /connect-github')
        return NextResponse.redirect(new URL('/connect-github', req.url))
      }
    }
    
    if (req.nextUrl.pathname === '/connect-github' && !session) {
      console.log('🚫 MIDDLEWARE: Unauthenticated access to /connect-github, redirecting to home.')
      return NextResponse.redirect(new URL('/', req.url))
    }

    return res
  } catch (e) {
    console.error('❌ MIDDLEWARE: Unhandled error:', e)
    // If an error occurs, just pass the request through
    return NextResponse.next({
      request: {
        headers: req.headers,
      },
    })
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
