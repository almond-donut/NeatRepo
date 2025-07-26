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
  const [loading, setLoading] = useState(true);
  const [showTokenPopupState, setShowTokenPopupState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [lastActivity, setLastActivity] = useState(Date.now());
  const [sessionHealth, setSessionHealth] = useState<'healthy' | 'warning' | 'expired'>('healthy');

  const fetchProfile = async (userId: string) => {
    try {
      const { data, error } = await supabase
        .from('user_profiles')
        .select('*')
        .eq('id', userId)
        .single();

      if (error) {
        console.error('Error fetching profile:', error);
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

  // 🎯 YOUTUBE-STYLE: Long-term session health monitoring
  useEffect(() => {
    const checkSessionHealth = async () => {
      if (!user) return;

      try {
        const { data: { session }, error } = await supabase.auth.getSession();
        const now = Date.now();
        const timeSinceActivity = now - lastActivity;

        if (error || !session) {
          console.warn('⚠️ SESSION: Session expired or invalid');
          setSessionHealth('expired');
          return;
        }

        // Check if session is close to expiring (within 10 minutes)
        const expiresAt = session.expires_at ? session.expires_at * 1000 : 0;
        const timeUntilExpiry = expiresAt - now;

        if (timeUntilExpiry < 600000) { // 10 minutes
          console.warn('⚠️ SESSION: Session expiring soon, refreshing...');
          setSessionHealth('warning');
          await supabase.auth.refreshSession();
          setSessionHealth('healthy');
        } else if (timeSinceActivity > 7200000) { // 2 hours inactive
          console.log('💤 SESSION: Long inactivity detected, validating session...');
          setSessionHealth('warning');
          // Validate session is still good
          const { error: testError } = await supabase.from('user_profiles').select('id').limit(1);
          if (testError) {
            setSessionHealth('expired');
          } else {
            setSessionHealth('healthy');
          }
        }
      } catch (error) {
        console.error('❌ SESSION: Health check failed:', error);
        setSessionHealth('expired');
      }
    };

    // Check session health every 5 minutes
    const healthCheckInterval = setInterval(checkSessionHealth, 300000);

    // Also check on visibility change (when user returns to tab)
    const handleVisibilityChange = () => {
      if (!document.hidden) {
        setLastActivity(Date.now());
        checkSessionHealth();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);

    return () => {
      clearInterval(healthCheckInterval);
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [user, lastActivity]);

  useEffect(() => {
    const initializeSession = async () => {
      try {
        console.log('🚀 AUTH: INSTANT LOADING - Starting optimized initialization...');

        // 🚀 OPTIMIZED: Keep loading true initially to prevent hydration mismatch
        // We'll set loading false after session check to ensure consistency

        // Add timeout protection for session initialization
        const sessionTimeout = setTimeout(() => {
          console.warn('⏰ AUTH: Session initialization timeout - using fallback');
          setUser(null);
          setLoading(false);
        }, 15000); // Increased to 15 seconds for OAuth flows

        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 Session check:', { session: !!session, user: !!session?.user, error });

        if (session?.user) {
          console.log('✅ Setting user from session:', session.user.id);
          setUser(session.user);
          setLastActivity(Date.now());

          // 🚀 MANDATORY GITHUB CONNECTION CHECK:
          // All users must be connected to GitHub regardless of initial signup method
          const provider = session.user.app_metadata?.provider;
          const hasGitHubConnection = provider === 'github' || session.provider_token;
          
          console.log('🔍 AUTH: Provider check:', { provider, hasGitHubConnection });
          
          // If user is not connected to GitHub, force GitHub OAuth connection
          if (!hasGitHubConnection) {
            console.log('⚠️ AUTH: User not connected to GitHub, redirecting to GitHub OAuth...');
            // Clear current session and redirect to GitHub OAuth
            await supabase.auth.signOut();
            
            // Redirect to GitHub OAuth with current URL as redirect target
            const currentUrl = window.location.href;
            const { error } = await supabase.auth.signInWithOAuth({
              provider: 'github',
              options: {
                redirectTo: currentUrl,
                scopes: 'repo read:user user:email'
              }
            });
            
            if (error) {
              console.error('❌ AUTH: GitHub OAuth redirect failed:', error);
              // Fallback: redirect to home with error message
              window.location.href = '/?error=github_connection_required';
            }
            return; // Stop further processing
          }

          // 🚀 PARALLEL: Fetch profile in background without blocking UI
          fetchProfile(session.user.id).then((fetchedProfile) => {
            // Only show popup if user truly has no token AND hasn't permanently skipped
            if (!fetchedProfile?.github_token && typeof window !== 'undefined') {
              const permanentlySkipped = localStorage.getItem(`token_popup_skipped_permanently_${session.user.id}`);

              // Only show popup if user hasn't permanently skipped
              if (!permanentlySkipped) {
                setShowTokenPopupState(true);
              }
            }
            console.log('✅ Profile loaded in background');
          }).catch((error) => {
            console.error('❌ Background profile fetch failed:', error);
            // Create basic profile as fallback - only show popup for truly new users
            const basicProfile = {
              id: session.user.id,
              github_username: session.user.user_metadata?.user_name || 'user',
              github_token: null // Always null to force popup
            };
            setProfile(basicProfile);

            // Only show popup for new users (not returning users with fetch errors)
            if (typeof window !== 'undefined') {
              const permanentlySkipped = localStorage.getItem(`token_popup_skipped_permanently_${session.user.id}`);
              if (!permanentlySkipped) {
                setShowTokenPopupState(true);
              }
            }
          });
        } else {
          console.log('❌ No user in session');
          setUser(null);
        }

        clearTimeout(sessionTimeout);
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
          setLoading(true);

          // Add timeout protection for sign-in process
          const signInTimeout = setTimeout(() => {
            console.warn('⏰ AUTH: Sign-in process timeout - forcing completion');
            setLoading(false);
          }, 8000); // 8 second timeout

          try {
            // Check if user signed in with GitHub OAuth
            const isGitHubOAuth = session.user.app_metadata?.provider === 'github';
            const githubId = session.user.user_metadata?.provider_id || session.user.identities?.find(i => i.provider === 'github')?.id;

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
              // Only show popup for GitHub OAuth users, not Google/email users
              if (isGitHubOAuth) {
                const lastDismissed = localStorage.getItem(`token_popup_dismissed_${session.user.id}`);
                if (!lastDismissed) {
                  setShowTokenPopupState(true);
                }
              }
            } else {
              console.log("✅ AUTH: Profile upserted successfully");
              const fetchedProfile = await fetchProfile(session.user.id);

              // Only show GitHub token popup for GitHub OAuth users who don't have a token
              if (isGitHubOAuth && !fetchedProfile?.github_token) {
                const lastDismissed = localStorage.getItem(`token_popup_dismissed_${session.user.id}`);
                const now = Date.now();
                const dismissedTime = lastDismissed ? parseInt(lastDismissed) : 0;

                // Show popup if never dismissed or dismissed more than 1 hour ago
                if (!lastDismissed || (now - dismissedTime) > 3600000) {
                  setShowTokenPopupState(true);
                }
              }
            }

            clearTimeout(signInTimeout);
            setLoading(false);
            console.log("✅ AUTH: Sign-in process completed");
          } catch (error) {
            clearTimeout(signInTimeout);
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
    // Clear dismiss tracking on sign out so popup shows for next login
    if (user) {
      localStorage.removeItem(`token_popup_dismissed_${user.id}`);
      localStorage.removeItem(`token_popup_skipped_permanently_${user.id}`);
    }
    
    // Clear local state first
    setProfile(null);
    
    // Sign out from Supabase
    await supabase.auth.signOut();
    
    // 🚀 FACEBOOK-STYLE MULTI-ACCOUNT SUPPORT:
    // Also sign out from GitHub to allow switching accounts
    // This prevents the "sticky session" problem where users can't switch GitHub accounts
    const currentUrl = window.location.origin;
    const githubLogoutUrl = `https://github.com/logout`;
    
    // Create a form to POST to GitHub logout (required by GitHub)
    const form = document.createElement('form');
    form.method = 'POST';
    form.action = githubLogoutUrl;
    form.style.display = 'none';
    
    // Add authenticity token if we can get it (GitHub CSRF protection)
    // For now, we'll try the simpler approach of just redirecting
    document.body.appendChild(form);
    
    // Alternative approach: Direct redirect to GitHub logout with return URL
    // GitHub will handle the logout and redirect back
    window.location.href = `https://github.com/logout?return_to=${encodeURIComponent(currentUrl)}`;
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
