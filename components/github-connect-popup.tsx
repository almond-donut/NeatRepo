"use client"

import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Github, Shield, Zap, X } from "lucide-react"
import { supabase } from "@/lib/supabase"

interface GitHubConnectPopupProps {
  onClose: () => void
  onSkip: () => void
  userEmail?: string
}

export default function GitHubConnectPopup({ onClose, onSkip, userEmail }: GitHubConnectPopupProps) {
  const [isConnecting, setIsConnecting] = useState(false)

  const handleConnectGitHub = async () => {
    setIsConnecting(true)
    
    try {
      const currentUrl = window.location.href
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: currentUrl,
          scopes: 'repo read:user user:email'
        }
      })
      
      if (error) {
        console.error('❌ GitHub OAuth failed:', error)
        setIsConnecting(false)
      }
    } catch (error) {
      console.error('❌ GitHub connection error:', error)
      setIsConnecting(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      <Card className="w-full max-w-md mx-auto">
        <CardHeader className="text-center">
          <div className="flex items-center justify-between">
            <div className="flex-1" />
            <Github className="h-8 w-8 text-primary" />
            <Button
              variant="ghost"
              size="sm"
              onClick={onClose}
              className="flex-shrink-0"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
          <CardTitle className="text-xl">Connect Your GitHub Account</CardTitle>
          <CardDescription>
            To access your repositories and use NeatRepo's features, please connect your GitHub account.
          </CardDescription>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {userEmail && (
            <div className="bg-muted p-3 rounded-lg text-sm">
              <p className="text-muted-foreground">Currently signed in as:</p>
              <p className="font-medium">{userEmail}</p>
            </div>
          )}
          
          <div className="space-y-3">
            <div className="flex items-center space-x-3 text-sm">
              <Shield className="h-4 w-4 text-green-500" />
              <span>Secure OAuth authentication</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Zap className="h-4 w-4 text-blue-500" />
              <span>Access your repositories</span>
            </div>
            <div className="flex items-center space-x-3 text-sm">
              <Github className="h-4 w-4 text-purple-500" />
              <span>Manage repositories efficiently</span>
            </div>
          </div>
          
          <div className="space-y-3 pt-4">
            <Button 
              onClick={handleConnectGitHub}
              disabled={isConnecting}
              className="w-full"
              size="lg"
            >
              {isConnecting ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2" />
                  Connecting...
                </>
              ) : (
                <>
                  <Github className="h-4 w-4 mr-2" />
                  Connect GitHub Account
                </>
              )}
            </Button>
            
            <Button 
              variant="outline" 
              onClick={onSkip}
              className="w-full"
              disabled={isConnecting}
            >
              Skip for now
              <Badge variant="secondary" className="ml-2 text-xs">
                Limited features
              </Badge>
            </Button>
          </div>
          
          <p className="text-xs text-muted-foreground text-center">
            You can connect your GitHub account later from your profile settings.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
