"use client"

import { User, LogOut, Settings } from "lucide-react"
import { ThemeToggle } from "@/components/theme-toggle"
import { useTheme } from "next-themes"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"

import { useAuth } from "@/components/auth-provider"
import { useRouter } from "next/navigation"

export default function DashboardHeader() {
  const { user, profile, loading, signOut } = useAuth()
  const router = useRouter()
  const { theme } = useTheme()

  // Prefer avatar from profile, fallback to metadata
  const avatarSrc = profile?.avatar_url || user?.user_metadata?.avatar_url;

  const handleSignOut = async () => {
    await signOut();
    // Redirect is handled within the AuthProvider's signOut implementation
  }

  const handleSignIn = () => {
    window.location.href = '/'
  }

  const handleProfileSettings = () => {
    router.push('/profile')
  }

  return (
    <header className="border-b border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
      <div className="container mx-auto px-4 py-3">
        <div className="flex items-center justify-between">
          {/* Logo & Brand */}
          <div className="flex items-center space-x-3">
            <img 
              src={theme === 'dark' ? '/logo-dark.png' : '/logo-light.png'}
              alt="NeatRepo Logo"
              className="h-8 w-8"
            />
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

            {/* User Menu with Profile Settings */}
            {user ? (
              <div className="flex items-center space-x-2">
                                {avatarSrc ? (
                  <img
                    src={avatarSrc}
                    alt={profile?.username || user?.user_metadata?.user_name || 'User'}
                    className="w-6 h-6 rounded-full"
                  />
                ) : (
                  <User className="w-4 h-4" />
                )}
                <span className="text-sm">
                  {profile?.username || user.email || 'User'}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleProfileSettings}
                  disabled={loading}
                >
                  <Settings className="w-4 h-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={handleSignOut}
                  disabled={loading}
                >
                  <LogOut className="w-4 h-4" />
                </Button>
              </div>
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
