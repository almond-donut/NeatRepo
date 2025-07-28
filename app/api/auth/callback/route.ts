import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  console.log('🚀 AUTH CALLBACK: Starting OAuth callback processing')

  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  let next = searchParams.get('next') ?? '/dashboard'
  if (!next.startsWith('/')) {
    // if "next" is not a relative URL, use the default
    next = '/dashboard'
  }

  console.log('🔍 AUTH CALLBACK: Received params:', {
    hasCode: !!code,
    next,
    origin
  })

  if (code) {
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // This will be handled by the redirect response
          },
          remove(name: string, options: CookieOptions) {
            // This will be handled by the redirect response
          },
        },
      }
    )

    console.log('🔄 AUTH CALLBACK: Exchanging code for session...')
    console.log('🔍 AUTH CALLBACK: Environment check:', {
      supabaseUrl: process.env.NEXT_PUBLIC_SUPABASE_URL?.substring(0, 30) + '...',
      hasAnonKey: !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
      nodeEnv: process.env.NODE_ENV,
      origin,
      next
    })

    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    console.log('🔍 AUTH CALLBACK: Exchange result:', {
      hasData: !!data,
      hasSession: !!data?.session,
      hasUser: !!data?.user,
      error: error ? {
        message: error.message,
        status: error.status,
        name: error.name
      } : null
    })

    if (!error && data?.session) {
      console.log('✅ AUTH CALLBACK: Successfully exchanged code for session')
      console.log('🔍 AUTH CALLBACK: Session details:', {
        userId: data.user?.id,
        email: data.user?.email,
        provider: data.user?.app_metadata?.provider,
        hasProviderToken: !!data.session.provider_token
      })

      const forwardedHost = request.headers.get('x-forwarded-host') // original origin before load balancer
      const isLocalEnv = process.env.NODE_ENV === 'development'
      if (isLocalEnv) {
        // we can be sure that there is no load balancer in between, so no need to watch for X-Forwarded-Host
        return NextResponse.redirect(`${origin}${next}`)
      } else if (forwardedHost) {
        return NextResponse.redirect(`https://${forwardedHost}${next}`)
      } else {
        return NextResponse.redirect(`${origin}${next}`)
      }
    } else {
      console.error('❌ AUTH CALLBACK: Error exchanging code for session:', error)
      console.error('❌ AUTH CALLBACK: Full error details:', {
        error,
        hasData: !!data,
        dataKeys: data ? Object.keys(data) : null
      })
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error?.message || 'session_exchange_failed')}`)
    }

  }

  // Handle case where no authorization code is provided
  console.log('❌ AUTH CALLBACK: No authorization code provided')
  return NextResponse.redirect(`${origin}/auth/error?error=no_code_provided`)
}
