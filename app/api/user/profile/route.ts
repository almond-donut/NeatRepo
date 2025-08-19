
import { createServerClient } from '@supabase/ssr';
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET() {
  const cookieStore = cookies();

  // Create a server-side Supabase client that can read the user's session from cookies
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

  try {
    // 1. Get the current user's session
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ error: 'Not authenticated' }, { status: 401 });
    }

    // 2. Securely fetch the profile for the authenticated user
    const { data: profile, error: profileError } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', session.user.id)
      .single();

    if (profileError) {
      // This is expected if the profile hasn't been created yet
      if (profileError.code === 'PGRST116') {
        console.log(`API: No profile found for user ${session.user.id}, returning null.`);
        return NextResponse.json(null, { status: 200 });
      }
      // For other errors, log them and return a server error
      console.error('API Profile Fetch DB Error:', profileError);
      return NextResponse.json({ error: 'Failed to fetch profile from database' }, { status: 500 });
    }

    // 3. Return the profile data
    return NextResponse.json(profile);

  } catch (error) {
    console.error('API Profile Fetch CATCH Error:', error);
    return NextResponse.json({ error: 'An unexpected error occurred' }, { status: 500 });
  }
}
