/**
 * Performs a lightweight check with the GitHub API to see if a token is valid.
 * @param token - The GitHub PAT to validate.
 * @returns {Promise<boolean>} - True if the token is valid, false otherwise.
 */
export const validateTokenService = async (token: string): Promise<boolean> => {
  try {
    console.log("🔍 PROFILE_SERVICE: Validating PAT with GitHub API...");
    const response = await fetch("https://api.github.com/user", {
      headers: {
        Authorization: `token ${token}`,
        Accept: "application/vnd.github.v3+json",
      },
    });

    if (response.status === 200) {
      console.log("✅ PROFILE_SERVICE: PAT is valid.");
      return true;
    }

    console.warn(`⚠️ PROFILE_SERVICE: PAT is invalid. GitHub API responded with ${response.status}.`);
    return false;

  } catch (error) {
    console.error("❌ PROFILE_SERVICE: Error during token validation network request:", error);
    return false; // Assume invalid on any network error
  }
};

import { supabase } from "@/lib/supabase";
import { User } from "@supabase/supabase-js";
import { UserProfile } from "@/components/auth/auth-context";


/**
 * Fetches a user's profile by calling our secure, server-side API route.
 * @param userId - The ID of the user.
 * @param user - The full Supabase user object.
 * @returns The user's profile.
 */
export const fetchProfileService = async (userId: string, user: User): Promise<UserProfile> => {
  try {
    console.log("🔍 PROFILE_SERVICE: Fetching profile via API route for user:", userId);
    
    const response = await fetch('/api/user/profile', { cache: 'no-store' }); // Ensure it's not cached

    if (!response.ok) {
      throw new Error(`API call failed with status: ${response.status}`);
    }

    const data: UserProfile | null = await response.json();

    if (data) {
      console.log("✅ PROFILE_SERVICE: Profile fetched successfully via API.");
      if (data.github_pat_token?.startsWith('gho_')) {
        data.github_pat_token = undefined;
      }
      return data;
    }

    // API returned null, meaning profile doesn't exist yet. Create it.
    console.log('🔧 PROFILE_SERVICE: Profile not found via API, creating a new one...');
    const githubUsername = user.user_metadata?.user_name || user.email?.split('@')[0] || `user_${userId.substring(0, 8)}`;
    const newProfile: UserProfile = {
      id: userId,
      github_username: githubUsername,
      display_name: user.user_metadata?.full_name || user.user_metadata?.name,
      avatar_url: user.user_metadata?.avatar_url,
    };

    const { error: insertError } = await supabase.from('user_profiles').insert(newProfile);
    if (insertError) {
      console.error("❌ PROFILE_SERVICE: Error creating profile after API check:", insertError);
    } else {
      console.log("✅ PROFILE_SERVICE: New basic profile created successfully.");
    }
    return newProfile;

  } catch (err) {
    console.error('❌ PROFILE_SERVICE: Fetch/create failed. Building fallback profile.', err);

    const fallbackProfile: UserProfile = {
      id: userId,
      github_username: user.user_metadata?.user_name || 'user',
      avatar_url: user.user_metadata?.avatar_url,
      display_name: user.user_metadata?.full_name || user.user_metadata?.name,
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