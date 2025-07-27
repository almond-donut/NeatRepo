import { type NextRequest, NextResponse } from "next/server"
import { createServerClient } from '@supabase/ssr'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get("code")
  const error = searchParams.get("error")
  const error_description = searchParams.get("error_description")
  const state = searchParams.get("state")

  console.log("🔗 Auth callback received:", {
    code: code ? "Present" : "Missing",
    error,
    error_description,
    state: state ? "Present" : "Missing",
    origin,
    fullUrl: request.url,
  })

  // Handle OAuth errors
  if (error) {
    console.error("❌ OAuth error:", { error, error_description })
    // For bad_oauth_state errors, redirect to clean homepage to retry
    if (error === 'invalid_request' && error_description?.includes('bad_oauth_state')) {
      console.log("🔄 OAuth state error detected, redirecting to clean homepage for retry")
      return NextResponse.redirect(`${origin}/`)
    }
    return NextResponse.redirect(`${origin}/?error=${encodeURIComponent(error_description || error)}`)
  }

  if (!code) {
    console.error("❌ No authorization code received")
    return NextResponse.redirect(`${origin}/?error=no_authorization_code`)
  }

  // Create response to handle cookies
  let response = NextResponse.redirect(`${origin}/dashboard`)

  // Create server-side Supabase client
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        get(name: string) {
          return request.cookies.get(name)?.value
        },
        set(name: string, value: string, options: any) {
          response.cookies.set({
            name,
            value,
            ...options,
          })
        },
        remove(name: string, options: any) {
          response.cookies.set({
            name,
            value: '',
            ...options,
          })
        },
      },
    }
  )

  try {
    // Exchange code for session
    const { data, error: exchangeError } = await supabase.auth.exchangeCodeForSession(code)

    if (exchangeError) {
      console.error("❌ Code exchange error:", exchangeError)
      response = NextResponse.redirect(`${origin}/?error=${encodeURIComponent(exchangeError.message)}`)
      return response
    }

    if (!data.session) {
      console.error("❌ No session created")
      response = NextResponse.redirect(`${origin}/?error=no_session_created`)
      return response
    }

    console.log("✅ Authentication successful:", {
      userId: data.user?.id,
      email: data.user?.email,
      provider: data.user?.app_metadata?.provider,
      sessionId: data.session?.id,
    })

    // Log cookies being set
    console.log("🍪 Setting auth cookies for session:", data.session?.id)

    // Successful authentication - redirect to dashboard with session confirmation
    response = NextResponse.redirect(`${origin}/dashboard?auth=success`)

    // Add cache control headers to prevent caching of auth responses
    response.headers.set('Cache-Control', 'no-cache, no-store, must-revalidate')
    response.headers.set('Pragma', 'no-cache')
    response.headers.set('Expires', '0')
    
    // Add session confirmation header
    response.headers.set('X-Auth-Success', 'true')

    return response
  } catch (error) {
    console.error("❌ Callback processing error:", error)
    response = NextResponse.redirect(
      `${origin}/?error=${encodeURIComponent(error instanceof Error ? error.message : "authentication_failed")}`,
    )
    return response
  }
}
