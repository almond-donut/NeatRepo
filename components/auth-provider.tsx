"use client"

import React, { useEffect, useState } from "react";
import { User } from "@supabase/supabase-js";
import { supabase } from "@/lib/supabase";
import { AuthContext, AuthContextType, UserProfile, useAuth } from "./auth/auth-context";
import { fetchProfileService, updateTokenService, deleteTokenService, validateTokenService } from "@/lib/auth/profile-service";
import GitHubTokenPopup from "./github-token-popup";

// Re-export useAuth for convenience if other files import it from here
export { useAuth };

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const [showTokenPopupState, setShowTokenPopupState] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  // Track if the token is invalid
  const [isTokenInvalid, setIsTokenInvalid] = useState(false);

  useEffect(() => {
    setLoading(true);
    console.log("🚀 AUTH: Provider mounted. Setting up auth listener.");
    
    const { data: { subscription } } = supabase.auth.onAuthStateChange(
        async (event, session) => {
            console.log("🔄 AUTH: Auth state changed:", { event, hasSession: !!session });

            if (session?.user) {
                const currentUser = session.user;
                setUser(currentUser);

                if (typeof window !== 'undefined') {
                    sessionStorage.setItem('current_user_id', currentUser.id);
                }

                if (typeof window !== 'undefined') {
                    const cachedPat = localStorage.getItem(`github_pat_token_${currentUser.id}`);
                    if (cachedPat && !cachedPat.startsWith('gho_')) {
                        console.log('🔄 AUTH: Preemptively hydrating profile with cached PAT.');
                        setProfile(prev => ({ ...(prev || { id: currentUser.id }), github_pat_token: cachedPat } as UserProfile));
                    }
                }
                

                const fetchedProfile = await fetchProfileService(currentUser.id, currentUser);
                setProfile(fetchedProfile);

                // ✨ NEW VALIDATION LOGIC ✨
                // If the fetched profile contains a PAT, validate it immediately on load.
                if (fetchedProfile?.github_pat_token) {
                    const isTokenValid = await validateTokenService(fetchedProfile.github_pat_token);
                    if (!isTokenValid) {
                        setIsTokenInvalid(true);
                    }
                }

            } else {
                setUser(null);
                setProfile(null);
                if (typeof window !== 'undefined') {
                    sessionStorage.removeItem('current_user_id');
                }
            }

            setLoading(false);
            console.log("✅ AUTH: State processing complete. Loading is now false.");
        }
    );

    const initialSessionCheck = async () => {
        const { data: { session } } = await supabase.auth.getSession();
        if (!session) {
            setLoading(false);
            console.log("✅ AUTH: No initial session found. Authentication finished.");
        }
    };

    initialSessionCheck();

    return () => {
        subscription.unsubscribe();
    };
}, []);

  const signOut = async () => {
    const userInfo = {
      username: profile?.github_username || user?.email || 'User',
      avatar: profile?.avatar_url || user?.user_metadata?.avatar_url || ''
    };
  
    if (user) {
      localStorage.removeItem(`token_popup_skipped_permanently_${user.id}`);
    }
  
    setProfile(null);
  
    if (typeof window !== 'undefined') {
      localStorage.clear();
      sessionStorage.clear();
    }
  
    await supabase.auth.signOut({ scope: 'global' });
  
    const signoutUrl = new URL('/signout', window.location.origin);
    signoutUrl.searchParams.set('username', userInfo.username);
    signoutUrl.searchParams.set('avatar', userInfo.avatar);
    window.location.href = signoutUrl.toString();
  };

  const updateToken = async (token: string) => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await updateTokenService(user.id, token);
      setProfile(prev => (prev ? { ...prev, github_pat_token: token } : null));
      setIsTokenInvalid(false); // Reset invalid status on update
      if (typeof window !== 'undefined') {
        localStorage.setItem(`github_pat_token_${user.id}`, token);
        localStorage.removeItem(`token_popup_skipped_permanently_${user.id}`);
      }
      setShowTokenPopupState(false);
    } catch (error) {
      alert('Failed to save token. Please check the console for details.');
      console.error("AuthProvider: updateToken failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const deleteToken = async () => {
    if (!user) return;
    setIsSubmitting(true);
    try {
      await deleteTokenService(user.id);
      setProfile(prev => (prev ? { ...prev, github_pat_token: undefined } : null));
      if (typeof window !== 'undefined') {
        localStorage.removeItem(`github_pat_token_${user.id}`);
      }
    } catch (error) {
      alert('Failed to delete token. Please try again.');
      console.error("AuthProvider: deleteToken failed", error);
    } finally {
      setIsSubmitting(false);
    }
  };

  const getEffectiveToken = async (): Promise<string | null> => {
    console.log("--- 🕵️‍♂️ getEffectiveToken Diagnostic ---");

    // Priority 1: Check the live profile state from React.
    if (profile) {
        if (profile.github_pat_token) {
            console.log("✅ [SUCCESS] Found PAT in the loaded profile state.");
            console.log("--- Diagnostic END ---");
            return profile.github_pat_token;
        } else {
            console.log("🟡 [INFO] Profile is loaded, but it does not contain a PAT.");
        }
    } else {
        console.log("🟡 [INFO] Profile state is currently null (still loading or not found).");
    }

    // Priority 2: Check localStorage as a fast fallback. This is crucial for hard refreshes.
    if (user && typeof window !== 'undefined') {
        const key = `github_pat_token_${user.id}`;
        const cachedPat = localStorage.getItem(key);
        
        if (cachedPat) {
            if (!cachedPat.startsWith('gho_')) {
                console.log("✅ [SUCCESS] Found PAT in localStorage cache.");
                console.log("--- Diagnostic END ---");
                return cachedPat;
            } else {
                console.log("🔴 [ERROR] An OAuth token (gho_) was incorrectly saved as a PAT in localStorage. Ignoring it.");
            }
        } else {
            console.log(`🟡 [INFO] No PAT found in localStorage for key: \"${key}\"`);
        }
    } else {
        console.log("🟡 [INFO] Cannot check localStorage because the user object isn't available yet.");
    }

    console.log("🔴 [FAILURE] No valid Personal Access Token (PAT) was found.");
    console.log("--- Diagnostic END ---");
    return null; // Explicitly return null. DO NOT fall back to any other token.
  };
  
  const handleSkipToken = () => {
    if (user && typeof window !== 'undefined') {
      localStorage.setItem(`token_popup_skipped_permanently_${user.id}`, 'true');
    }
    setShowTokenPopupState(false);
  };

  const value: AuthContextType = {
    user,
    profile,
    loading,
    signOut,
    showTokenPopup: () => setShowTokenPopupState(true),
    getEffectiveToken,
    updateToken,
    deleteToken,
    isTokenInvalid,
    markTokenAsInvalid: () => setIsTokenInvalid(true),
  };

  return (
    <AuthContext.Provider value={value}>
      {showTokenPopupState && (
        <GitHubTokenPopup
          onTokenSubmit={updateToken}
          isSubmitting={isSubmitting}
          onClose={() => setShowTokenPopupState(false)}
          onSkip={handleSkipToken}
        />
      )}
      {children}
    </AuthContext.Provider>
  );
}