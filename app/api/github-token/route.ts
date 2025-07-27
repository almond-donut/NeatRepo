import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

/**
 * CRITICAL FIX: Get GitHub OAuth token for new users
 * 
 * Supabase doesn't store OAuth provider tokens by default.
 * This endpoint provides a workaround to get GitHub tokens for repository access.
 * 
 * For new users who haven't configured a PAT, this allows basic repository browsing.
 */
export async function GET() {
  try {
    const cookieStore = cookies();
    const supabase = createServerClient(
      process.env.NEXT_PUBLIC_SUPABASE_URL!,
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
      {
        cookies: {
          get(name: string) {
            return cookieStore.get(name)?.value;
          },
        },
      }
    );
    
    // Get the current session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Session error:', sessionError);
      return NextResponse.json({ error: 'Session error' }, { status: 401 });
    }
    
    if (!session?.user) {
      console.log('❌ No authenticated user');
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }
    
    // Check if user signed in with GitHub OAuth
    if (session.user.app_metadata?.provider !== 'github') {
      console.log('❌ User did not sign in with GitHub OAuth');
      return NextResponse.json({ error: 'Not a GitHub OAuth user' }, { status: 400 });
    }
    
    console.log('🔍 GITHUB TOKEN API: Checking for OAuth token...', {
      userId: session.user.id,
      provider: session.user.app_metadata?.provider,
      hasProviderToken: !!session.provider_token,
      tokenLength: session.provider_token?.length
    });
    
    // If we have a provider token, return it
    if (session.provider_token) {
      console.log('🔑 ✅ Found OAuth token in session!');
      return NextResponse.json({ 
        token: session.provider_token,
        source: 'oauth',
        message: 'OAuth token available for repository access'
      });
    }
    
    // If no provider token, this is the Supabase limitation
    console.log('❌ No OAuth token available - Supabase limitation');
    
    // Return guidance for the user
    return NextResponse.json({ 
      error: 'OAuth token not available',
      message: 'GitHub OAuth tokens are not stored by Supabase. Please configure a Personal Access Token for full repository access.',
      guidance: {
        action: 'setup_pat',
        reason: 'oauth_token_unavailable',
        canBrowseWithoutToken: false
      }
    }, { status: 200 }); // 200 because this is expected behavior, not an error
    
  } catch (error) {
    console.error('❌ GitHub token API error:', error);
    return NextResponse.json({ 
      error: 'Internal server error',
      message: 'Failed to check GitHub token availability'
    }, { status: 500 });
  }
}
