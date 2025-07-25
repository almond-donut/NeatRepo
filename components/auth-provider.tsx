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
            github_token: process.env.NEXT_PUBLIC_GITHUB_TOKEN || null,
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

        // For other errors, create basic profile
        const basicProfile = {
          id: userId,
          github_username: user?.user_metadata?.user_name || 'user',
          github_token: process.env.NEXT_PUBLIC_GITHUB_TOKEN || null
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
        console.log('🚀 AUTH: Starting session initialization...');

        // Add timeout protection for session initialization
        const sessionTimeout = setTimeout(() => {
          console.warn('⏰ AUTH: Session initialization timeout - forcing completion');
          setLoading(false);
        }, 10000); // 10 second timeout

        const { data: { session }, error } = await supabase.auth.getSession();
        console.log('🔍 Session check:', { session: !!session, user: !!session?.user, error });

        if (session?.user) {
          console.log('✅ Setting user from session:', session.user.id);
          setUser(session.user);
          setLastActivity(Date.now()); // Track initial activity

          console.log('✅ User found, fetching profile...');
          const fetchedProfile = await fetchProfile(session.user.id);
          if (!fetchedProfile?.github_token) {
            setShowTokenPopupState(true);
          }
        } else {
          console.log('❌ No user in session');
          setUser(null);
        }

        clearTimeout(sessionTimeout);
        setLoading(false);
        console.log('✅ AUTH: Session initialization completed');
      } catch (err) {
        console.error('❌ AUTH: Session initialization error:', err);
        setLoading(false); // Always stop loading on error
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
            } else {
              console.log("✅ AUTH: Profile upserted successfully");
              const fetchedProfile = await fetchProfile(session.user.id);
              if (!fetchedProfile?.github_token) {
                setShowTokenPopupState(true);
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
    setProfile(null);
    await supabase.auth.signOut();
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
    } catch (error) {
      console.error('Error saving GitHub token:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const value = {
    user,
    profile,
    loading,
    signOut,
    showTokenPopup: () => setShowTokenPopupState(true),
  };

  return (
    <AuthContext.Provider value={value}>
      {showTokenPopupState && (
        <GitHubTokenPopup
          onTokenSubmit={handleTokenSubmit}
          isSubmitting={isSubmitting}
          onClose={() => setShowTokenPopupState(false)}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
}
