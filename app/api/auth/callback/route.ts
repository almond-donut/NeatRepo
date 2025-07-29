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

    // Use the same Supabase client to both exchange the code and write the
      // resulting session cookies to the outbound response. Because the
      // cookies.set handler writes to `response`, the auth helper will
      // automatically persist the session for the browser.
      const response = NextResponse.redirect(`${origin}${next}`)
      const supabaseWithResponse = createServerClient(
        process.env.NEXT_PUBLIC_SUPABASE_URL!,
        process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
        {
          cookies: {
            get(name: string) {
              return request.cookies.get(name)?.value
            },
            set(name: string, value: string, options: CookieOptions) {
              response.cookies.set({ name, value, ...options })
            },
            remove(name: string, options: CookieOptions) {
              response.cookies.set({ name, value: '', ...options })
            }
          }
        }
      )

      console.log('🔄 AUTH CALLBACK: Exchanging code for session (and setting cookies)...')
      const { error: exchangeError } = await supabaseWithResponse.auth.exchangeCodeForSession(code)

      if (exchangeError) {
        console.error('❌ AUTH CALLBACK: Error exchanging code for session:', exchangeError)
        return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(exchangeError.message)}`)
      }

      console.log('✅ AUTH CALLBACK: Session cookies set – redirecting user')
      return response
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

      // Create response with proper cookie handling
      const forwardedHost = request.headers.get('x-forwarded-host')
      const isLocalEnv = process.env.NODE_ENV === 'development'

      let redirectUrl: string
      if (isLocalEnv) {
        redirectUrl = `${origin}${next}`
      } else if (forwardedHost) {
        redirectUrl = `https://${forwardedHost}${next}`
      } else {
        redirectUrl = `${origin}${next}`
      }

      console.log('🔄 AUTH CALLBACK: Redirecting to:', redirectUrl)

      // Create response with proper session cookies
      const response = NextResponse.redirect(redirectUrl)

      // Ensure session cookies are properly set
      const sessionCookies = [
        'sb-ldfjlbxbnmxdryhuyfmd-auth-token',
        'sb-ldfjlbxbnmxdryhuyfmd-auth-token.0',
        'sb-ldfjlbxbnmxdryhuyfmd-auth-token.1'
      ]

      // Set session cookies from the established session
      if (data.session) {
        try {
          // Force cookie setting through supabase client
          const cookieClient = createServerClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL!,
            process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
            {
              cookies: {
                get(name: string) {
                  return request.cookies.get(name)?.value
                },
                set(name: string, value: string, options: CookieOptions) {
                  response.cookies.set({ name, value, ...options })
                },
                remove(name: string, options: CookieOptions) {
                  response.cookies.set({ name, value: '', ...options })
                },
              },
            }
          )

          // Trigger cookie setting by calling getSession
          await cookieClient.auth.getSession()
          console.log('✅ AUTH CALLBACK: Session cookies set in response')
        } catch (cookieError) {
          console.error('⚠️ AUTH CALLBACK: Cookie setting error:', cookieError)
        }
      }

      return response
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
