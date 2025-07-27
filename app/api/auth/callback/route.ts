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
    } else {
      console.log('✅ AUTH CALLBACK: Successfully exchanged code for session')

      // CRITICAL FIX: Store GitHub OAuth token for new users
      if (data.session?.provider_token && data.session?.user?.app_metadata?.provider === 'github') {
        console.log('🔑 OAUTH SUCCESS: Storing GitHub token for new user repository access')

        try {
          // Store the OAuth token in user profile for repository access
          const { error: updateError } = await supabase
            .from('user_profiles')
            .upsert({
              id: data.session.user.id,
              username: data.session.user.user_metadata?.user_name || data.session.user.user_metadata?.preferred_username,
              email: data.session.user.email,
              avatar_url: data.session.user.user_metadata?.avatar_url,
              github_id: data.session.user.user_metadata?.sub,
              github_token: data.session.provider_token, // Store OAuth token
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString()
            })

          if (updateError) {
            console.error('❌ Failed to store OAuth token:', updateError)
          } else {
            console.log('✅ OAuth token stored successfully - NEW USER CAN NOW SEE REPOSITORIES!')
          }
        } catch (storeError) {
          console.error('❌ Error storing OAuth token:', storeError)
        }
      } else {
        console.log('⚠️ No provider token available in session')
      }
    }
    
    if (!error) {
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
        })
      })

      return redirectResponse
    }
  }

  // return the user to an error page with instructions
  console.log('❌ AUTH CALLBACK: No code provided or error occurred, redirecting to error page')
  
  const redirectUrl = new URL('/auth/error', origin)
  redirectUrl.searchParams.set('error', 'OAuth callback error')
  
  // Untuk kasus error di luar blok if (code), kita perlu membuat respons baru
  // karena res hanya didefinisikan di dalam blok if (code)
  console.log('🔀 AUTH CALLBACK: Redirecting to error page:', redirectUrl.toString())
  return NextResponse.redirect(redirectUrl)
}
