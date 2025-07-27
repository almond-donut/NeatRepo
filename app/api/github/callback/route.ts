import { NextRequest, NextResponse } from 'next/server'
import { createServerClient } from '@supabase/ssr'
import { cookies } from 'next/headers'

export async function GET(req: NextRequest) {
  console.log('🚀 CUSTOM GITHUB OAUTH: Starting custom OAuth callback processing')
  
  const { searchParams, origin } = new URL(req.url)
  const code = searchParams.get('code')
  const state = searchParams.get('state')
  const error = searchParams.get('error')
  
  console.log('🔍 CUSTOM OAUTH: Received params:', { 
    hasCode: !!code, 
    hasState: !!state,
    error,
    origin
  })

  if (error) {
    console.error('❌ CUSTOM OAUTH: GitHub OAuth error:', error)
    return NextResponse.redirect(`${origin}/auth/error?error=${encodeURIComponent(error)}`)
  }

  if (!code || !state) {
    console.error('❌ CUSTOM OAUTH: Missing code or state parameter')
    return NextResponse.redirect(`${origin}/auth/error?error=missing_parameters`)
  }

  try {
    // Exchange code for access token
    console.log('🔄 CUSTOM OAUTH: Exchanging code for access token...')
    const tokenResponse = await fetch('https://github.com/login/oauth/access_token', {
      method: 'POST',
      headers: {
        'Accept': 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        client_id: 'Ov23liaOcBS8zuFJCGyG',
        client_secret: process.env.GITHUB_CLIENT_SECRET || 'b5e2c958fe8415f477d90afc9482d3329b6e552',
        code: code,
        state: state,
      }),
    })

    const tokenData = await tokenResponse.json()
    console.log('🔍 CUSTOM OAUTH: Token response:', { 
      hasAccessToken: !!tokenData.access_token,
      tokenType: tokenData.token_type,
      scope: tokenData.scope 
    })

    if (!tokenData.access_token) {
      console.error('❌ CUSTOM OAUTH: No access token received:', tokenData)
      return NextResponse.redirect(`${origin}/auth/error?error=no_access_token`)
    }

    // Get user info from GitHub
    console.log('🔄 CUSTOM OAUTH: Fetching user info from GitHub...')
    const userResponse = await fetch('https://api.github.com/user', {
      headers: {
        'Authorization': `Bearer ${tokenData.access_token}`,
        'Accept': 'application/vnd.github.v3+json',
      },
    })

    const userData = await userResponse.json()
    console.log('🔍 CUSTOM OAUTH: User data:', { 
      id: userData.id,
      login: userData.login,
      email: userData.email 
    })

    // Create Supabase client
    const cookieStore = cookies()
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value
          },
        },
      }
    )

    // Create or update user in Supabase Auth
    console.log('🔄 CUSTOM OAUTH: Creating/updating user in Supabase...')
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: userData.email || `${userData.login}@github.local`,
      password: `github_${userData.id}_${tokenData.access_token.substring(0, 10)}`,
    })

    if (authError) {
      // User doesn't exist, create them
      console.log('🔄 CUSTOM OAUTH: User not found, creating new user...')
      const { data: signUpData, error: signUpError } = await supabase.auth.signUp({
        email: userData.email || `${userData.login}@github.local`,
        password: `github_${userData.id}_${tokenData.access_token.substring(0, 10)}`,
        options: {
          data: {
            user_name: userData.login,
            avatar_url: userData.avatar_url,
            github_id: userData.id,
            provider: 'github',
          }
        }
      })

      if (signUpError) {
        console.error('❌ CUSTOM OAUTH: Failed to create user:', signUpError)
        return NextResponse.redirect(`${origin}/auth/error?error=user_creation_failed`)
      }

      console.log('✅ CUSTOM OAUTH: User created successfully')
    } else {
      console.log('✅ CUSTOM OAUTH: User signed in successfully')
    }

    // Store GitHub token in user profile
    console.log('🔄 CUSTOM OAUTH: Storing GitHub token in user profile...')
    const userId = authData?.user?.id || signUpData?.user?.id
    
    if (userId) {
      const { error: updateError } = await supabase
        .from('user_profiles')
        .upsert({
          id: userId,
          username: userData.login,
          email: userData.email,
          avatar_url: userData.avatar_url,
          github_id: userData.id,
          github_token: tokenData.access_token, // Store OAuth token
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        })
      
      if (updateError) {
        console.error('❌ CUSTOM OAUTH: Failed to store OAuth token:', updateError)
      } else {
        console.log('✅ CUSTOM OAUTH: OAuth token stored successfully - NEW USER CAN NOW SEE REPOSITORIES!')
      }
    }

    // Redirect to dashboard
    console.log('🔀 CUSTOM OAUTH: Redirecting to dashboard...')
    return NextResponse.redirect(`${origin}/dashboard?auth=success`)

  } catch (error) {
    console.error('❌ CUSTOM OAUTH: Unexpected error:', error)
    return NextResponse.redirect(`${origin}/auth/error?error=unexpected_error`)
  }
}
