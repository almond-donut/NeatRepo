import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(req: NextRequest) {
  console.log('🚀 AUTH CALLBACK: Starting OAuth callback processing')

  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const next = searchParams.get('next') ?? '/dashboard'

  console.log('🔍 AUTH CALLBACK: Received params:', {
    hasCode: !!code,
    next,
    origin
  })

  if (code) {
    const res = NextResponse.next({
      request: {
        headers: req.headers,
      },
    })
    
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
    
    console.log('🔄 AUTH CALLBACK: Exchanging code for session...')
    const { data, error } = await supabase.auth.exchangeCodeForSession(code)

    if (error) {
      console.error('❌ AUTH CALLBACK: Error exchanging code for session:', error)
      return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error.message)}`)
    }

    console.log('✅ AUTH CALLBACK: Successfully exchanged code for session')

    // Store user profile information and GitHub access token
    if (data.session?.user) {
      const user = data.session.user
      const session = data.session
      console.log('🔑 OAUTH SUCCESS: Creating/updating user profile for repository access')

      // 🚨 DEBUG: Log complete session structure to find provider token
      console.log('🔍 OAUTH DEBUG: Complete session structure:', {
        hasSession: !!session,
        sessionKeys: Object.keys(session || {}),
        hasProviderToken: !!session.provider_token,
        providerTokenLength: session.provider_token?.length,
        providerTokenPrefix: session.provider_token?.substring(0, 10) + '...',
        hasAccessToken: !!session.access_token,
        accessTokenLength: session.access_token?.length,
        userProvider: user.app_metadata?.provider,
        userMetadata: user.user_metadata,
        userIdentities: user.identities?.map(i => ({ provider: i.provider, id: i.id }))
      })

      try {
        // Get GitHub user data from user metadata
        const githubUsername = user.user_metadata?.user_name || user.user_metadata?.preferred_username
        const githubId = user.user_metadata?.provider_id || user.identities?.find(i => i.provider === 'github')?.id

        if (!githubUsername) {
          console.error('❌ No GitHub username available in user metadata')
          return NextResponse.redirect(`${origin}/auth/error?error=missing_github_username`)
        }

        // 🎯 SUCCESS: OAuth session established successfully
        // User profile creation and provider token capture will be handled by client-side auth provider
        console.log('✅ OAUTH CALLBACK: Session established, user authenticated:', {
          userId: user.id,
          githubUsername,
          provider: user.app_metadata?.provider
        })
      } catch (error) {
        console.error('❌ Error in OAuth callback processing:', error)
        return NextResponse.redirect(`${origin}/auth/error?error=callback_processing_failed`)
      }
    }

    // Redirect to dashboard with success indicator
    const redirectUrl = new URL(next, origin)
    redirectUrl.searchParams.set('auth', 'success')

    console.log('🔀 AUTH CALLBACK: Redirecting to', redirectUrl.toString(), 'with session cookies')

    // Create a proper redirect response that preserves cookies
    const redirectResponse = NextResponse.redirect(redirectUrl.toString())

    // Copy all cookies from the auth response to the redirect response
    const cookies = res.cookies.getAll()
    console.log('🍪 AUTH CALLBACK: Cookies being sent:', cookies.map(c => c.name))
    cookies.forEach(cookie => {
      redirectResponse.cookies.set(cookie.name, cookie.value, {
        httpOnly: true,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        // 🔒 SECURITY: Let domain default to current domain for proper isolation
      })
    })

    return redirectResponse
  }

  // Handle case where no authorization code is provided
  console.log('❌ AUTH CALLBACK: No authorization code provided')

  const errorUrl = new URL('/auth/error', origin)
  errorUrl.searchParams.set('error', 'No authorization code provided')

  console.log('🔀 AUTH CALLBACK: Redirecting to error page:', errorUrl.toString())
  return NextResponse.redirect(errorUrl.toString())
}
