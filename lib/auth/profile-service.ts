import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/components/auth/auth-context";

/**
 * Fetches a user's profile from the database. If it doesn't exist,
 * it creates a basic one. Now with resilient error handling.
 * @param userId - The ID of the user to fetch the profile for.
 * @param user - The full Supabase user object, used for creating a profile if needed.
 * @returns The user's profile.
 */
export const fetchProfileService = async (userId: string, user: User): Promise<UserProfile> => {
  try {
    console.log("🔍 PROFILE_SERVICE: Fetching profile for user ID:", userId);
    
    const { data, error } = await supabase
      .from('user_profiles')
      .select('*')
      .eq('id', userId)
      .single();

    if (error && error.code !== 'PGRST116') {
      // PGRST116 means no rows found, which is not a critical error here.
      throw error;
    }
    
    if (data) {
      console.log("✅ PROFILE_SERVICE: Profile fetched successfully.");
      // Sanitize token: treat OAuth tokens (gho_ prefix) as no PAT
      if (data.github_pat_token?.startsWith('gho_')) {
        data.github_pat_token = undefined;
      }
      return data;
    }

    // Profile not found, let's create a basic one.
    console.log('🔧 PROFILE_SERVICE: Profile not found, creating a new basic profile...');
    const githubUsername = user.user_metadata?.user_name || user.email?.split('@')[0] || `user_${userId.substring(0, 8)}`;
    const newProfile: UserProfile = {
      id: userId,
      github_username: githubUsername,
      display_name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url,
    };

    const { error: insertError } = await supabase.from('user_profiles').insert(newProfile);

    if (insertError) {
      console.error("❌ PROFILE_SERVICE: Error creating profile:", insertError);
      return newProfile; // Return the basic profile object anyway so the app doesn't break
    }
    
    console.log("✅ PROFILE_SERVICE: New basic profile created successfully.");
    return newProfile;

  } catch (err) {
    console.error('❌ PROFILE_SERVICE: Profile fetch failed. Building resilient fallback profile.', err);

    // ✨ THE FIX IS HERE ✨
    // Construct a fallback profile but ATTEMPT TO RECOVER THE PAT from localStorage.
    // This prevents a temporary network error from wiping the user's session state.
    const fallbackProfile: UserProfile = {
      id: userId,
      github_username: user?.user_metadata?.user_name || 'user',
      avatar_url: user?.user_metadata?.avatar_url,
      display_name: user?.user_metadata?.full_name || user?.user_metadata?.name,
    };

    if (typeof window !== 'undefined') {
        const cachedPat = localStorage.getItem(`github_pat_token_${userId}`);
        if (cachedPat && !cachedPat.startsWith('gho_')) {
            console.log('🔄 PROFILE_SERVICE: Recovering PAT from localStorage for fallback profile.');
            fallbackProfile.github_pat_token = cachedPat;
        }
    }

    return fallbackProfile;
  }
};

/**
 * Updates or inserts a user's GitHub Personal Access Token (PAT) in the database.
 * @param userId - The ID of the user.
 * @param token - The GitHub PAT to save.
 */
export const updateTokenService = async (userId: string, token: string): Promise<void> => {
  console.log('💾 PROFILE_SERVICE: Saving PAT for user:', userId);

  const { error } = await supabase
    .from('user_profiles')
    .update({ github_pat_token: token, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('❌ PROFILE_SERVICE: Error updating token:', error);
    throw error;
  }
  
  console.log('✅ PROFILE_SERVICE: PAT saved to database successfully.');
};

/**
 * Deletes a user's GitHub Personal Access Token (PAT) from the database.
 * @param userId - The ID of the user.
 */
export const deleteTokenService = async (userId: string): Promise<void> => {
  console.log('🗑️ PROFILE_SERVICE: Deleting PAT for user:', userId);

  const { error } = await supabase
    .from('user_profiles')
    .update({ github_pat_token: null, updated_at: new Date().toISOString() })
    .eq('id', userId);

  if (error) {
    console.error('❌ PROFILE_SERVICE: Error deleting token:', error);
    throw error;
  }
  
  console.log('✅ PROFILE_SERVICE: PAT deleted from database successfully.');
};