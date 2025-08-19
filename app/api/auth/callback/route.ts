// app/api/auth/callback/route.ts
import { createServerClient, type CookieOptions } from '@supabase/ssr'
import { NextResponse, type NextRequest } from 'next/server'

export async function GET(request: NextRequest) {
  const { searchParams, origin } = new URL(request.url)
  const code = searchParams.get('code')
  // if "next" is in param, use it as the redirect URL
  const next = searchParams.get('next') ?? '/dashboard'

  if (code) {
    // 1. Create the NextResponse object to redirect the user
    const response = NextResponse.redirect(`${origin}${next}`)

    // 2. Create a Supabase client that can write cookies to the response object
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return request.cookies.get(name)?.value
          },
          set(name: string, value: string, options: CookieOptions) {
            // The auth helper will call this function to set the session cookies
            response.cookies.set({ name, value, ...options })
          },
          remove(name: string, options: CookieOptions) {
            // The auth helper will call this function to remove the session cookies
            response.cookies.set({ name, value: '', ...options })
          },
        },
      }
    )

    // 3. Exchange the auth code for a session, which automatically sets the cookies on the response
    const { error } = await supabase.auth.exchangeCodeForSession(code)
    if (!error) {
      // 4. Return the response object which now has the session cookies
      return response
    }
  }

  // If there's an error or no code, redirect to an error page
  console.error('AUTH CALLBACK ERROR: Could not exchange code for session.');
  return NextResponse.redirect(`${origin}/auth/error`)
}