"use client"

import { Github, User, LogOut } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"

export default function DashboardHeader() {
  const { user, profile, loading } = useAuth()

  const handleSignOut = async () => {
    await supabase.auth.signOut()
    window.location.href = '/'
  }

  const handleSignIn = () => {
    window.location.href = '/'
  }

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <Github className="h-8 w-8 text-primary" />
            <div className="flex flex-col">
              <span className="text-xl font-bold">NeatRepo</span>
              <div className="flex items-center space-x-2">
                <Badge variant="secondary" className="text-xs">
                  Dashboard
                </Badge>
              </div>
            </div>
          </div>

          {/* Navigation Actions */}
          <div className="flex items-center space-x-4">
            <ThemeToggle />

            {/* Simple Sign In/Out Button */}
            {user ? (
              <Button
                variant="ghost"
                onClick={handleSignOut}
                className="flex items-center space-x-2"
                disabled={loading}
              >
                {profile?.avatar_url ? (
                  <img
                    src={profile.avatar_url}
                    alt={profile.username || 'User'}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {profile?.username || user.email || 'User'}
                </span>
                <LogOut className="w-4 h-4" />
              </Button>
            ) : (
              <Button
                variant="ghost"
                onClick={handleSignIn}
                disabled={loading}
              >
                <User className="w-4 h-4 mr-2" />
                Sign In
              </Button>
            )}
          </div>
        </div>
      </div>
    </header>
  )
}
