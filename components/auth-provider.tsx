"use client"

import React, { createContext, useContext, useEffect, useState } from "react";
import GitHubTokenPopup from "./github-token-popup";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  github_pat_token?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  showTokenPopup: () => void;
  getEffectiveToken: () => Promise<string | null>;
  updateToken: (token: string) => Promise<void>;
  deleteToken: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

// 🌟 AUTH PROVIDER: Main context provider component
export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true); // CRITICAL FIX: Start with loading true to prevent race conditions
  const [showTokenPopupState, setShowTokenPopupState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // ⏰ FAIL-SAFE: Force loading to false after 8 seconds if it somehow stays true
  useEffect(() => {
    if (!loading) return; // Already resolved

    const timer = setTimeout(() => {
      if (loading) {
        console.warn('⚠️ AUTH: Fallback timeout reached, forcing loading=false');
        setLoading(false);
      }
    }, 8000); // 8-second safety net

    return () => clearTimeout(timer);
  }, [loading]);

  // 🔧 REMOVED: Emergency timeout that was interfering with OAuth profile creation
  // Users must now manually sign out to end sessions, ensuring complete session cleanup
  // and preventing timing interference with OAuth UPSERT operations for new users

  // 🚨 HELPER: Create profile with proper username handling
  const createProfileWithUsername = async (user: any, githubUsername: string, githubId?: string) => {
    try {
      console.log('🔧 AUTH: Creating profile with username:', githubUsername);

      const newProfile = {
        id: user.id,
        github_user_id: githubId,
        github_username: githubUsername,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || githubUsername,
        avatar_url: user.user_metadata?.avatar_url,
         // Will be set later if needed
        updated_at: new Date().toISOString(),
      };

      const { error: upsertError } = await supabase
        .from('user_profiles')
        .upsert(newProfile, { onConflict: 'id' });

      if (upsertError) {
        console.error('❌ Failed to create profile in database:', upsertError);
        // 🔧 CRITICAL FIX: Set profile state even if database operation fails
        // This prevents "No account" state while still allowing the app to function
        console.log('🔄 AUTH: Setting profile state despite database error to prevent "No account" state');
        setProfile(newProfile);
        return newProfile; // Don't throw error, continue with local profile state
      }

      console.log('✅ Profile created successfully:', githubUsername);
      setProfile(newProfile);
      return newProfile;
    } catch (error) {
      console.error('❌ Profile creation failed:', error);

      // 🔧 CRITICAL FIX: Create fallback profile state to prevent "No account" state
      const fallbackProfile = {
        id: user.id,
        github_user_id: githubId,
        github_username: githubUsername,
        display_name: user.user_metadata?.full_name || user.user_metadata?.name || githubUsername,
        avatar_url: user.user_metadata?.avatar_url,
        
        updated_at: new Date().toISOString(),
      };

      console.log('🔄 AUTH: Creating fallback profile state to prevent "No account" state');
      setProfile(fallbackProfile);
      return fallbackProfile; // Don't throw error - allow app to continue with local profile state
    }
  };

  const fetchProfile = async (userId: string) => {
    try {
      console.log("🔍 AUTH: Fetching profile for user ID:", userId);
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('❌ AUTH: Error fetching profile:', error);
        // If profile doesn't exist, create it
        if (error.code === 'PGRST116') {
          console.log('🔧 Profile not found, creating new profile...');

          // 🔧 CRITICAL FIX: Enhanced GitHub username extraction with multiple fallbacks
          const githubUsername = user?.user_metadata?.user_name ||
                                user?.user_metadata?.preferred_username ||
                                user?.user_metadata?.login ||
                                user?.user_metadata?.name ||
                                user?.email?.split('@')[0];

          console.log('🔍 AUTH: GitHub username extraction:', {
            user_name: user?.user_metadata?.user_name,
            preferred_username: user?.user_metadata?.preferred_username,
            login: user?.user_metadata?.login,
            name: user?.user_metadata?.name,
            email: user?.email,
            finalUsername: githubUsername,
            allMetadata: user?.user_metadata
          });

          if (!githubUsername) {
            console.error('❌ Cannot create profile: No GitHub username available after all fallbacks');
            console.error('❌ Available user data:', {
              userMetadata: user?.user_metadata,
              email: user?.email,
              identities: user?.identities
            });
            throw new Error('GitHub username is required for profile creation');
          }

          const newProfile = {
            id: userId,
            github_username: githubUsername,
             // Only null for truly new users
            display_name: user?.user_metadata?.full_name || user?.user_metadata?.name,
            avatar_url: user?.user_metadata?.avatar_url
          };

          const { data: createdProfile, error: createError } = await supabase
            .from('user_profiles')
            .insert(newProfile)
            .select()
            .single();

          if (createError) {
            console.error('Error creating profile:', createError);
            setProfile(newProfile);
            return newProfile;
          } else {
            console.log('✅ Profile created successfully');
            setProfile(createdProfile);
            return createdProfile;
          }
        }

        // 🚨 CRITICAL FIX: For other errors (network, timeout, etc.),
        // don't override existing profile data - preserve current state
        console.error('❌ AUTH: Database error fetching profile, preserving current state');
        if (profile) {
          console.log('🔄 AUTH: Keeping existing profile to preserve PAT token');
          return profile; // Keep existing profile to preserve any PAT
        }

        // Only create basic profile if we have no existing profile at all
        const basicProfile = {
          id: userId,
          github_username: user?.user_metadata?.user_name || 'user',
          github_pat_token: null // Only null if no existing profile
        };
        setProfile(basicProfile);
        return basicProfile;
      } else {
        // Sanitize profile token: treat OAuth tokens (gho_ prefix) as no PAT
        if (data && data.github_pat_token?.startsWith('gho_')) {
          data.github_pat_token = null;
        }
        console.log("✅ AUTH: Profile fetched successfully:", {
          id: data.id,
          github_username: data.github_username,
          hasToken: !!data.github_pat_token,
          tokenLength: data.github_pat_token?.length,
          avatar_url: data.avatar_url
        });
        setProfile(data);
        return data;
      }
    } catch (err) {
      console.error('❌ AUTH: Profile fetch failed with exception:', err);

      // 🚨 CRITICAL FIX: Don't override existing profile on network/connection errors
      if (profile) {
        console.log('🔄 AUTH: Network error, preserving existing profile with PAT');
        return profile; // Keep existing profile to preserve any PAT
      }

      // Only create basic profile if we have no existing profile at all
      const basicProfile = {
        id: userId,
        github_username: user?.user_metadata?.user_name || 'user',
        github_pat_token: null
      };
      setProfile(basicProfile);
      return basicProfile;
    }
  };

  // 🔒 CRITICAL FIX: Ensure loading is false when user is present
  useEffect(() => {
    if (user && loading) {
      console.log('🚨 LOADING FIX: User detected but loading is true - fixing immediately');
      setLoading(false);
    }
  }, [user, loading]);

  // 🔒 SECURE USER-SPECIFIC DATA LOADING
  useEffect(() => {
    const loadUserSpecificData = async () => {
      // Only load data if user is authenticated
      if (!user) return;

      console.log('🔧 AUTH: Loading user-specific data for:', user.id);

      try {
        // Load user-specific cached data only
        let userSpecificToken = localStorage.getItem(`github_pat_token_${user.id}`);

        // 🧹 MIGRATION: remove leftover OAuth token accidentally cached as PAT
        if (userSpecificToken?.startsWith('gho_')) {
          console.log('🧹 AUTH: Removing legacy cached OAuth token stored under github_pat_token key');
          localStorage.removeItem(`github_pat_token_${user.id}`);
          userSpecificToken = null;
        }

        if (userSpecificToken && !userSpecificToken.startsWith('gho_') && profile?.github_pat_token !== userSpecificToken) {
          console.log('✅ AUTH: Found user-specific cached token');
          // Update profile with cached token if it matches this user
          setProfile(prev => prev ? { ...prev, github_pat_token: userSpecificToken } : null);
        }
      } catch (error) {
        console.log('🔍 AUTH: No user-specific cached data found');
      }
    };

    loadUserSpecificData();
  }, [user, profile]);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log('🚀 AUTH: INSTANT LOADING - Starting optimized initialization...');

        // 🔧 SIMPLIFIED: Detect and clear corrupted session state
        if (typeof window !== 'undefined') {
          const corruptionIndicators = [
            localStorage.getItem('github_pat_token') && !localStorage.getItem('github_repositories_time'),
            localStorage.getItem('temp_recovery_profile')
          ];

          if (corruptionIndicators.some(indicator => indicator)) {
            console.log('🧹 CORRUPTION DETECTED: Clearing potentially corrupted cache data');
            // Clear specific corrupted keys but preserve valid user-specific data
            localStorage.removeItem('github_pat_token');
            localStorage.removeItem('temp_recovery_profile');
          }
        }

        // 🔥 CRITICAL FIX: Handle OAuth callback tokens in URL FIRST
        if (typeof window !== 'undefined') {
          const hashParams = new URLSearchParams(window.location.hash.substring(1));
          const accessToken = hashParams.get('access_token');

          if (accessToken) {
            console.log('🎯 AUTH: OAuth tokens detected in URL, establishing session...');

            try {
              // Set the session using the tokens from URL
              const { data, error } = await supabase.auth.setSession({
                access_token: accessToken,
                refresh_token: hashParams.get('refresh_token') || '',
              });

              if (error) {
                console.error('❌ AUTH: Error setting session from OAuth tokens:', error);
              } else {
                console.log('✅ AUTH: Session established from OAuth tokens');
                // Clean up URL immediately
                window.history.replaceState({}, '', window.location.pathname);
                // Set user immediately and exit
                if (data.session?.user) {
                  setUser(data.session.user);
                  setLoading(false);
                  console.log('✅ AUTH: OAuth login complete - user must manually navigate');
                  // REMOVED: Automatic redirect - user must manually choose where to go
                  return;
                }
              }
            } catch (err) {
              console.error('❌ AUTH: OAuth session error:', err);
            }

            // Always set loading false after OAuth processing
            setLoading(false);
            return;
          }
        }

        // 🔧 CRITICAL FIX: Add retry mechanism for session loading to prevent intermittent failures
        let session = null;
        let sessionError = null;
        let retryCount = 0;
        const maxRetries = 3;

        while (retryCount < maxRetries && !session) {
          try {
            const { data, error } = await supabase.auth.getSession();
            session = data.session;
            sessionError = error;

            if (session || retryCount === maxRetries - 1) {
              break;
            }

            if (!session && retryCount < maxRetries - 1) {
              console.log(`🔄 Session not found, retrying... (${retryCount + 1}/${maxRetries})`);
              await new Promise(resolve => setTimeout(resolve, 100)); // Wait 100ms before retry
            }
          } catch (err) {
            sessionError = err;
            console.error(`❌ Session check error (attempt ${retryCount + 1}):`, err);
          }
          retryCount++;
        }

        console.log('🔍 Session check:', {
          session: !!session,
          user: !!session?.user,
          error: sessionError,
          retryCount
        });

        if (session?.user) {
          console.log('✅ Setting user from session:', session.user.id);
          setUser(session.user);

          // 🔧 CRITICAL FIX: Only set loading false AFTER user is set
          // This prevents race condition where loading=false but user=null

          // 🔧 CRITICAL FIX: Set loading false only after user state is properly set
          // Use setTimeout to ensure user state is updated before loading becomes false
          setTimeout(() => {
            setLoading(false);
            console.log('✅ AUTH: Loading set to false after user state update');
          }, 0);

          // 🔑 CRITICAL FIX: Check for provider token during initialization (not just auth state change)
          if (session.provider_token) {
            console.log('🎯 INIT: Provider token detected in session during initialization!', {
              hasProviderToken: !!session.provider_token,
              tokenLength: session.provider_token.length,
              provider: session.user?.app_metadata?.provider
            });

            // Store provider token for this user
            if (typeof window !== 'undefined') {
              localStorage.setItem(`oauth_provider_token_${session.user.id}`, session.provider_token);
              console.log('✅ INIT: Provider token stored for user:', session.user.id);

              // 🚨 CRITICAL FIX: Use UPSERT to create/update profile with provider token
              try {
                // Extract GitHub metadata for profile creation
                const githubUsername = session.user.user_metadata?.user_name ||
                                     session.user.user_metadata?.preferred_username ||
                                     session.user.email?.split('@')[0] || 'user';
                const githubId = session.user.user_metadata?.provider_id ||
                               session.user.identities?.find(i => i.provider === 'github')?.id;

                const profileData = {
                  id: session.user.id,
                  github_username: githubUsername,
                  github_user_id: githubId,
                  display_name: session.user.user_metadata?.full_name ||
                               session.user.user_metadata?.name ||
                               githubUsername,
                  avatar_url: session.user.user_metadata?.avatar_url,
                  // Do not store OAuth provider token as PAT

                  updated_at: new Date().toISOString()
                };

                const { error } = await supabase
                  .from('user_profiles')
                  .upsert(profileData, { onConflict: 'id' });

                if (error) {
                  console.error('❌ INIT: Failed to upsert profile with provider token:', error);
                } else {
                  console.log('✅ INIT: Profile created/updated with provider token for user:', session.user.id);
                  // 🔧 CRITICAL FIX: Set profile state immediately after successful UPSERT
                  setProfile(profileData);
                  console.log('✅ INIT: Profile state updated with OAuth data');
                }
              } catch (error) {
                console.error('❌ INIT: Exception upserting profile with provider token:', error);
              }
            }
          }

          // CRITICAL FIX: Set loading false only after user state is properly set
          // This prevents race condition where loading=false but user=null
          setTimeout(() => {
            setLoading(false);
            console.log("✅ AUTH: User session found - UI ready immediately");
          }, 0);

          // GitHub connection check is now handled by AuthGuard component
          // This prevents conflicts between multiple redirect attempts

          // 🚀 PARALLEL: Fetch profile in background without blocking UI
          fetchProfile(session.user.id).then((fetchedProfile) => {
            // Check if this is a GitHub OAuth user
            const isGitHubOAuth = session.user.app_metadata?.provider === 'github';
            
            // Also check for PAT cached in localStorage
            const cachedPatToken = typeof window !== 'undefined' ? localStorage.getItem(`github_pat_token_${session.user.id}`) : null;

            console.log('🔍 INITIAL PAT POPUP DEBUG:', {
              isGitHubOAuth,
              profileToken: !!fetchedProfile?.github_pat_token,
              cachedPatToken: !!cachedPatToken,
              userId: session.user.id,
              profile: fetchedProfile
            });

            // Show PAT popup for GitHub OAuth users who don't have a token
            if (isGitHubOAuth && !fetchedProfile?.github_pat_token && !cachedPatToken && typeof window !== 'undefined') {
              const permanentlySkipped = localStorage.getItem(`token_popup_skipped_permanently_${session.user.id}`);
              
              console.log('🔍 INITIAL PAT POPUP STORAGE DEBUG:', {
                permanentlySkipped,
                shouldShow: !permanentlySkipped
              });

              // Only show popup if user hasn't permanently skipped
              if (!permanentlySkipped) {
                console.log('✅ INITIAL PAT POPUP: Showing popup for GitHub OAuth user without token');
                setShowTokenPopupState(true);
              } else {
                console.log('❌ INITIAL PAT POPUP: User permanently skipped token setup');
              }
            } else {
              console.log('❌ INITIAL PAT POPUP: Not showing - either not GitHub OAuth or already has token');
            }
            console.log('✅ Profile loaded in background');
          }).catch((error) => {
            console.error('❌ Background profile fetch failed:', error);
            // Create basic profile as fallback
            const basicProfile = {
              id: session.user.id,
              github_username: session.user.user_metadata?.user_name || 'user',
              github_pat_token: null // Always null to force popup
            };
            setProfile(basicProfile);

            // Show popup for GitHub OAuth users even on profile fetch error
            const isGitHubOAuth = session.user.app_metadata?.provider === 'github';
            if (isGitHubOAuth && typeof window !== 'undefined') {
              const permanentlySkipped = localStorage.getItem(`token_popup_skipped_permanently_${session.user.id}`);
              if (!permanentlySkipped) {
                console.log('✅ FALLBACK PAT POPUP: Showing popup for GitHub OAuth user (profile fetch failed)');
                setShowTokenPopupState(true);
              }
            }
          });
        } else {
          console.log('❌ No user in session');
          setUser(null);
        }

        // Only set loading false if no user was found (already set above if user exists)
        if (!session?.user) {
          console.log('❌ No user in session - setting loading false');
          setLoading(false);
        }
        console.log('✅ AUTH: INSTANT initialization completed - UI ready!');
      } catch (err) {
        console.error('❌ AUTH: Session initialization error:', err);
        setUser(null); // Fallback to no user
        setLoading(false); // Ensure loading is false even on error
      }
    };

    initializeSession();

    const { data: { subscription } } = supabase.auth.onAuthStateChange(
      async (event, session) => {
        console.log("🔄 AUTH: Auth state changed:", event);

        // 🔧 CRITICAL FIX: Only set loading to false after user state is properly updated
        // This prevents race condition where loading=false but user state is inconsistent

        // 🔑 CRITICAL: Capture provider token immediately after OAuth redirect
        let oauthProfileUpdated = false; // Track if we've updated profile via OAuth
        if (session && session.provider_token) {
          console.log('🎯 AUTH: Provider token detected in session!', {
            hasProviderToken: !!session.provider_token,
            tokenLength: session.provider_token.length,
            provider: session.user?.app_metadata?.provider
          });

          // Store provider token for this user
          if (session.user && typeof window !== 'undefined') {
            localStorage.setItem(`oauth_provider_token_${session.user.id}`, session.provider_token);
            console.log('✅ AUTH: Provider token stored for user:', session.user.id);

            // 🚨 CRITICAL FIX: Use UPSERT to create/update profile with provider token
            try {

              // Extract GitHub metadata for profile creation
              const githubUsername = session.user.user_metadata?.user_name ||
                                   session.user.user_metadata?.preferred_username ||
                                   session.user.email?.split('@')[0] || 'user';
              const githubId = session.user.user_metadata?.provider_id ||
                             session.user.identities?.find(i => i.provider === 'github')?.id;

              const profileData = {
                id: session.user.id,
                github_username: githubUsername,
                github_user_id: githubId,
                display_name: session.user.user_metadata?.full_name ||
                             session.user.user_metadata?.name ||
                             githubUsername,
                avatar_url: session.user.user_metadata?.avatar_url,
                // Do not store OAuth provider token as PAT

                updated_at: new Date().toISOString()
              };

              const { error } = await supabase
                .from('user_profiles')
                .upsert(profileData, { onConflict: 'id' });

              if (error) {
                console.error('❌ AUTH: Failed to upsert profile with provider token:', error);
                // 🔧 FALLBACK: Set profile state even if UPSERT fails to prevent "No account" state
                setProfile(profileData);
                console.log('🔄 AUTH: Profile state set as fallback despite UPSERT error');
              } else {
                console.log('✅ AUTH: Profile created/updated with provider token for user:', session.user.id);
                // 🔧 CRITICAL FIX: Set profile state immediately after successful UPSERT
                setProfile(profileData);
                oauthProfileUpdated = true; // Mark that we've updated the profile
                console.log('✅ AUTH: Profile state updated with OAuth data');
              }
            } catch (error) {
              console.error('❌ AUTH: Exception upserting profile with provider token:', error);
              // 🔧 FALLBACK: Create temporary profile state to prevent "No account" state
              const fallbackProfileData = {
                id: session.user.id,
                github_username: session.user.user_metadata?.user_name || 'user',
                // Do not store OAuth provider token as PAT

                display_name: session.user.user_metadata?.full_name || session.user.user_metadata?.user_name || 'User',
                avatar_url: session.user.user_metadata?.avatar_url
              };
              setProfile(fallbackProfileData);
              console.log('🔄 AUTH: Fallback profile state created to prevent "No account" state');
            }
          }
        }

        // 🔒 SIMPLIFIED: Handle user changes without multi-account complexity
        if (session?.user && user && user.id !== session.user.id) {
          console.log("🔍 AUTH: User change detected:", {
            previousUser: user.id,
            newUser: session.user.id,
            event: event
          });

          // Clear any cached profile data for the previous user
          setProfile(null);

          // 🧹 SECURITY: Clear ALL user-specific data when user changes
          if (typeof window !== 'undefined') {
            // Clear previous user's data
            localStorage.removeItem(`token_popup_dismissed_${user.id}`);
            localStorage.removeItem(`token_popup_skipped_permanently_${user.id}`);
            localStorage.removeItem(`github_pat_token_${user.id}`);
            localStorage.removeItem(`oauth_provider_token_${user.id}`);
            localStorage.removeItem(`github_repositories_${user.id}`);
            localStorage.removeItem(`github_repositories_time_${user.id}`);

            // Clear global keys that might contain mixed data
            localStorage.removeItem('github_pat_token');
            localStorage.removeItem('oauth_provider_token');
            localStorage.removeItem('github_repositories');
            localStorage.removeItem('github_repositories_time');

            console.log("🧹 AUTH: Cleared previous user's cached data including OAuth tokens");
          }
        }

        setUser(session?.user ?? null);

        // 🔧 CRITICAL FIX: Set loading false after user state is updated
        setTimeout(() => {
          setLoading(false);
          console.log("✅ AUTH: Loading set to false after user state update in auth change");
        }, 0);

        if (event === 'SIGNED_IN' && session?.user) {
          console.log("✅ AUTH: User signed in - UI ready immediately");
          console.log("🔍 AUTH: Loading state after SIGNED_IN:", false);
          console.log("🔍 AUTH: New user details:", {
            userId: session.user.id,
            email: session.user.email,
            githubUsername: session.user.user_metadata?.user_name,
            provider: session.user.app_metadata?.provider
          });

          // REMOVED: No more sign-in timeouts - let the session persist naturally

          try {
            // Check if user signed in with GitHub OAuth
            const isGitHubOAuth = session.user.app_metadata?.provider === 'github';
            const githubId = session.user.user_metadata?.provider_id || session.user.identities?.find(i => i.provider === 'github')?.id;

            // 🚨 CRITICAL FIX: Multiple fallback methods to extract GitHub username
            const githubUsername = session.user.user_metadata?.user_name ||
                                 session.user.user_metadata?.preferred_username ||
                                 session.user.user_metadata?.login ||
                                 session.user.identities?.find(i => i.provider === 'github')?.identity_data?.login;

            console.log("🔍 AUTH: GitHub OAuth details:", {
              isGitHubOAuth,
              githubId,
              githubUsername,
              hasProviderToken: !!session.provider_token,
              userMetadata: session.user.user_metadata,
              identities: session.user.identities
            });

            // 🔧 CRITICAL FIX: Enhanced GitHub username extraction with multiple fallbacks
            if (!githubUsername) {
              console.error("❌ AUTH: No GitHub username available for profile creation");
              console.error("❌ AUTH: Available user data:", {
                userMetadata: session.user.user_metadata,
                identities: session.user.identities,
                email: session.user.email
              });

              // 🚨 ENHANCED FALLBACK: Try multiple username sources
              const fallbackUsername = session.user.user_metadata?.login ||
                                     session.user.user_metadata?.name ||
                                     session.user.email?.split('@')[0] ||
                                     `user_${session.user.id.substring(0, 8)}`;

              if (fallbackUsername) {
                console.log("🔧 AUTH: Using enhanced fallback username:", fallbackUsername);
                await createProfileWithUsername(session.user, fallbackUsername, githubId);
              } else {
                console.error("❌ AUTH: All fallback username methods failed");
                // Create basic profile to prevent "No account" state
                const basicProfile = {
                  id: session.user.id,
                  github_username: `user_${session.user.id.substring(0, 8)}`,
                  // Do not store OAuth provider token as PAT

                  display_name: session.user.email || 'User',
                  avatar_url: session.user.user_metadata?.avatar_url
                };
                setProfile(basicProfile);
                console.log("🔄 AUTH: Created basic profile to prevent 'No account' state");
              }
              return;
            }

            const { data: existingProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('github_username', githubUsername)
              .single();

            console.log("🔍 AUTH: Existing profile check:", {
              githubUsername,
              hasExistingProfile: !!existingProfile,
              existingProfileId: existingProfile?.id,
              currentUserId: session.user.id
            });

            if (existingProfile && existingProfile.id !== session.user.id) {
              console.log('🔧 FIXING: Found existing profile with different user ID, updating...');
              // Update the existing profile to use the new user ID
              const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                  id: session.user.id,
                  github_user_id: githubId,
                  display_name: session.user.user_metadata?.full_name,
                  avatar_url: session.user.user_metadata?.avatar_url,
                  updated_at: new Date().toISOString(),
                })
                .eq('github_username', session.user.user_metadata?.user_name);

              if (updateError) {
                console.error('❌ Failed to update existing profile:', updateError);
              } else {
                console.log('✅ Successfully linked to existing profile with token');
              }
            } else {
              // 🚨 SIMPLIFIED: Use helper method for profile creation
              console.log('🔧 AUTH: Creating/updating profile for user:', githubUsername);
              await createProfileWithUsername(session.user, githubUsername, githubId);
            }

            console.log("✅ AUTH: Profile linking completed");

            // 🔧 CRITICAL FIX: Only fetch profile if we haven't already updated it via OAuth
            let fetchedProfile;
            if (oauthProfileUpdated) {
              console.log('🔄 AUTH: Skipping fetchProfile - already updated via OAuth');
              fetchedProfile = profile; // Use the profile we already set
            } else {
              fetchedProfile = await fetchProfile(session.user.id);
            }

            // Simplified PAT popup logic for GitHub OAuth users
            // Also check for PAT cached locally
            const cachedPatToken = typeof window !== 'undefined' ? localStorage.getItem(`github_pat_token_${session.user.id}`) : null;

            console.log('🔍 PAT POPUP DEBUG:', {
              isGitHubOAuth,
              profileToken: !!fetchedProfile?.github_pat_token,
              cachedPatToken: !!cachedPatToken,
              userId: session.user.id,
              profile: fetchedProfile,
              oauthProfileUpdated
            });

            // 🚨 FIXED: Don't show PAT popup if user already has token
            if (isGitHubOAuth && (fetchedProfile?.github_pat_token || cachedPatToken)) {
              console.log('✅ PAT POPUP: User has token, marking as permanently skipped');
              // Mark as permanently skipped since user already has token
              localStorage.setItem(`token_popup_skipped_permanently_${session.user.id}`, 'true');
            } else if (isGitHubOAuth && !fetchedProfile?.github_pat_token && !cachedPatToken) {
              const permanentlySkipped = localStorage.getItem(`token_popup_skipped_permanently_${session.user.id}`);

              console.log('🔍 PAT POPUP STORAGE DEBUG:', {
                permanentlySkipped,
                shouldShow: !permanentlySkipped
              });

              // Only check if permanently skipped - remove complex timing logic
              if (!permanentlySkipped) {
                console.log('✅ PAT POPUP: Showing popup for GitHub OAuth user without token');
                setShowTokenPopupState(true);
              } else {
                console.log('❌ PAT POPUP: User permanently skipped token setup');
              }
            } else {
              console.log('❌ PAT POPUP: Not showing - either not GitHub OAuth or already has token');
            }

            console.log("✅ AUTH: Sign-in background process completed");
          } catch (error) {
            console.error("❌ AUTH: Sign-in background process error:", error);
            // Don't set loading false here - it's already set above
          }
        } else if (event === 'SIGNED_OUT') {
          console.log("👋 AUTH: User signed out");
          setProfile(null);
        }
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const signOut = async () => {
    // Show confirmation dialog before signing out
    const confirmed = window.confirm(
      "Are you sure you want to sign out?\n\n" +
      "This will:\n" +
      "• Sign you out from NeatRepo\n" +
      "• Clear all saved data"
    );

    if (!confirmed) {
      return; // User cancelled
    }

    // Store user info before clearing for signout page
    const userInfo = {
      username: user?.user_metadata?.user_name || user?.user_metadata?.preferred_username || 'User',
      email: user?.email || '',
      avatar: user?.user_metadata?.avatar_url || ''
    };

    // Clear dismiss tracking on sign out so popup shows for next login
    if (user) {
      localStorage.removeItem(`token_popup_dismissed_${user.id}`);
      localStorage.removeItem(`token_popup_skipped_permanently_${user.id}`);
    }

    // Clear local state first
    setProfile(null);

    // 🔒 CRITICAL FIX: Complete session cleanup to prevent user mixing
    // Clear ALL user-specific data from localStorage
    if (typeof window !== 'undefined') {
      // Clear all localStorage data to prevent cross-user contamination
      localStorage.clear();
      sessionStorage.clear();

      // Also clear any IndexedDB or other storage that might cause conflicts
      try {
        if ('caches' in window) {
          caches.keys().then(names => {
            names.forEach(name => {
              caches.delete(name);
            });
          });
        }
      } catch (error) {
        console.log('Cache clearing failed:', error);
      }

      console.log("🧹 AUTH: Cleared all localStorage, sessionStorage, and caches");
    }

    // Sign out from Supabase with global scope to revoke OAuth tokens
    await supabase.auth.signOut({ scope: 'global' });

    // Redirect to our custom signout page
    const signoutUrl = new URL('/signout', window.location.origin);
    signoutUrl.searchParams.set('username', userInfo.username);
    signoutUrl.searchParams.set('email', userInfo.email);
    signoutUrl.searchParams.set('avatar', userInfo.avatar);

    window.location.href = signoutUrl.toString();
  };

// 🔐 SAVE GITHUB PAT (handles first-time users too)
const updateToken = async (token: string) => {
  if (!user) return;
  setIsSubmitting(true);
  try {
    // Build a safe payload for upsert. For first-time users we need to satisfy NOT NULL constraints (e.g. github_username)
const basePayload: any = {
  id: user.id,
  github_pat_token: token,
  updated_at: new Date().toISOString(),
};

// If the profile hasn’t been created yet (or is missing critical fields) include sensible fallbacks
if (!profile) {
  const fallbackUsername =
    user.user_metadata?.user_name ||
    user.user_metadata?.preferred_username ||
    user.email?.split("@")[0] ||
    "user";

  basePayload.github_username = fallbackUsername;
  // GitHub user ID might be unavailable for non-GitHub auth – use null which is accepted by our DB
  basePayload.github_user_id = user.user_metadata?.user_id || null;
  basePayload.display_name =
    user.user_metadata?.full_name || user.user_metadata?.name || fallbackUsername;
}

const { error } = await supabase.from("user_profiles").upsert(basePayload, {
  onConflict: "id",
});

    if (error) throw error;

    setProfile(prev => (prev ? { ...prev, github_pat_token: token } : null));
    setShowTokenPopupState(false);

    // 🔒 SECURITY: Store token with user-specific key
    if (typeof window !== 'undefined') {
      localStorage.setItem(`github_pat_token_${user.id}`, token);
      localStorage.removeItem(`token_popup_dismissed_${user.id}`);
      localStorage.removeItem(`token_popup_skipped_permanently_${user.id}`);
      // Remove old global token key to prevent confusion
      localStorage.removeItem('github_pat_token');
      console.log('🔑 AUTH: Token stored with user-specific key');
    }
  } catch (error) {
    console.error('Error saving GitHub token:', error);
    // Show error to user but don't close popup
    alert('Failed to save token. Please try again.');
  } finally {
    setIsSubmitting(false);
  }
};

  const deleteToken = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ github_pat_token: null, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => (prev ? { ...prev, github_pat_token: null } : null));
      // Clear token from storage
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`github_pat_token_${user.id}`);
        console.log('🔑 AUTH: Token removed from local storage');
      }
    } catch (error) {
      console.error('Error deleting GitHub token:', error);
      alert('Failed to delete token. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

   const handleSkipToken = () => {
    if (user && typeof window !== 'undefined') {
      // Mark that user permanently skipped token setup - don't show popup again
      localStorage.setItem(`token_popup_skipped_permanently_${user.id}`, 'true');
    }
    setShowTokenPopupState(false);
};

  const handleTokenPopupClose = () => {
    if (user && typeof window !== 'undefined') {
      // Track that user dismissed popup - don't show again for 1 hour
      localStorage.setItem(`token_popup_dismissed_${user.id}`, Date.now().toString());
    }
    setShowTokenPopupState(false);
  };

  // Get effective token: PAT if available, otherwise OAuth token from session
  const getEffectiveToken = async (): Promise<string | null> => {
    // First priority: Personal Access Token from profile (for users who set up PAT)
    if (profile?.github_pat_token) {
      console.log('🔑 Using PAT token from profile');
      return profile.github_pat_token;
    }

    // Second priority: OAuth provider token stored during auth flow
    if (user && typeof window !== 'undefined') {
      const oauthProviderToken = localStorage.getItem(`oauth_provider_token_${user.id}`);
      if (oauthProviderToken) {
        console.log('🔑 Using stored OAuth provider token');
        return oauthProviderToken;
      }
    }

    // Third priority: User-specific cached token (legacy)
    if (user && typeof window !== 'undefined') {
      const userSpecificToken = localStorage.getItem(`github_pat_token_${user.id}`);
      if (userSpecificToken) {
        console.log('🔑 Using user-specific cached token');
        return userSpecificToken;
      }
    }

    // Fourth priority: OAuth token from current session (fallback for immediate use)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      console.log('🔍 OAUTH DEBUG: Checking session for OAuth token...', {
        hasSession: !!session,
        hasUser: !!session?.user,
        provider: session?.user?.app_metadata?.provider,
        hasProviderToken: !!session?.provider_token,
        tokenLength: session?.provider_token?.length
      });

      // Check if this is a GitHub OAuth user with a valid provider token
      if (session?.provider_token && session?.user?.app_metadata?.provider === 'github') {
        console.log('🔑 ✅ Using OAuth token from session for repository access');

        // Store it for future use if not already stored
        if (user && typeof window !== 'undefined') {
          const existingToken = localStorage.getItem(`oauth_provider_token_${user.id}`);
          if (!existingToken) {
            localStorage.setItem(`oauth_provider_token_${user.id}`, session.provider_token);
            console.log('✅ AUTH: Provider token stored from session for future use');
          }
        }

        return session.provider_token;
      }

      // If no provider token but user is GitHub OAuth user, they may need to re-authenticate
      if (session?.user?.app_metadata?.provider === 'github' && !session?.provider_token) {
        console.log('⚠️ GitHub OAuth user but no provider token - session may have expired');
        console.log('💡 User should re-authenticate or set up a Personal Access Token');
        return null;
      }
    } catch (error) {
      console.error('❌ Failed to get OAuth token from session:', error);
    }

    console.log('❌ No token available - user should authenticate or set up PAT');
    return null;
  };

  const value = {
    user,
    profile,
    loading,
    signOut,
    showTokenPopup: () => setShowTokenPopupState(true),
    hasToken: !!profile?.github_pat_token,
    getEffectiveToken,
    updateToken,
    deleteToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {showTokenPopupState && (
        <GitHubTokenPopup
          onTokenSubmit={updateToken}
          isSubmitting={isSubmitting}
          onClose={handleTokenPopupClose}
          onSkip={handleSkipToken}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
}
