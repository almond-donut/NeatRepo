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

        // 🔑 PROVIDER TOKEN: Now handled on client-side via onAuthStateChange
        // The client-side auth provider will capture provider_token from the session
        // and store it in localStorage and database for repository access
        console.log('✅ OAUTH CALLBACK: Provider token will be captured on client-side')

        // Create or update user profile (GitHub token will be added by client-side auth provider)
        const { error: profileError } = await supabase
          .from('user_profiles')
          .upsert({
            id: user.id,
            github_username: githubUsername,
            github_id: githubId ? parseInt(githubId) : null,
            display_name: user.user_metadata?.full_name || user.user_metadata?.name,
            avatar_url: user.user_metadata?.avatar_url,
            email: user.email,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString()
          }, {
            onConflict: 'id'
          })

        if (profileError) {
          console.error('❌ Failed to create/update user profile:', profileError)
          return NextResponse.redirect(`${origin}/auth/error?error=profile_creation_failed`)
        } else {
          console.log('✅ User profile created/updated successfully with GitHub token')
        }
      } catch (profileError) {
        console.error('❌ Error handling user profile:', profileError)
        return NextResponse.redirect(`${origin}/auth/error?error=profile_error`)
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
