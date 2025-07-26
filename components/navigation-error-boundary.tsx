'use client'

import React from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { RefreshCw, Home } from 'lucide-react'

interface NavigationErrorBoundaryState {
  hasError: boolean
  error?: Error
}

interface NavigationErrorBoundaryProps {
  children: React.ReactNode
}

export class NavigationErrorBoundary extends React.Component<
  NavigationErrorBoundaryProps,
  NavigationErrorBoundaryState
> {
  constructor(props: NavigationErrorBoundaryProps) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError(error: Error): NavigationErrorBoundaryState {
    return { hasError: true, error }
  }

  componentDidCatch(error: Error, errorInfo: React.ErrorInfo) {
    console.error('🚨 Navigation Error Boundary caught an error:', error, errorInfo)
    
    // Send error details to console for debugging
    console.error('🔍 Error Details:', {
      message: error.message,
      stack: error.stack,
      name: error.name,
      componentStack: errorInfo.componentStack,
      errorBoundary: errorInfo.errorBoundary,
      timestamp: new Date().toISOString(),
      userAgent: typeof window !== 'undefined' ? window.navigator.userAgent : 'server',
      url: typeof window !== 'undefined' ? window.location.href : 'unknown'
    })
  }

  handleRefresh = () => {
    // Clear any cached data that might be causing issues
    localStorage.removeItem('github_repositories')
    localStorage.removeItem('github_repositories_time')
    
    // Reset error state and reload
    this.setState({ hasError: false })
    window.location.reload()
  }

  handleGoHome = () => {
    // Clear cached data and go to home
    localStorage.removeItem('github_repositories')
    localStorage.removeItem('github_repositories_time')
    window.location.href = '/'
  }

  render() {
    if (this.state.hasError) {
      // In production, try to render children anyway for minor errors
      // Only show error UI for critical navigation errors
      if (process.env.NODE_ENV === 'production') {
        console.warn('NavigationErrorBoundary caught error in production, attempting graceful recovery')
        // Reset error state and try to render children
        setTimeout(() => {
          this.setState({ hasError: false, error: undefined })
        }, 100)
      }
      
      return (
        <div className="min-h-screen flex items-center justify-center p-4">
          <div className="max-w-md w-full space-y-4">
            <Alert variant="destructive">
              <AlertDescription>
                Something went wrong with navigation. This might be due to browser back/forward 
                navigation or a temporary issue.
              </AlertDescription>
            </Alert>
            
            <div className="space-y-2">
              <Button 
                onClick={this.handleRefresh} 
                className="w-full"
                variant="default"
              >
                <RefreshCw className="mr-2 h-4 w-4" />
                Refresh Page
              </Button>
              
              <Button 
                onClick={this.handleGoHome} 
                className="w-full"
                variant="outline"
              >
                <Home className="mr-2 h-4 w-4" />
                Go to Home
              </Button>
            </div>
            
            {process.env.NODE_ENV === 'development' && (
              <details className="text-xs text-muted-foreground">
                <summary>Error Details (Development)</summary>
                <pre className="mt-2 p-2 bg-muted rounded text-xs overflow-auto">
                  {this.state.error?.stack}
                </pre>
              </details>
            )}
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
