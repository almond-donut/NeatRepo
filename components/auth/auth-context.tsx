"use client"

import { createContext, useContext } from "react";
import { User } from "@supabase/supabase-js";

// Define the shape of your user profile data
export interface UserProfile {
  id: string;
  github_pat_token?: string;
  github_username?: string;
  avatar_url?: string;
  [key: string]: any;
}

// Define the shape of the context that components will consume
export interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
  showTokenPopup: () => void;
  getEffectiveToken: () => Promise<string | null>;
  updateToken: (token: string) => Promise<void>;
  deleteToken: () => Promise<void>;
  isTokenInvalid: boolean;
  markTokenAsInvalid: () => void;
}

// Create the context with an undefined default value
export const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Create the custom hook for consuming the context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};