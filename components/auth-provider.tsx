"use client"

import React, { createContext, useContext, useEffect, useState } from "react";
import GitHubTokenPopup from "./github-token-popup";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";

interface UserProfile {
  id: string;
  github_token?: string;
  [key: string]: any;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  showTokenPopup: () => void;
  getEffectiveToken: () => Promise<string | null>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(false); // CRITICAL FIX: Start with loading false
  const [showTokenPopupState, setShowTokenPopupState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
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
          const newProfile = {
            id: userId,
            github_username: user?.user_metadata?.user_name || 'user',
            github_token: null, // Always null for new users to force popup
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

        // For other errors, create basic profile - always null token to force popup
        const basicProfile = {
          id: userId,
          github_username: user?.user_metadata?.user_name || 'user',
          github_token: null // Always null to force popup
        };
        setProfile(basicProfile);
        return basicProfile;
      } else {
        console.log("✅ AUTH: Profile fetched successfully:", {
          id: data.id,
          github_username: data.github_username,
          hasToken: !!data.github_token,
          avatar_url: data.avatar_url
        });
        setProfile(data);
        return data;
      }
    } catch (err) {
      console.error('Profile fetch failed:', err);
      // Create a basic profile on any error
      const basicProfile = {
        id: userId,
        github_username: user?.user_metadata?.user_name || 'user',
        github_token: null
      };
      setProfile(basicProfile);
      return basicProfile;
    }
  };

  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log('🚀 AUTH: INSTANT LOADING - Starting optimized initialization...');

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
                  console.log('✅ AUTH: OAuth login complete - redirecting to dashboard');
                  window.location.href = '/dashboard';
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

        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 Session check:', { session: !!session, user: !!session?.user, error });

        if (session?.user) {
          console.log('✅ Setting user from session:', session.user.id);
          setUser(session.user);

          // GitHub connection check is now handled by AuthGuard component
          // This prevents conflicts between multiple redirect attempts

          // 🚀 PARALLEL: Fetch profile in background without blocking UI
          fetchProfile(session.user.id).then((fetchedProfile) => {
            // Check if this is a GitHub OAuth user
            const isGitHubOAuth = session.user.app_metadata?.provider === 'github';
            
            console.log('🔍 INITIAL PAT POPUP DEBUG:', {
              isGitHubOAuth,
              hasToken: !!fetchedProfile?.github_token,
              userId: session.user.id,
              profile: fetchedProfile
            });

            // Show PAT popup for GitHub OAuth users who don't have a token
            if (isGitHubOAuth && !fetchedProfile?.github_token && typeof window !== 'undefined') {
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
              github_token: null // Always null to force popup
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

        setLoading(false); // Set loading false after session check to prevent hydration mismatch
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
        setUser(session?.user ?? null);

        if (event === 'SIGNED_IN' && session?.user) {
          // CRITICAL FIX: Don't set loading true - this causes the loading loop
          // setLoading(true);

          // REMOVED: No more sign-in timeouts - let the session persist naturally

          try {
            // Check if user signed in with GitHub OAuth
            const isGitHubOAuth = session.user.app_metadata?.provider === 'github';
            const githubId = session.user.user_metadata?.provider_id || session.user.identities?.find(i => i.provider === 'github')?.id;

            // 🚨 FIX: Check for existing profile by github_username first
            const { data: existingProfile } = await supabase
              .from('user_profiles')
              .select('*')
              .eq('github_username', session.user.user_metadata?.user_name)
              .single();

            if (existingProfile && existingProfile.id !== session.user.id) {
              console.log('🔧 FIXING: Found existing profile with different user ID, updating...');
              // Update the existing profile to use the new user ID
              const { error: updateError } = await supabase
                .from('user_profiles')
                .update({
                  id: session.user.id,
                  github_id: githubId,
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
              // Normal upsert for new profiles or same user ID
              const { error: upsertError } = await supabase
                .from('user_profiles')
                .upsert({
                  id: session.user.id,
                  github_id: githubId,
                  github_username: session.user.user_metadata?.user_name,
                  display_name: session.user.user_metadata?.full_name,
                  avatar_url: session.user.user_metadata?.avatar_url,
                  updated_at: new Date().toISOString(),
                }, { onConflict: 'id' });

              if (upsertError) {
                console.error("❌ AUTH: Error upserting profile:", upsertError);
              }
            }

            console.log("✅ AUTH: Profile linking completed");
            const fetchedProfile = await fetchProfile(session.user.id);

            // Simplified PAT popup logic for GitHub OAuth users
            console.log('🔍 PAT POPUP DEBUG:', {
              isGitHubOAuth,
              hasToken: !!fetchedProfile?.github_token,
              userId: session.user.id,
              profile: fetchedProfile
            });

            // 🚨 FIXED: Don't show PAT popup if user already has token
            if (isGitHubOAuth && fetchedProfile?.github_token) {
              console.log('✅ PAT POPUP: User has token, marking as permanently skipped');
              // Mark as permanently skipped since user already has token
              localStorage.setItem(`token_popup_skipped_permanently_${session.user.id}`, 'true');
            } else if (isGitHubOAuth && !fetchedProfile?.github_token) {
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

            setLoading(false);
            console.log("✅ AUTH: Sign-in process completed");
          } catch (error) {
            console.error("❌ AUTH: Sign-in process error:", error);
            setLoading(false);
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
      "• Sign you out from GitHub (to allow account switching)\n" +
      "• Clear all saved account data"
    );

    if (!confirmed) {
      return; // User cancelled
    }

    // 🎯 GOOGLE-STYLE SIGNOUT: Store user info before clearing for signout page
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

    // Sign out from Supabase
    await supabase.auth.signOut();

    // 🚀 GOOGLE-STYLE MULTI-ACCOUNT SUPPORT:
    // Redirect to our custom signout page instead of GitHub
    // This keeps users on our platform with professional UX
    const signoutUrl = new URL('/signout', window.location.origin);
    signoutUrl.searchParams.set('username', userInfo.username);
    signoutUrl.searchParams.set('email', userInfo.email);
    signoutUrl.searchParams.set('avatar', userInfo.avatar);

    window.location.href = signoutUrl.toString();
  };

  const handleTokenSubmit = async (token: string) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('user_profiles')
        .update({ github_token: token, updated_at: new Date().toISOString() })
        .eq('id', user.id);

      if (error) throw error;

      setProfile(prev => (prev ? { ...prev, github_token: token } : null));
      setShowTokenPopupState(false);

      // Mark that user has provided token - clear any skip flags
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`token_popup_dismissed_${user.id}`);
        localStorage.removeItem(`token_popup_skipped_permanently_${user.id}`);
      }
    } catch (error) {
      console.error('Error saving GitHub token:', error);
      // Show error to user but don't close popup
      alert('Failed to save token. Please try again.');
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

  // Get effective token: PAT if available, otherwise OAuth token
  const getEffectiveToken = async (): Promise<string | null> => {
    // First priority: Personal Access Token from profile
    if (profile?.github_token) {
      return profile.github_token;
    }

    // Second priority: OAuth token from session (for GitHub OAuth users)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      if (session?.provider_token && session?.user?.app_metadata?.provider === 'github') {
        console.log('🔑 Using OAuth token as fallback for repository access');
        return session.provider_token;
      }
    } catch (error) {
      console.error('❌ Failed to get OAuth token:', error);
    }

    return null;
  };

  const value = {
    user,
    profile,
    loading,
    signOut,
    showTokenPopup: () => setShowTokenPopupState(true),
    hasToken: !!profile?.github_token,
    getEffectiveToken,
  };

  return (
    <AuthContext.Provider value={value}>
      {showTokenPopupState && (
        <GitHubTokenPopup
          onTokenSubmit={handleTokenSubmit}
          isSubmitting={isSubmitting}
          onClose={handleTokenPopupClose}
          onSkip={handleSkipToken}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
}
