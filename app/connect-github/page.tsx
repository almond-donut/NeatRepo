"use client"

export const dynamic = 'force-dynamic'

import { useEffect, useState } from 'react'
import { useAuth } from '@/components/auth-provider'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { Github, ArrowRight, Shield, Zap, Trash2 } from 'lucide-react'
import { supabase } from '@/lib/supabase'
import { useRouter } from 'next/navigation'

export default function ConnectGitHubPage() {
  const { user, loading } = useAuth()
  const [isConnecting, setIsConnecting] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const router = useRouter()

  // Redirect if not authenticated
  useEffect(() => {
    if (!loading && !user) {
      router.push('/')
    }
  }, [user, loading, router])
  // Check if user already has GitHub connection
  useEffect(() => {
    if (user) {
      // Check if user signed up with GitHub
      const provider = user.app_metadata?.provider
      if (provider === 'github') {
      router.push('/') // Use router for navigation
        window.location.href = '/dashboard'
      }
    }
  }, [user])

  const handleConnectGitHub = async () => {
    setIsConnecting(true)
    setError(null)
        router.push('/dashboard') // Use router for navigation
    try {
      const { error } = await supabase.auth.linkIdentity({
        provider: 'github',
        options: {
          redirectTo: `${window.location.origin}/dashboard`,
          queryParams: {
            access_type: 'offline',
            prompt: 'consent',
          }
        }
      })

      if (error) throw error
    } catch (error: any) {
      console.error('GitHub connection error:', error)
      setError(error.message)
      setIsConnecting(false)
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background flex items-center justify-center p-4">
      <div className="max-w-md w-full space-y-6">
        <div className="text-center space-y-2">
          <div className="mx-auto w-12 h-12 bg-primary/10 rounded-full flex items-center justify-center">
            <Github className="w-6 h-6 text-primary" />
          </div>
          <h1 className="text-2xl font-bold">Connect Your GitHub Account</h1>
          <p className="text-muted-foreground">
            To use NeatRepo, you need to connect your GitHub account to access your repositories.
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="w-5 h-5 text-green-500" />
              Why Connect GitHub?
            </CardTitle>
            <CardDescription>
              NeatRepo is a GitHub portfolio management tool that helps you organize and showcase your repositories.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-3">
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                  <Zap className="w-4 h-4 text-blue-600" />
                </div>
                <div>
                  <p className="font-medium">Access Your Repositories</p>
                  <p className="text-sm text-muted-foreground">View and manage all your GitHub repos</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-red-100 rounded-full flex items-center justify-center">
                  <Trash2 className="w-4 h-4 text-red-600" />
                </div>
                <div>
                  <p className="font-medium">Bulk Delete Feature</p>
                  <p className="text-sm text-muted-foreground">Delete multiple repos at once (requires GitHub token)</p>
                </div>
              </div>
              
              <div className="flex items-center gap-3">
                <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                  <ArrowRight className="w-4 h-4 text-green-600" />
                </div>
                <div>
                  <p className="font-medium">Portfolio Management</p>
                  <p className="text-sm text-muted-foreground">Organize repos for job applications</p>
                </div>
              </div>
            </div>

            <div className="pt-4 border-t">
              <Badge variant="secondary" className="mb-3">
                🔒 Secure & Private
              </Badge>
              <p className="text-xs text-muted-foreground">
                We only request necessary permissions and never store your GitHub credentials. 
                You can revoke access anytime from your GitHub settings.
              </p>
            </div>
          </CardContent>
        </Card>

        {error && (
          <div className="p-3 bg-red-50 border border-red-200 rounded-md">
            <p className="text-sm text-red-600">{error}</p>
          </div>
        )}

        <Button 
          onClick={handleConnectGitHub} 
          disabled={isConnecting}
          className="w-full"
          size="lg"
        >
          {isConnecting ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
              Connecting...
            </>
          ) : (
            <>
              <Github className="mr-2 h-4 w-4" />
              Connect with GitHub
            </>
          )}
        </Button>

        <p className="text-center text-xs text-muted-foreground">
          By connecting, you agree to our terms of service and privacy policy.
        </p>
      </div>
    </div>
  )
}
