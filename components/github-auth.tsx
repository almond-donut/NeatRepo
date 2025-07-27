"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { Github, Users, Zap, Shield, GitBranch, Star, X, AlertCircle } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface GitHubAuthProps {
  onClose?: () => void
}

export default function GitHubAuth({ onClose }: GitHubAuthProps) {
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const handleGitHubSignIn = async () => {
    setIsLoading(true)
    setError(null)

    try {
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          scopes: 'repo read:user',
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) {
        throw error
      }
    } catch (err: any) {
      console.error('GitHub OAuth error:', err)
      setError(err.message || 'Failed to sign in with GitHub')
      setIsLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-lg mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <Github className="h-10 w-10 text-primary" />
            {onClose && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onClose}
                className="flex-shrink-0"
              >
                <X className="h-4 w-4" />
              </Button>
            )}
          </div>
          <CardTitle className="text-2xl">Welcome to NeatRepo</CardTitle>
          <CardDescription className="text-base">
            Professional GitHub Repository Management
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-6">
          {error && (
            <Alert variant="destructive">
              <AlertCircle className="h-4 w-4" />
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          )}
          
          {/* Features Grid */}
          <div className="grid grid-cols-2 gap-4 text-sm">
            <div className="flex items-center space-x-3">
              <Users className="h-4 w-4 text-blue-500" />
              <span>Multi-Account Support</span>
            </div>
            <div className="flex items-center space-x-3">
              <Zap className="h-4 w-4 text-yellow-500" />
              <span>Lightning Fast</span>
            </div>
            <div className="flex items-center space-x-3">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Secure OAuth</span>
            </div>
            <div className="flex items-center space-x-3">
              <GitBranch className="h-4 w-4 text-purple-500" />
              <span>Bulk Operations</span>
            </div>
          </div>
          
          {/* Multi-Account Highlight */}
          <div className="bg-gradient-to-r from-blue-50 to-purple-50 dark:from-blue-950/20 dark:to-purple-950/20 p-4 rounded-lg border">
            <div className="flex items-center space-x-2 mb-2">
              <Star className="h-4 w-4 text-yellow-500" />
              <span className="font-semibold text-sm">Facebook-Style Multi-Account</span>
              <Badge variant="secondary" className="text-xs">New</Badge>
            </div>
            <p className="text-sm text-muted-foreground">
              Switch between multiple GitHub accounts seamlessly. Perfect for developers managing personal and work repositories.
            </p>
          </div>
          
          {/* Sign In Button */}
          <Button 
            onClick={handleGitHubSignIn}
            disabled={isLoading}
            className="w-full h-12 text-base"
            size="lg"
          >
            {isLoading ? (
              <>
                <div className="animate-spin rounded-full h-5 w-5 border-b-2 border-white mr-3" />
                Connecting to GitHub...
              </>
            ) : (
              <>
                <Github className="h-5 w-5 mr-3" />
                Continue with GitHub
              </>
            )}
          </Button>
          
          {/* Benefits */}
          <div className="space-y-2 text-xs text-muted-foreground">
            <p className="flex items-center justify-center space-x-1">
              <Shield className="h-3 w-3" />
              <span>We only request necessary permissions</span>
            </p>
            <p className="flex items-center justify-center space-x-1">
              <Users className="h-3 w-3" />
              <span>Easy account switching • No email required</span>
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}
