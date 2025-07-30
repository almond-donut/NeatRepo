"use client"

import { useSearchParams, useRouter } from 'next/navigation'
import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { AlertCircle, Home, RefreshCw } from 'lucide-react'

export default function AuthErrorPage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const [error, setError] = useState<string>('')

  useEffect(() => {
    const errorParam = searchParams.get('error')
    setError(errorParam || 'Unknown authentication error')
  }, [searchParams])

  const handleRetry = () => {
    // User must manually navigate to retry authentication
    console.log('🔄 AUTH ERROR: User requested retry - manual navigation required')
    // Show message to user about manual navigation
    alert('Please manually navigate to the homepage to retry authentication.')
  }

  const handleGoHome = () => {
    // User must manually navigate to homepage
    console.log('🏠 AUTH ERROR: User requested home - manual navigation required')
    // Show message to user about manual navigation
    alert('Please manually navigate to the homepage.')
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-background">
      <div className="max-w-md w-full mx-4">
        <div className="text-center space-y-6">
          {/* Error Icon */}
          <div className="flex justify-center">
            <div className="rounded-full bg-destructive/10 p-3">
              <AlertCircle className="h-8 w-8 text-destructive" />
            </div>
          </div>

          {/* Error Title */}
          <div className="space-y-2">
            <h1 className="text-2xl font-bold tracking-tight">
              Authentication Error
            </h1>
            <p className="text-muted-foreground">
              We encountered an issue while trying to sign you in.
            </p>
          </div>

          {/* Error Details */}
          <div className="bg-muted/50 rounded-lg p-4">
            <p className="text-sm text-muted-foreground">
              <strong>Error:</strong> {error}
            </p>
          </div>

          {/* Action Buttons */}
          <div className="space-y-3">
            <Button
              onClick={handleRetry}
              className="w-full"
              size="lg"
            >
              <RefreshCw className="mr-2 h-4 w-4" />
              Manual Retry Required
            </Button>

            <Button
              onClick={handleGoHome}
              variant="outline"
              className="w-full"
              size="lg"
            >
              <Home className="mr-2 h-4 w-4" />
              Manual Navigation Required
            </Button>
          </div>

          {/* Manual Navigation Notice */}
          <div className="bg-yellow-50 dark:bg-yellow-900/20 border border-yellow-200 dark:border-yellow-800 rounded-lg p-4">
            <p className="text-sm text-yellow-800 dark:text-yellow-200">
              <strong>Note:</strong> Automatic redirects have been disabled. You must manually navigate to your desired page.
            </p>
          </div>

          {/* Help Text */}
          <div className="text-sm text-muted-foreground space-y-2">
            <p>If this problem persists, please try:</p>
            <ul className="text-left space-y-1 ml-4">
              <li>• Clearing your browser cache and cookies</li>
              <li>• Using an incognito/private browsing window</li>
              <li>• Checking your GitHub account permissions</li>
            </ul>
          </div>
        </div>
      </div>
    </div>
  )
}
