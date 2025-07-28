"use client"

import { useEffect, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useAuth } from './auth-provider'

interface AuthGuardProps {
  children: React.ReactNode
  requireAuth?: boolean
}

export function AuthGuard({ children, requireAuth = true }: AuthGuardProps) {
  const { user, loading } = useAuth()
  const router = useRouter()
  const searchParams = useSearchParams()
  const [isChecking, setIsChecking] = useState(true)

  useEffect(() => {
    // If we don't require auth, just render children
    if (!requireAuth) {
      setIsChecking(false)
      return
    }

    // If still loading, wait
    if (loading) {
      return
    }

    // Check for auth success parameter (fresh from OAuth)
    const authSuccess = searchParams.get('auth')
    if (authSuccess === 'success') {
      console.log('🔄 AUTH GUARD: Auth success parameter detected, waiting for session...')
      
      // Give the session a moment to establish after OAuth callback
      const sessionTimeout = setTimeout(() => {
        if (!user) {
          console.log('⚠️ AUTH GUARD: Session not established after OAuth - user must manually navigate')
          // REMOVED: Automatic redirect - user must manually choose where to go
        } else {
          console.log('✅ AUTH GUARD: Session established successfully')
          // Clean up the URL parameter
          const url = new URL(window.location.href)
          url.searchParams.delete('auth')
          window.history.replaceState({}, '', url.toString())
        }
        setIsChecking(false)
      }, 2000) // Give 2 seconds for session to establish

      return () => clearTimeout(sessionTimeout)
    }

    // Normal auth check
    if (!user) {
      console.log('🚫 AUTH GUARD: No user found - user must manually navigate')
      // REMOVED: Automatic redirect - user must manually choose where to go
      setIsChecking(false)
      return
    }

    console.log('✅ AUTH GUARD: User authenticated, allowing access')
    setIsChecking(false)
  }, [user, loading, requireAuth, router, searchParams])

  // Show loading state while checking auth
  if (isChecking || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p className="text-muted-foreground">Authenticating...</p>
        </div>
      </div>
    )
  }

  // If we require auth and don't have a user, don't render children
  if (requireAuth && !user) {
    return null
  }

  return <>{children}</>
}