import { useState, useEffect, useCallback } from "react"
import { useAuth } from "@/components/auth-provider"
import { supabase } from "@/lib/supabase"

interface AccountInfo {
  id: string
  email: string
  username: string
  avatar_url?: string
  last_used: string
  github_id?: string
}

interface UseAccountSwitcherReturn {
  accounts: AccountInfo[]
  currentAccount: AccountInfo | null
  isLoading: boolean
  error: string | null
  switchAccount: (accountId: string) => Promise<void>
  addAccount: () => Promise<void>
  removeAccount: (accountId: string) => void
  signOutAll: () => Promise<void>
  refreshAccounts: () => void
}

const STORAGE_KEY = 'neatrepo_accounts'
const MAX_ACCOUNTS = 5

export function useAccountSwitcher(): UseAccountSwitcherReturn {
  const { user, profile, signOut } = useAuth()
  const [accounts, setAccounts] = useState<AccountInfo[]>([])
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Load accounts from localStorage
  const loadAccounts = useCallback(() => {
    if (typeof window === 'undefined') return []
    
    try {
      const saved = localStorage.getItem(STORAGE_KEY)
      if (saved) {
        const parsed = JSON.parse(saved)
        // Validate and clean up old accounts
        const validAccounts = parsed.filter((acc: any) => 
          acc.id && acc.email && acc.username && acc.last_used
        )
        return validAccounts
      }
    } catch (error) {
      console.error('Failed to load accounts:', error)
    }
    return []
  }, [])

  // Save accounts to localStorage
  const saveAccounts = useCallback((accountsToSave: AccountInfo[]) => {
    if (typeof window === 'undefined') return
    
    try {
      // Keep only the most recent MAX_ACCOUNTS
      const sortedAccounts = accountsToSave
        .sort((a, b) => new Date(b.last_used).getTime() - new Date(a.last_used).getTime())
        .slice(0, MAX_ACCOUNTS)
      
      localStorage.setItem(STORAGE_KEY, JSON.stringify(sortedAccounts))
      setAccounts(sortedAccounts)
    } catch (error) {
      console.error('Failed to save accounts:', error)
      setError('Failed to save account data')
    }
  }, [])

  // Update current account in the list
  const updateCurrentAccount = useCallback(() => {
    if (!user || !profile) return

    const currentAccount: AccountInfo = {
      id: user.id,
      email: user.email || '',
      username: profile.github_username || user.user_metadata?.user_name || 'Unknown',
      avatar_url: user.user_metadata?.avatar_url,
      last_used: new Date().toISOString(),
      github_id: profile.github_id || user.user_metadata?.provider_id
    }

    setAccounts(prev => {
      const filtered = prev.filter(acc => acc.id !== user.id)
      const updated = [currentAccount, ...filtered]
      saveAccounts(updated)
      return updated
    })
  }, [user, profile, saveAccounts])

  // Initialize accounts on mount
  useEffect(() => {
    const loadedAccounts = loadAccounts()
    setAccounts(loadedAccounts)
  }, [loadAccounts])

  // Update current account when user/profile changes
  useEffect(() => {
    updateCurrentAccount()
  }, [updateCurrentAccount])

  // Get current account
  const currentAccount = accounts.find(acc => acc.id === user?.id) || null

  // Switch to a different account
  const switchAccount = useCallback(async (accountId: string) => {
    if (accountId === user?.id) return // Already current account
    
    setIsLoading(true)
    setError(null)

    try {
      // Just sign out from Supabase (no GitHub logout for account switching)
      await supabase.auth.signOut()
      
      // Redirect to GitHub OAuth with account hint
      const currentUrl = window.location.origin
      const targetAccount = accounts.find(acc => acc.id === accountId)
      
      if (targetAccount?.github_id) {
        // If we have GitHub ID, we can hint to GitHub which account to use
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: `${currentUrl}/dashboard`,
            scopes: 'repo read:user user:email',
            queryParams: {
              login: targetAccount.username, // Hint to GitHub
              prompt: 'select_account' // Force account selection
            }
          }
        })
        
        if (error) throw error
      } else {
        // Fallback: just redirect to OAuth with account selection
        const { error } = await supabase.auth.signInWithOAuth({
          provider: 'github',
          options: {
            redirectTo: `${currentUrl}/dashboard`,
            scopes: 'repo read:user user:email',
            queryParams: {
              prompt: 'select_account' // Force account selection
            }
          }
        })
        
        if (error) throw error
      }
    } catch (error) {
      console.error('Failed to switch account:', error)
      setError('Failed to switch account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [user?.id, accounts])

  // Add a new account
  const addAccount = useCallback(async () => {
    setIsLoading(true)
    setError(null)

    try {
      // Just sign out from Supabase (no GitHub logout for adding accounts)
      await supabase.auth.signOut()
      
      // Redirect to GitHub OAuth for new account
      const currentUrl = window.location.origin
      const { error } = await supabase.auth.signInWithOAuth({
        provider: 'github',
        options: {
          redirectTo: `${currentUrl}/dashboard`,
          scopes: 'repo read:user user:email',
          queryParams: {
            prompt: 'select_account' // Force account selection
          }
        }
      })
      
      if (error) throw error
    } catch (error) {
      console.error('Failed to add account:', error)
      setError('Failed to add new account. Please try again.')
    } finally {
      setIsLoading(false)
    }
  }, [])

  // Remove an account from the list
  const removeAccount = useCallback((accountId: string) => {
    if (accountId === user?.id) {
      setError('Cannot remove the currently active account')
      return
    }

    setAccounts(prev => {
      const filtered = prev.filter(acc => acc.id !== accountId)
      saveAccounts(filtered)
      return filtered
    })
  }, [user?.id, saveAccounts])

  // Sign out from all accounts
  const signOutAll = useCallback(async () => {
    // Show confirmation dialog before signing out all accounts
    const confirmed = window.confirm(
      "Sign out from all accounts?\n\n" +
      "This will:\n" +
      "• Remove all saved GitHub accounts\n" +
      "• Sign you out completely\n" +
      "• Redirect to GitHub logout\n\n" +
      "You'll need to sign in again to use NeatRepo."
    );
    
    if (!confirmed) {
      return; // User cancelled
    }

    setIsLoading(true)
    setError(null)

    try {
      // Clear all saved accounts
      if (typeof window !== 'undefined') {
        localStorage.removeItem(STORAGE_KEY)
      }
      setAccounts([])
      
      // Sign out completely
      await signOut()
    } catch (error) {
      console.error('Failed to sign out all accounts:', error)
      setError('Failed to sign out from all accounts')
    } finally {
      setIsLoading(false)
    }
  }, [signOut])

  // Refresh accounts list
  const refreshAccounts = useCallback(() => {
    const loadedAccounts = loadAccounts()
    setAccounts(loadedAccounts)
    updateCurrentAccount()
  }, [loadAccounts, updateCurrentAccount])

  return {
    accounts,
    currentAccount,
    isLoading,
    error,
    switchAccount,
    addAccount,
    removeAccount,
    signOutAll,
    refreshAccounts
  }
}